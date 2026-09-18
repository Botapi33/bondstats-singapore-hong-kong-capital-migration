import fs from 'node:fs';

const OUT = 'output/latest.json';
const SG = 'https://data.gov.sg/api/action/datastore_search?resource_id=d_f357c61441e2850ca4eae05813ebd37b&limit=100';
const HK = 'https://api.hkma.gov.hk/public/market-data-and-statistics/monthly-statistical-bulletin/financial/banking-statistics?offset=0&pagesize=1000';

const get = async (url) => {
  const r = await fetch(url, {
    headers: {
      'user-agent': 'BondStats-data-sync/1.1',
      'accept': 'application/json'
    }
  });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.json();
};

// IMPORTANT: blank/null API fields are missing observations, never zero.
const num = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim().replace(/,/g, '');
  if (!s || s === '-' || s.toLowerCase() === 'null' || s.toLowerCase() === 'na') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const growth = (latest, earlier) =>
  Number.isFinite(latest) && Number.isFinite(earlier) && earlier !== 0
    ? (latest / earlier - 1) * 100
    : null;

const avg = (arr) => {
  const v = arr.filter(Number.isFinite);
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

const bound = (x, scale = 4) =>
  Number.isFinite(x) ? Math.max(-1, Math.min(1, x / scale)) : null;

const monthMap = {
  Jan:'01', Feb:'02', Mar:'03', Apr:'04', May:'05', Jun:'06',
  Jul:'07', Aug:'08', Sep:'09', Oct:'10', Nov:'11', Dec:'12'
};

const normalizePeriod = (p) => {
  const s = String(p || '').trim();
  let m = s.match(/^(\d{4})([A-Za-z]{3})$/);
  if (m && monthMap[m[2]]) return `${m[1]}-${monthMap[m[2]]}`;
  m = s.match(/^(\d{4})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}`;
  return null;
};

const periodKeys = (o) =>
  Object.keys(o)
    .filter((k) => /^\d{4}[A-Za-z]{3}$/.test(k))
    .sort((a, b) => normalizePeriod(b).localeCompare(normalizePeriod(a)));

const findRow = (rows, patterns) =>
  rows.find((r) => patterns.some((p) => p.test(String(r.DataSeries || r.data_series || '')))) || null;

const seriesFromRow = (row) => {
  if (!row) return [];
  return periodKeys(row)
    .map((k) => ({ period: normalizePeriod(k), value: num(row[k]) }))
    .filter((x) => x.period && Number.isFinite(x.value))
    .sort((a, b) => b.period.localeCompare(a.period));
};

const hkRecords = (j) => j?.result?.records || j?.result?.record || [];

const hkSeries = (rows, key) =>
  rows
    .map((r) => ({ period: normalizePeriod(r.end_of_month), value: num(r[key]) }))
    .filter((x) => x.period && Number.isFinite(x.value))
    .sort((a, b) => b.period.localeCompare(a.period));

const metric = (series, months) =>
  series.length > months ? growth(series[0].value, series[months].value) : null;

const channel = (diff) => {
  if (!Number.isFinite(diff)) {
    return { score: null, label: 'Unavailable', detail: 'Official observation unavailable' };
  }
  return {
    score: bound(diff),
    label: diff > 0.35 ? 'Singapore stronger' : diff < -0.35 ? 'Hong Kong stronger' : 'Near balance',
    detail: `relative 3m momentum ${diff > 0 ? '+' : ''}${diff.toFixed(2)} pp`
  };
};

const [sgj, hkj] = await Promise.all([get(SG), get(HK)]);
const sgr = sgj?.result?.records || [];
const hkr = hkRecords(hkj);

if (!sgr.length) throw new Error('Singapore official source returned no records');
if (!hkr.length) throw new Error('HKMA official source returned no records');

// Singapore official MAS/SingStat table.
// Banking channel: total commercial-bank assets.
// Cross-border channel: loans/advances to non-residents, an explicit published international exposure proxy.
const sgAssets = seriesFromRow(findRow(sgr, [/^total assets$/i]));
const sgNonResident = seriesFromRow(findRow(sgr, [
  /loans and advances.*non-resident/i,
  /non-resident.*loans and advances/i
]));

if (!sgAssets.length) throw new Error('Singapore Total Assets series not found');
if (!sgNonResident.length) throw new Error('Singapore Non-Resident Loans series not found');

// HKMA all-authorized-institutions banking statistics.
const hkAssets = hkSeries(hkr, 'total_assets');
const hkExtClaims = hkSeries(hkr, 'total_ext_claims');
const hkExtLiab = hkSeries(hkr, 'total_ext_liab');

if (!hkAssets.length) throw new Error('HKMA total_assets series not found');

const hkCrossMap = new Map();
for (const x of hkExtClaims) hkCrossMap.set(x.period, { claims: x.value, liab: null });
for (const x of hkExtLiab) {
  const old = hkCrossMap.get(x.period) || { claims: null, liab: null };
  old.liab = x.value;
  hkCrossMap.set(x.period, old);
}
const hkCross = [...hkCrossMap.entries()]
  .map(([period, v]) => ({ period, value: avg([v.claims, v.liab]) }))
  .filter((x) => Number.isFinite(x.value))
  .sort((a, b) => b.period.localeCompare(a.period));

const sgB3 = metric(sgAssets, 3);
const hkB3 = metric(hkAssets, 3);
const bankDiff = Number.isFinite(sgB3) && Number.isFinite(hkB3) ? sgB3 - hkB3 : null;

const sgX3 = metric(sgNonResident, 3);
const hkX3 = metric(hkCross, 3);
const crossDiff = Number.isFinite(sgX3) && Number.isFinite(hkX3) ? sgX3 - hkX3 : null;

const sgB12 = metric(sgAssets, 12);
const hkB12 = metric(hkAssets, 12);
const bankDiff12 = Number.isFinite(sgB12) && Number.isFinite(hkB12) ? sgB12 - hkB12 : null;

const sgX12 = metric(sgNonResident, 12);
const hkX12 = metric(hkCross, 12);
const crossDiff12 = Number.isFinite(sgX12) && Number.isFinite(hkX12) ? sgX12 - hkX12 : null;

const banking = channel(bankDiff);
const cross = channel(crossDiff);
const availableScores = [banking.score, cross.score].filter(Number.isFinite);
const composite = availableScores.length ? avg(availableScores) : null;

const singaporeScore = Number.isFinite(composite) ? Math.round(50 + composite * 35) : null;
const hongKongScore = Number.isFinite(singaporeScore) ? 100 - singaporeScore : null;

const bankPersistent =
  Number.isFinite(bankDiff) && Number.isFinite(bankDiff12) &&
  Math.sign(bankDiff) === Math.sign(bankDiff12) &&
  Math.abs(bankDiff) > 0.35 && Math.abs(bankDiff12) > 0.35;

const crossPersistent =
  Number.isFinite(crossDiff) && Number.isFinite(crossDiff12) &&
  Math.sign(crossDiff) === Math.sign(crossDiff12) &&
  Math.abs(crossDiff) > 0.35 && Math.abs(crossDiff12) > 0.35;

const persistAgree =
  bankPersistent && crossPersistent &&
  Math.sign(bankDiff) === Math.sign(crossDiff);

const multiAgree =
  availableScores.length === 2 &&
  Math.sign(availableScores[0]) === Math.sign(availableScores[1]) &&
  Math.abs(availableScores[0]) > 0.08 &&
  Math.abs(availableScores[1]) > 0.08;

const testsAvailable = [
  Number.isFinite(bankDiff),
  Number.isFinite(crossDiff),
  Number.isFinite(bankDiff12) && Number.isFinite(crossDiff12),
  availableScores.length === 2
];

const coverage = testsAvailable.filter(Boolean).length;
const confidence = Math.round((coverage / 4) * 100);

let verdict = {
  label: 'Insufficient evidence',
  note: 'Available official series do not yet support a multi-channel directional conclusion.'
};

if (confidence >= 75 && multiAgree && persistAgree) {
  if (composite > 0.12) {
    verdict = {
      label: 'Evidence tilts toward Singapore',
      note: 'Multiple independent official indicators are consistent with relative strengthening in Singapore. This is not proof of direct bilateral capital transfer.'
    };
  } else if (composite < -0.12) {
    verdict = {
      label: 'Evidence tilts toward Hong Kong',
      note: 'Multiple independent official indicators are consistent with relative strengthening in Hong Kong. This is not proof of direct bilateral capital transfer.'
    };
  }
} else if (confidence >= 50) {
  verdict = {
    label: 'Mixed / unconfirmed',
    note: 'Comparable official observations are available, but persistence and independent-channel confirmation are not both satisfied.'
  };
}

const testState = (available, pos, neg) =>
  !available
    ? { label: 'Unavailable', class: 'neutral' }
    : pos
      ? { label: 'Singapore confirmation', class: 'positive' }
      : neg
        ? { label: 'Hong Kong confirmation', class: 'negative' }
        : { label: 'No clear divergence', class: 'neutral' };

const tests = [
  testState(Number.isFinite(bankDiff), bankDiff > 0.35, bankDiff < -0.35),
  testState(Number.isFinite(crossDiff), crossDiff > 0.35, crossDiff < -0.35),
  {
    label: Number.isFinite(bankDiff12) && Number.isFinite(crossDiff12)
      ? (persistAgree ? 'Confirmed across windows' : 'Not confirmed across windows')
      : 'Unavailable',
    class: persistAgree ? 'positive' : 'neutral'
  },
  {
    label: availableScores.length === 2
      ? (multiAgree ? 'Independent channels agree' : 'Channels do not agree')
      : 'Unavailable',
    class: multiAgree ? 'positive' : 'neutral'
  }
];

// Historical banking evidence. Period formats are normalized first, so SG "2026Jul"
// correctly matches HK "2026-07".
const sgMap = new Map(sgAssets.map((x) => [x.period, x.value]));
const hkMap = new Map(hkAssets.map((x) => [x.period, x.value]));
const periods = [...sgMap.keys()].filter((p) => hkMap.has(p)).sort();
const history = [];

for (let i = 3; i < periods.length; i++) {
  const p = periods[i];
  const prev = periods[i - 3];
  const sgG = growth(sgMap.get(p), sgMap.get(prev));
  const hkG = growth(hkMap.get(p), hkMap.get(prev));
  const d = Number.isFinite(sgG) && Number.isFinite(hkG) ? sgG - hkG : null;
  if (Number.isFinite(d)) {
    history.push({ period: p, score: Math.round(50 + bound(d) * 35) });
  }
}

const latestPeriods = [
  sgAssets[0]?.period,
  hkAssets[0]?.period,
  sgNonResident[0]?.period,
  hkCross[0]?.period
].filter(Boolean);

const asOf = latestPeriods.length ? [...latestPeriods].sort()[0] : null;

const data = {
  schema: 'bondstats-capital-migration-v2',
  generated_at: new Date().toISOString(),
  as_of: asOf,
  singapore_score: singaporeScore,
  hong_kong_score: hongKongScore,
  confidence,
  coverage,
  verdict,
  channels: {
    banking,
    crossborder: cross,
    persistence: {
      label: persistAgree ? 'Persistent across both channels' : 'Unconfirmed',
      detail:
        Number.isFinite(bankDiff12) && Number.isFinite(crossDiff12)
          ? `12m relative momentum: banking ${bankDiff12 > 0 ? '+' : ''}${bankDiff12.toFixed(2)} pp; cross-border ${crossDiff12 > 0 ? '+' : ''}${crossDiff12.toFixed(2)} pp`
          : '12m comparison unavailable'
    },
    confidence: {
      label: `${confidence}%`,
      detail: `${coverage}/4 tests available`
    }
  },
  tests,
  raw: {
    sg_banking_3m: sgB3,
    hk_banking_3m: hkB3,
    sg_crossborder_3m: sgX3,
    hk_crossborder_3m: hkX3,
    relative_banking_3m: bankDiff,
    relative_banking_12m: bankDiff12,
    relative_crossborder_3m: crossDiff,
    relative_crossborder_12m: crossDiff12
  },
  history: history.slice(-36),
  sources: {
    singapore: {
      provider: 'Singapore Department of Statistics / Monetary Authority of Singapore',
      dataset: 'd_f357c61441e2850ca4eae05813ebd37b',
      banking_series: 'Total Assets',
      crossborder_series: 'Loans And Advances - Non-Resident'
    },
    hong_kong: {
      provider: 'Hong Kong Monetary Authority',
      endpoint: 'banking-statistics',
      banking_series: 'total_assets',
      crossborder_series: 'average of total_ext_claims and total_ext_liab'
    },
    bis: {
      provider: 'Bank for International Settlements',
      dataset: 'Locational banking statistics',
      role: 'methodological reference / future cross-check'
    }
  }
};

fs.mkdirSync('output', { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n');

console.log(JSON.stringify({
  verdict: data.verdict.label,
  singapore_score: data.singapore_score,
  confidence,
  coverage,
  as_of: data.as_of,
  history_points: data.history.length
}, null, 2));
