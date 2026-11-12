# India Green Grid

A decision-support platform for India's renewable energy transition, built on official public data.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

To refresh the data from the government reports (needs Python 3 and `pip install pdfplumber`):

```bash
npm run ingest
```

## What is in it

| Module | Page | Data |
|---|---|---|
| D1 Live energy mix dashboard | `/` | MERIT India (live MW by source), CEA installed capacity and daily generation |
| D2 RPO compliance tracker | `/rpo` | Ministry of Power RPO trajectory, FY 2024-25 to 2029-30 |
| D3 Rooftop solar calculator | `/solar` | NASA POWER sunshine data, PM Surya Ghar subsidy rules |
| D4 Green jobs board | `/jobs` | Sample listings (clearly labelled) with links to official portals |
| Provenance and validation | `/data` | Source log, validation report, API list |

## How the data flows

```
npp.gov.in (CEA PDFs) --pipeline/ingest.py--> data/clean/*.json --lib/data.js--> pages + /api/*
meritindia.in (live)  --lib/live.js, re-read every 5 minutes--------------------> /api/live
power.larc.nasa.gov   --app/api/solar, cached 30 days--------------------------> /api/solar
```

- `pipeline/ingest.py` downloads the reports, parses the tables, and cross-checks every table against the totals
  printed in the report. Results are in `data/clean/validation.json`.
- Raw PDFs are kept in `data/raw/` and are never edited. Missing values are never filled in.
- `db/schema.sql` is the Postgres schema for moving the snapshots into Supabase.

## Sources

- Central Electricity Authority reports, published on the National Power Portal (npp.gov.in)
- MERIT India, Ministry of Power (meritindia.in)
- NASA POWER climatology API (power.larc.nasa.gov)
- Ministry of Power RPO notification, 20 October 2023
- PM Surya Ghar: Muft Bijli Yojana subsidy rules (pmsuryaghar.gov.in)

## Known limits

- CEA's daily generation report excludes solar, wind and other renewable generation.
- The RPO framework was superseded by a Renewable Consumption Obligation notification in 2025.
- Solar tariff, installed cost and the grid emission factor (0.727 kg CO2 per kWh) are stated assumptions.
- Job listings are sample data; there is no open government feed of green jobs.
- The Lightfall background is from React Bits (reactbits.dev).
