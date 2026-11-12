// Rooftop solar estimator - shared by the API route and the calculator UI.

// Capital-city coordinates are used to look up sunshine for each state.
// `special: true` marks states/UTs that get the higher PM Surya Ghar subsidy rate.
export const STATES = [
  { name: 'Andhra Pradesh', city: 'Amaravati', lat: 16.51, lon: 80.52 },
  { name: 'Arunachal Pradesh', city: 'Itanagar', lat: 27.08, lon: 93.61, special: true },
  { name: 'Assam', city: 'Guwahati', lat: 26.14, lon: 91.74, special: true },
  { name: 'Bihar', city: 'Patna', lat: 25.59, lon: 85.14 },
  { name: 'Chhattisgarh', city: 'Raipur', lat: 21.25, lon: 81.63 },
  { name: 'Delhi', city: 'New Delhi', lat: 28.61, lon: 77.21 },
  { name: 'Goa', city: 'Panaji', lat: 15.49, lon: 73.83 },
  { name: 'Gujarat', city: 'Gandhinagar', lat: 23.22, lon: 72.65 },
  { name: 'Haryana', city: 'Chandigarh', lat: 30.73, lon: 76.78 },
  { name: 'Himachal Pradesh', city: 'Shimla', lat: 31.1, lon: 77.17, special: true },
  { name: 'Jammu & Kashmir', city: 'Srinagar', lat: 34.08, lon: 74.8, special: true },
  { name: 'Jharkhand', city: 'Ranchi', lat: 23.34, lon: 85.31 },
  { name: 'Karnataka', city: 'Bengaluru', lat: 12.97, lon: 77.59 },
  { name: 'Kerala', city: 'Thiruvananthapuram', lat: 8.52, lon: 76.94 },
  { name: 'Ladakh', city: 'Leh', lat: 34.15, lon: 77.58, special: true },
  { name: 'Madhya Pradesh', city: 'Bhopal', lat: 23.26, lon: 77.41 },
  { name: 'Maharashtra', city: 'Mumbai', lat: 19.08, lon: 72.88 },
  { name: 'Manipur', city: 'Imphal', lat: 24.82, lon: 93.94, special: true },
  { name: 'Meghalaya', city: 'Shillong', lat: 25.58, lon: 91.89, special: true },
  { name: 'Mizoram', city: 'Aizawl', lat: 23.73, lon: 92.72, special: true },
  { name: 'Nagaland', city: 'Kohima', lat: 25.67, lon: 94.11, special: true },
  { name: 'Odisha', city: 'Bhubaneswar', lat: 20.3, lon: 85.82 },
  { name: 'Punjab', city: 'Chandigarh', lat: 30.73, lon: 76.78 },
  { name: 'Rajasthan', city: 'Jaipur', lat: 26.91, lon: 75.79 },
  { name: 'Sikkim', city: 'Gangtok', lat: 27.33, lon: 88.61, special: true },
  { name: 'Tamil Nadu', city: 'Chennai', lat: 13.08, lon: 80.27 },
  { name: 'Telangana', city: 'Hyderabad', lat: 17.39, lon: 78.49 },
  { name: 'Tripura', city: 'Agartala', lat: 23.83, lon: 91.29, special: true },
  { name: 'Uttar Pradesh', city: 'Lucknow', lat: 26.85, lon: 80.95 },
  { name: 'Uttarakhand', city: 'Dehradun', lat: 30.32, lon: 78.03, special: true },
  { name: 'West Bengal', city: 'Kolkata', lat: 22.57, lon: 88.36 }
];

// Assumptions - shown to the user next to every result.
export const ASSUMPTIONS = {
  performanceRatio: 0.75, // share of sunshine a real rooftop system converts, after heat, dust and inverter losses
  costPerKw: 55000, // typical installed cost in rupees per kW; editable in the calculator
  tariff: 7, // rupees per unit; editable - depends on the user's own DISCOM slab
  gridEmissionFactor: 0.727, // kg CO2 per kWh, CEA CO2 Baseline Database (FY 2023-24 grid average)
  maxKw: 10
};

// PM Surya Ghar: Muft Bijli Yojana central subsidy for homes.
// Rs 30,000 per kW for the first 2 kW, Rs 18,000 for the third kW, capped at Rs 78,000.
// Special-category states and UTs get 10% more.
export function subsidy(kw, special = false) {
  const base = 30000 * Math.min(kw, 2) + 18000 * Math.max(0, Math.min(kw, 3) - 2);
  return Math.round(Math.min(base, 78000) * (special ? 1.1 : 1));
}

export function estimateSolar({ monthlyUnits, tariff, irradiance, costPerKw, special }) {
  if (!(monthlyUnits > 0) || !(tariff > 0) || !(irradiance > 0) || !(costPerKw > 0)) return null;
  const annualUnits = monthlyUnits * 12;
  const yieldPerKw = irradiance * 365 * ASSUMPTIONS.performanceRatio; // units per kW per year
  const sizeKw = Math.min(ASSUMPTIONS.maxKw, Math.max(1, Math.round((annualUnits / yieldPerKw) * 2) / 2));
  const generation = sizeKw * yieldPerKw;
  const offset = Math.min(generation, annualUnits);
  const grossCost = sizeKw * costPerKw;
  const subsidyAmount = Math.min(subsidy(sizeKw, special), grossCost);
  const netCost = grossCost - subsidyAmount;
  const annualSavings = offset * tariff;
  return {
    sizeKw,
    yieldPerKw,
    generation,
    billCovered: (100 * offset) / annualUnits,
    grossCost,
    subsidy: subsidyAmount,
    netCost,
    annualSavings,
    paybackYears: netCost / annualSavings,
    co2TonnesPerYear: (generation * ASSUMPTIONS.gridEmissionFactor) / 1000
  };
}
