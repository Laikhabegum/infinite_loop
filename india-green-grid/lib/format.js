const nf0 = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const int = n => nf0.format(n);
export const one = n => nf1.format(n);
export const gw = mw => nf1.format(mw / 1000);
export const pct = (part, whole) => (whole ? nf1.format((100 * part) / whole) : '–');
export const rupees = n => '₹' + nf0.format(Math.round(n));

export const longDate = iso =>
  new Date(iso.length === 10 ? iso + 'T00:00:00' : iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

export const monthLabel = ym => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};
