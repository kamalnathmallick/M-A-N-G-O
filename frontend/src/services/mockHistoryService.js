// Mock History Service for Farmer Analysis Records

export const MOCK_HISTORY_RECORDS = [
  {
    id: 'hist-1',
    date: '24 Aug 2026',
    time: '09:30 AM',
    farmName: 'Green Valley Mango Farm',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    budHealth: 78,
    healthyBudsText: '78%',
    flowerDropRisk: 'Moderate',
    riskBadgeColor: 'amber',
    climateCondition: 'Favorable (29°C, 68% RH)',
    predictedYield: '4.8 – 5.4 t/acre',
    totalTonnes: '12.0 – 13.5 t',
    sampleCount: 4,
    isDemo: true,
    keyObservation: 'Panicle elongation uniform. Moderate hopper activity detected on south perimeter.'
  },
  {
    id: 'hist-2',
    date: '18 Aug 2026',
    time: '10:15 AM',
    farmName: 'Green Valley Mango Farm',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    budHealth: 82,
    healthyBudsText: '82%',
    flowerDropRisk: 'Low',
    riskBadgeColor: 'emerald',
    climateCondition: 'Clear & Mild (27°C, 62% RH)',
    predictedYield: '5.1 – 5.6 t/acre',
    totalTonnes: '12.7 – 14.0 t',
    sampleCount: 4,
    isDemo: true,
    keyObservation: 'Initial bud emergence phase. High vigor and zero mildew symptoms.'
  },
  {
    id: 'hist-3',
    date: '11 Aug 2026',
    time: '04:00 PM',
    farmName: 'Green Valley Mango Farm',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    budHealth: 76,
    healthyBudsText: '76%',
    flowerDropRisk: 'Moderate',
    riskBadgeColor: 'amber',
    climateCondition: 'Warm Breeze (32°C, 58% RH)',
    predictedYield: '4.6 – 5.2 t/acre',
    totalTonnes: '11.5 – 13.0 t',
    sampleCount: 4,
    isDemo: true,
    keyObservation: 'Early terminal bud swelling. Light irrigation recommended.'
  },
  {
    id: 'hist-4',
    date: '04 Aug 2026',
    time: '08:45 AM',
    farmName: 'Green Valley Mango Farm',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    budHealth: 71,
    healthyBudsText: '71%',
    flowerDropRisk: 'High',
    riskBadgeColor: 'rose',
    climateCondition: 'High Heat Spurt (36°C, 45% RH)',
    predictedYield: '4.2 – 4.8 t/acre',
    totalTonnes: '10.5 – 12.0 t',
    sampleCount: 4,
    isDemo: true,
    keyObservation: 'Thermal stress observed during early bud break. Remedied by light canopy misting.'
  },
  {
    id: 'hist-5',
    date: '22 Aug 2026',
    time: '02:30 PM',
    farmName: 'Green Valley Mango Farm',
    plot: 'Plot B',
    plotDetails: 'Plot B — 3.0 acres (Kesar)',
    budHealth: 84,
    healthyBudsText: '84%',
    flowerDropRisk: 'Low',
    riskBadgeColor: 'emerald',
    climateCondition: 'Partly Sunny (30°C, 65% RH)',
    predictedYield: '5.2 – 5.8 t/acre',
    totalTonnes: '15.6 – 17.4 t',
    sampleCount: 4,
    isDemo: true,
    keyObservation: 'Kesar variety showing vigorous panicles with tight floral cluster.'
  }
];

import { apiClient } from './apiClient';

export const mockHistoryService = {
  getHistory: async (plotId = null) => {
    let records = [...MOCK_HISTORY_RECORDS];
    try {
      const endpoint = plotId ? `/history?plotId=${plotId}` : '/history';
      const data = await apiClient.get(endpoint);
      if (Array.isArray(data) && data.length > 0) {
        // Live records carry an explicit isDemo:false so views that check
        // `r.isDemo !== false` never mislabel backend data as demo.
        records = data.map((r) => ({ ...r, isDemo: false }));
      }
    } catch (err) {
      // Fallback
    }

    if (!plotId) return records;
    return records.filter(r => (r.plot && r.plot.toLowerCase().includes(plotId.toLowerCase())) || (r.plotDetails && r.plotDetails.toLowerCase().includes(plotId.toLowerCase())));
  }
};

