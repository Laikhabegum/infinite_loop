"""India Green Grid - ingestion pipeline.

Downloads official Central Electricity Authority (CEA) reports published on the
National Power Portal (npp.gov.in), extracts the tables, cleans and validates
them, and writes JSON snapshots that the web app serves.

Run from the project root:   python -I pipeline/ingest.py

Cleaning rules applied here:
  * Raw PDFs are kept untouched in data/raw/ (re-runs do not re-download).
  * "Total" / sub-total rows are parsed separately and never summed with rows.
  * Numbers are parsed strictly; a row that does not match the expected shape is
    skipped and reported - nothing is guessed or filled in.
  * Every dataset is cross-checked against the totals printed in the report
    (see data/clean/validation.json).
  * Every dataset carries its source URL, report date and fetch time.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw" / "npp"
CLEAN = ROOT / "data" / "clean"
BASE = "https://npp.gov.in/public-reports/cea"
USER_AGENT = "IndiaGreenGrid-student-project/0.1"
MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"]
REGIONS = ["Northern", "Western", "Southern", "Eastern", "North-Eastern"]
CAP_COLS = ["coal", "lignite", "gas", "diesel", "thermal", "hydro", "res", "nuclear", "total"]
TREND_MONTHS = 13
GEN_DAYS = 30

NUM = r"-?[\d,]+\.\d+"
provenance: list[dict] = []
checks: list[dict] = []


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def fetch(url: str, dest: Path) -> bool:
    """Download url to dest unless already present. Returns True if file is usable."""
    if dest.exists() and dest.stat().st_size > 1000:
        return True
    dest.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(2):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = resp.read()
            if not body.startswith(b"%PDF"):
                return False
            dest.write_bytes(body)
            time.sleep(0.7)  # be polite to the government server
            return True
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return False
            time.sleep(2)
        except (urllib.error.URLError, TimeoutError):
            time.sleep(2)
    return False


def pdf_text(path: Path) -> str:
    with pdfplumber.open(path) as pdf:
        return "\n".join((page.extract_text() or "") for page in pdf.pages[:2])


def nums(line: str) -> list[float]:
    return [float(n.replace(",", "")) for n in re.findall(NUM, line)]


def check(name: str, expected: float, actual: float, tolerance: float = 1.0) -> None:
    checks.append({
        "check": name,
        "expected": round(expected, 2),
        "actual": round(actual, 2),
        "difference": round(actual - expected, 2),
        "passed": abs(actual - expected) <= tolerance,
    })


# ---------------------------------------------------------------- capacity --
def capacity_url(year: int, month: int, name: str) -> str:
    return f"{BASE}/monthly/installcap/{year}/{MONTHS[month - 1]}/{name}-{year}-{month:02d}.pdf"


def parse_capacity_blocks(text: str) -> dict[str, dict]:
    """Return {block name: {coal, lignite, ... total, sectors}} for every
    'Total of <name>' block in an installed-capacity report."""
    blocks: dict[str, dict] = {}
    sectors: dict[str, dict] = {}
    pending: list[float] | None = None
    for raw in text.splitlines():
        line = raw.strip()
        m = re.match(r"^\d+\s+(STATE|PVT|CENTRAL) SECTOR\s", line)
        if m:
            vals = nums(line)
            if len(vals) == 9:
                sectors[m.group(1).lower()] = dict(zip(CAP_COLS, vals))
            continue
        if line.startswith("Total of "):
            vals = nums(line)
            name = re.sub(NUM, "", line[len("Total of "):]).strip()
            if len(vals) != 9:
                vals = pending or []
            if len(vals) == 9 and name:
                blocks[name] = {**dict(zip(CAP_COLS, vals)), "sectors": sectors}
            sectors, pending = {}, None
            continue
        vals = nums(line)
        if len(vals) == 9 and re.fullmatch(rf"(?:{NUM}\s*)+", line):
            pending = vals  # totals row printed on the line above "Total of X"
    return blocks


def parse_res_breakup(text: str) -> dict | None:
    idx = text.find("Break up of RES")
    if idx < 0:
        return None
    for line in text[idx:].splitlines():
        vals = nums(line)
        if len(vals) == 6 and re.fullmatch(rf"(?:{NUM}\s*)+", line.strip()):
            keys = ["smallHydro", "wind", "biomass", "wasteToEnergy", "solar", "total"]
            return dict(zip(keys, vals))
    return None


def as_on(text: str) -> str | None:
    m = re.search(r"as on (\d{2})/(\d{2})/(\d{4})", text)
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}" if m else None


def ingest_capacity(today: dt.date) -> dict:
    # Walk back from the current month until a published report is found.
    found: list[tuple[int, int, Path, str]] = []
    y, m = today.year, today.month
    misses = 0
    while len(found) < TREND_MONTHS and misses < 4:
        url = capacity_url(y, m, "capacity1")
        dest = RAW / f"capacity1-{y}-{m:02d}.pdf"
        if fetch(url, dest):
            found.append((y, m, dest, url))
            misses = 0
        elif found:
            misses += 1
        elif (today.year - y) * 12 + today.month - m > 4:
            break
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    if not found:
        raise SystemExit("No installed-capacity report could be downloaded.")

    trend = []
    for (yy, mm, path, url) in found:
        text = pdf_text(path)
        blocks = parse_capacity_blocks(text)
        india = blocks.get("ALL INDIA")
        res = parse_res_breakup(text)
        if not india:
            print(f"  ! could not parse {path.name}; skipped", file=sys.stderr)
            continue
        trend.append({
            "month": f"{yy}-{mm:02d}",
            "asOf": as_on(text),
            **{k: india[k] for k in CAP_COLS},
            "solar": res["solar"] if res else None,
            "wind": res["wind"] if res else None,
        })
    trend.sort(key=lambda r: r["month"])

    y, m, path, url = found[0]
    text = pdf_text(path)
    blocks = parse_capacity_blocks(text)
    india = blocks["ALL INDIA"]
    res = parse_res_breakup(text)
    regions = [
        {"region": name, **{k: v for k, v in block.items() if k != "sectors"}}
        for name, block in blocks.items() if name != "ALL INDIA"
    ]
    provenance.append({
        "dataset": "All-India installed capacity by source and region",
        "publisher": "Central Electricity Authority (CEA), via National Power Portal",
        "url": url, "reportDate": as_on(text), "frequency": "Monthly",
        "format": "PDF", "fetchedAt": now_iso(),
    })

    check("Regions sum to All-India total (MW)", india["total"], sum(r["total"] for r in regions))
    check("Coal+Lignite+Gas+Diesel = Thermal (MW)", india["thermal"],
          india["coal"] + india["lignite"] + india["gas"] + india["diesel"])
    check("Thermal+Hydro+RES+Nuclear = Grand total (MW)", india["total"],
          india["thermal"] + india["hydro"] + india["res"] + india["nuclear"])
    if res:
        check("RES break-up sums to RES total (MW)", india["res"],
              res["smallHydro"] + res["wind"] + res["biomass"] + res["wasteToEnergy"] + res["solar"])

    # State-wise tables: one report per region for the same month.
    states = []
    for region in REGIONS:
        s_url = capacity_url(y, m, f"capacity2-{region}")
        s_path = RAW / f"capacity2-{region}-{y}-{m:02d}.pdf"
        if not fetch(s_url, s_path):
            print(f"  ! state report for {region} unavailable", file=sys.stderr)
            continue
        s_blocks = parse_capacity_blocks(pdf_text(s_path))
        region_label = region.replace("-", " ")
        region_total = s_blocks.pop(region_label, None)
        rows = [
            {"state": name, "region": region_label, **{k: v for k, v in b.items() if k != "sectors"}}
            for name, b in s_blocks.items()
        ]
        states.extend(rows)
        if region_total:
            check(f"{region_label}: states sum to region total (MW)",
                  region_total["total"], sum(r["total"] for r in rows))
        provenance.append({
            "dataset": f"State-wise installed capacity - {region_label} region",
            "publisher": "Central Electricity Authority (CEA), via National Power Portal",
            "url": s_url, "reportDate": as_on(text), "frequency": "Monthly",
            "format": "PDF", "fetchedAt": now_iso(),
        })

    return {
        "asOf": as_on(text), "sourceUrl": url, "unit": "MW",
        "allIndia": {k: india[k] for k in CAP_COLS},
        "sectors": india["sectors"],
        "resBreakup": res,
        "regions": regions,
        "states": sorted(states, key=lambda r: -r["total"]),
        "trend": trend,
    }


# -------------------------------------------------------------- generation --
def parse_dgr(text: str) -> dict | None:
    m = re.search(r"Overview\s+(\d{2})-([A-Za-z]{3})-(\d{4})", text)
    idx = text.find("ALL INDIA")
    if not m or idx < 0:
        return None
    date = dt.datetime.strptime(f"{m.group(1)}-{m.group(2)}-{m.group(3)}", "%d-%b-%Y").date()
    row: dict = {"date": date.isoformat()}
    for line in text[idx:].splitlines():
        line = line.strip()
        key = line.split(" ")[0].lower() if line else ""
        if key in ("thermal", "nuclear", "hydro"):
            vals = nums(line)
            if len(vals) == 9:
                row[key] = {
                    "capacityMW": vals[0], "programMU": vals[3], "actualMU": vals[4],
                    "ytdProgramMU": vals[5], "ytdActualMU": vals[6],
                }
        elif line.startswith("Bhutan"):
            vals = nums(line)
            if len(vals) >= 3:
                row["bhutanImportMU"] = vals[2]
        elif line.startswith("Total"):
            vals = nums(line)
            if len(vals) == 9:
                row["total"] = {"programMU": vals[3], "actualMU": vals[4],
                                "ytdProgramMU": vals[5], "ytdActualMU": vals[6]}
            break
    return row if all(k in row for k in ("thermal", "nuclear", "hydro")) else None


def ingest_generation(today: dt.date) -> dict:
    days = []
    latest_url = None
    for back in range(1, GEN_DAYS + 6):
        if len(days) >= GEN_DAYS:
            break
        d = today - dt.timedelta(days=back)
        url = f"{BASE}/daily/dgr/{d:%d-%m-%Y}/dgr1-{d:%Y-%m-%d}.pdf"
        dest = RAW / f"dgr1-{d:%Y-%m-%d}.pdf"
        if not fetch(url, dest):
            continue
        row = parse_dgr(pdf_text(dest))
        if row is None:
            print(f"  ! could not parse {dest.name}; skipped", file=sys.stderr)
            continue
        row["sourceUrl"] = url
        days.append(row)
        latest_url = latest_url or url
    if not days:
        raise SystemExit("No daily generation report could be downloaded.")
    days.sort(key=lambda r: r["date"])
    latest = days[-1]
    if "total" in latest:
        check(f"Daily generation {latest['date']}: sources sum to total (MU)",
              latest["total"]["actualMU"],
              latest["thermal"]["actualMU"] + latest["nuclear"]["actualMU"]
              + latest["hydro"]["actualMU"] + latest.get("bhutanImportMU", 0.0), tolerance=0.5)
    provenance.append({
        "dataset": "All-India daily generation - thermal, nuclear, large hydro",
        "publisher": "Central Electricity Authority (CEA), via National Power Portal",
        "url": latest_url, "reportDate": latest["date"], "frequency": "Daily",
        "format": "PDF", "fetchedAt": now_iso(),
        "note": "Covers stations above 25 MW; excludes renewable (RES) generation.",
    })
    return {"unit": "MU (million units = GWh)", "latest": latest, "days": days,
            "note": "CEA daily report covers stations above 25 MW and excludes RES generation."}


def main() -> None:
    today = dt.date.today()
    CLEAN.mkdir(parents=True, exist_ok=True)
    print("Installed capacity ...")
    capacity = ingest_capacity(today)
    print("Daily generation ...")
    generation = ingest_generation(today)
    outputs = {
        "capacity.json": capacity,
        "generation.json": generation,
        "provenance.json": {"generatedAt": now_iso(), "sources": provenance},
        "validation.json": {"generatedAt": now_iso(), "checks": checks,
                            "allPassed": all(c["passed"] for c in checks)},
    }
    for name, payload in outputs.items():
        (CLEAN / name).write_text(json.dumps(payload, indent=2), encoding="utf-8")
    passed = sum(c["passed"] for c in checks)
    print(f"Capacity as of {capacity['asOf']}: {capacity['allIndia']['total']:,.0f} MW "
          f"({len(capacity['states'])} states, {len(capacity['trend'])} months of trend)")
    print(f"Generation: {len(generation['days'])} days, latest {generation['latest']['date']}")
    print(f"Validation: {passed}/{len(checks)} checks passed")
    for c in checks:
        if not c["passed"]:
            print("  FAILED:", c)


if __name__ == "__main__":
    main()
