// Mock data for Pact execution history chart

export interface PactExecution {
  pactId: string;
  pactTitle: string;
  txCount: number;
  txAmount: number;
}

export interface DailyPactData {
  date: string;        // "MM/DD" or "HH:00"
  totalTxCount: number;
  totalTxAmount: number;
  pacts: PactExecution[];
}

function generateDailyData(daysAgo: number, date: Date): DailyPactData {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const label = `${mm}/${dd}`;

  // Simulate varying activity
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const baseActivity = isWeekend ? 0.4 : 1;
  const randomFactor = 0.5 + Math.random() * 1;
  const activity = baseActivity * randomFactor;

  const pacts: PactExecution[] = [];

  // USDC Yield (active, executes almost daily)
  if (Math.random() < 0.85 * activity) {
    const count = Math.floor(1 + Math.random() * 3);
    const amount = Math.round((200 + Math.random() * 600) * count);
    pacts.push({ pactId: 'pact-005', pactTitle: 'USDC 收益优化', txCount: count, txAmount: amount });
  }

  // Aave V3 (approved, executes when conditions trigger)
  if (Math.random() < 0.45 * activity) {
    const count = Math.floor(1 + Math.random() * 2);
    const amount = Math.round((500 + Math.random() * 1500) * count);
    pacts.push({ pactId: 'pact-003', pactTitle: 'Aave V3 借贷管理', txCount: count, txAmount: amount });
  }

  const totalTxCount = pacts.reduce((s, p) => s + p.txCount, 0);
  const totalTxAmount = pacts.reduce((s, p) => s + p.txAmount, 0);

  return { date: label, totalTxCount, totalTxAmount, pacts };
}

function generateHourlyData(): DailyPactData[] {
  const now = new Date();
  const data: DailyPactData[] = [];

  for (let h = 0; h < 24; h++) {
    const hour = `${String(h).padStart(2, '0')}:00`;
    const pacts: PactExecution[] = [];
    const isPast = h <= now.getHours();

    if (isPast) {
      // Activity mostly during 8am-22pm
      const isActiveHour = h >= 8 && h <= 22;
      const chance = isActiveHour ? 0.35 : 0.05;

      if (Math.random() < chance) {
        const count = 1;
        const amount = Math.round(200 + Math.random() * 800);
        pacts.push({ pactId: 'pact-005', pactTitle: 'USDC 收益优化', txCount: count, txAmount: amount });
      }

      if (Math.random() < chance * 0.4) {
        const count = 1;
        const amount = Math.round(500 + Math.random() * 1500);
        pacts.push({ pactId: 'pact-003', pactTitle: 'Aave V3 借贷管理', txCount: count, txAmount: amount });
      }
    }

    data.push({
      date: hour,
      totalTxCount: pacts.reduce((s, p) => s + p.txCount, 0),
      totalTxAmount: pacts.reduce((s, p) => s + p.txAmount, 0),
      pacts,
    });
  }

  return data;
}

// Use seeded-like approach: generate once per session
let _cache: { d1: DailyPactData[]; d7: DailyPactData[]; d30: DailyPactData[] } | null = null;

export function getPactHistoryData() {
  if (_cache) return _cache;

  const now = new Date();

  const d7: DailyPactData[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d7.push(generateDailyData(i, d));
  }

  const d30: DailyPactData[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d30.push(generateDailyData(i, d));
  }

  const d1 = generateHourlyData();

  _cache = { d1, d7, d30 };
  return _cache;
}
