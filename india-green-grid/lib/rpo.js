// Renewable Purchase Obligation trajectory: the minimum share of an obligated
// entity's electricity consumption that must come from renewable sources.
// Source: Ministry of Power notification of 20 October 2023 (FY 2024-25 to 2029-30).
// A Renewable Consumption Obligation (RCO) notification issued in 2025 supersedes
// this framework - check the current gazette text before using these figures
// for a real compliance filing.
export const RPO_TRAJECTORY = [
  { fy: '2024-25', target: 29.91 },
  { fy: '2025-26', target: 33.01 },
  { fy: '2026-27', target: 35.95 },
  { fy: '2027-28', target: 38.81 },
  { fy: '2028-29', target: 41.36 },
  { fy: '2029-30', target: 43.33 }
];

export function rpoCompliance({ fy, consumptionMU, renewableMU }) {
  const row = RPO_TRAJECTORY.find(r => r.fy === fy);
  if (!row || !(consumptionMU > 0) || !(renewableMU >= 0)) return null;
  const achieved = (100 * renewableMU) / consumptionMU;
  const requiredMU = (row.target / 100) * consumptionMU;
  const shortfallMU = Math.max(0, requiredMU - renewableMU);
  return {
    fy,
    target: row.target,
    achieved,
    compliance: (100 * achieved) / row.target,
    requiredMU,
    shortfallMU,
    surplusMU: Math.max(0, renewableMU - requiredMU),
    compliant: shortfallMU === 0
  };
}
