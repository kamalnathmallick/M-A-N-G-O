// Mock data for Mango Farms & Plots

export const MOCK_FARMS = [
  {
    id: 'farm-1',
    name: 'Green Valley Mango Farm',
    location: 'Ratnagiri, Maharashtra, India',
    totalArea: '12.5 acres',
    establishedYear: 2018,
    soilType: 'Laterite Red Loam',
    irrigationType: 'Drip Micro-irrigation',
    plots: [
      {
        id: 'plot-a',
        name: 'Plot A — 2.5 acres',
        variety: 'Alphonso (Hapus)',
        treeCount: 180,
        treeAge: '7 Years',
        floweringStage: 'Active Bloom (Panicle Elongation)',
        healthScore: 78,
        expectedYield: '4.8 – 5.4',
        yieldUnit: 'tonnes/acre',
        flowerDropRisk: 'Moderate',
        climateRisk: 'Low – Moderate',
        lastAnalysisDate: '24 Aug 2026, 09:30 AM',
      },
      {
        id: 'plot-b',
        name: 'Plot B — 3.0 acres',
        variety: 'Kesar',
        treeCount: 220,
        treeAge: '9 Years',
        floweringStage: 'Early Bud Emergence',
        healthScore: 84,
        expectedYield: '5.2 – 5.8',
        yieldUnit: 'tonnes/acre',
        flowerDropRisk: 'Low',
        climateRisk: 'Low',
        lastAnalysisDate: '22 Aug 2026, 04:15 PM',
      },
      {
        id: 'plot-c',
        name: 'Plot C — 4.2 acres',
        variety: 'Dasheri',
        treeCount: 310,
        treeAge: '11 Years',
        floweringStage: 'Full Bloom & Early Fruit Set',
        healthScore: 71,
        expectedYield: '4.1 – 4.7',
        yieldUnit: 'tonnes/acre',
        flowerDropRisk: 'High',
        climateRisk: 'Moderate',
        lastAnalysisDate: '20 Aug 2026, 11:00 AM',
      },
      {
        id: 'plot-d',
        name: 'Plot D — 2.8 acres',
        variety: 'Banganapalli',
        treeCount: 195,
        treeAge: '6 Years',
        floweringStage: 'Active Bloom',
        healthScore: 82,
        expectedYield: '5.5 – 6.1',
        yieldUnit: 'tonnes/acre',
        flowerDropRisk: 'Low – Moderate',
        climateRisk: 'Low',
        lastAnalysisDate: '18 Aug 2026, 08:45 AM',
      }
    ]
  },
  {
    id: 'farm-2',
    name: 'Sahyadri Organic Orchards',
    location: 'Sindhudurg, Maharashtra, India',
    totalArea: '8.0 acres',
    establishedYear: 2020,
    soilType: 'Alluvial Loamy Clay',
    irrigationType: 'Smart Drip & Fertigation',
    plots: [
      {
        id: 'plot-s1',
        name: 'North Block — 4.0 acres',
        variety: 'Alphonso',
        treeCount: 290,
        treeAge: '5 Years',
        floweringStage: 'Active Panicle Emergence',
        healthScore: 80,
        expectedYield: '4.9 – 5.5',
        yieldUnit: 'tonnes/acre',
        flowerDropRisk: 'Low',
        climateRisk: 'Low – Moderate',
        lastAnalysisDate: '23 Aug 2026, 10:00 AM',
      }
    ]
  }
];

import { apiClient } from './apiClient';

export const mockFarmService = {
  getFarms: async () => {
    try {
      const data = await apiClient.get('/farms');
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      // Fallback to local data
    }
    return [...MOCK_FARMS];
  },
  getFarmById: async (farmId) => {
    try {
      const data = await apiClient.get(`/farms/${farmId}`);
      if (data && data.name) {
        return data;
      }
    } catch (err) {
      // Fallback
    }
    return MOCK_FARMS.find(f => f.id === farmId) || MOCK_FARMS[0];
  },
  getPlotById: async (farmId, plotId) => {
    const farm = await mockFarmService.getFarmById(farmId);
    return farm.plots.find(p => p.id === plotId) || farm.plots[0];
  }
};

