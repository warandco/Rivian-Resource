// Builds scripts/gas-prices.json from EIA weekly retail regular gasoline prices.
// Usage: node scripts/build-gas-prices.js eia_raw.json
//
// Every state gets a live EIA figure: its own state series where EIA publishes one,
// otherwise its PADD region average (West Coast states other than CA use the
// "West Coast less California" series). Nothing is hardcoded. If the national
// figure is missing the script exits non-zero and leaves the old file untouched.

const fs = require('fs');

const raw = JSON.parse(fs.readFileSync(process.argv[2] || 'eia_raw.json', 'utf8'));
const rows = (raw.response && raw.response.data) || [];

// Latest value + period per series (rows are sorted newest first)
const latest = {};
for (const d of rows) {
  const v = parseFloat(d.value);
  if (!latest[d.series] && !isNaN(v) && v > 0) latest[d.series] = { value: v, period: d.period };
}

const S = code => `EMM_EPMR_PTE_${code}_DPG`;
const national = latest[S('NUS')];
if (!national) {
  console.error('No national price in EIA response; leaving gas-prices.json unchanged.');
  process.exit(1);
}

// EIA state-level series (only these states are published weekly)
const STATE_SERIES = { CA:'SCA', CO:'SCO', FL:'SFL', MA:'SMA', MN:'SMN', NY:'SNY', OH:'SOH', TX:'STX', WA:'SWA' };
const STATE_NAMES  = { CA:'California', CO:'Colorado', FL:'Florida', MA:'Massachusetts', MN:'Minnesota', NY:'New York', OH:'Ohio', TX:'Texas', WA:'Washington' };

// PADD regions
const REGIONS = {
  R10: { name: 'East Coast',   states: ['CT','ME','MA','NH','RI','VT','DE','DC','MD','NJ','NY','PA','FL','GA','NC','SC','VA','WV'] },
  R20: { name: 'Midwest',      states: ['IL','IN','IA','KS','KY','MI','MN','MO','NE','ND','SD','OH','OK','TN','WI'] },
  R30: { name: 'Gulf Coast',   states: ['AL','AR','LA','MS','NM','TX'] },
  R40: { name: 'Rocky Mountain', states: ['CO','ID','MT','UT','WY'] },
  R50: { name: 'West Coast',   states: ['AK','AZ','CA','HI','NV','OR','WA'] },
};

const states = {};
const sources = {};
const missing = [];

for (const [regionCode, region] of Object.entries(REGIONS)) {
  for (const st of region.states) {
    const stateSeries = STATE_SERIES[st] && latest[S(STATE_SERIES[st])];
    let pick, label;
    if (stateSeries) {
      pick = stateSeries; label = STATE_NAMES[st];
    } else if (regionCode === 'R50' && latest[S('R5XCA')]) {
      pick = latest[S('R5XCA')]; label = 'West Coast excl. California';
    } else if (latest[S(regionCode)]) {
      pick = latest[S(regionCode)]; label = region.name;
    } else {
      pick = national; label = 'US'; missing.push(st);
    }
    states[st] = +pick.value.toFixed(2);
    sources[st] = label;
  }
}

const out = {
  updated: national.period,                       // EIA survey week
  generated: new Date().toISOString().split('T')[0],
  national: +national.value.toFixed(2),
  states,
  sources,
};

fs.writeFileSync('scripts/gas-prices.json', JSON.stringify(out, null, 2) + '\n');
console.log(`Wrote gas-prices.json: national $${out.national} (week of ${out.updated})`);
console.log('Series found:', Object.keys(latest).join(', '));
if (missing.length) console.log('Fell back to national for:', missing.join(', '));
