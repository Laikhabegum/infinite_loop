// Chart colours. The ORDER is what keeps neighbouring colours distinguishable
// for colour-blind readers (checked with a palette validator against this
// site's dark card surface) - keep series in this order when stacking.
export const SOURCE = {
  hydro: { label: 'Large hydro', color: '#3987e5' },
  coal: { label: 'Coal & lignite', color: '#d95926' },
  otherRes: { label: 'Bio, small hydro & waste', color: '#199e70' },
  solar: { label: 'Solar', color: '#c98500' },
  nuclear: { label: 'Nuclear', color: '#d55181' },
  wind: { label: 'Wind', color: '#008300' },
  gas: { label: 'Gas & diesel', color: '#9085e9' }
};
export const STACK_ORDER = ['hydro', 'coal', 'otherRes', 'solar', 'nuclear', 'wind', 'gas'];
// Daily-generation series (CEA groups coal, lignite and gas as "thermal").
export const GEN_SERIES = [
  { key: 'thermal', label: 'Thermal (coal, lignite, gas)', color: SOURCE.coal.color },
  { key: 'hydro', label: 'Large hydro', color: SOURCE.hydro.color },
  { key: 'nuclear', label: 'Nuclear', color: SOURCE.nuclear.color }
];
export const INK ={ primary: '#f0efec', secondary: '#c3c2b7', muted: '#898781', grid: '#232a27', axis: '#38403c' };
