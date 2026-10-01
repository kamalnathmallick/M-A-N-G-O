import { User } from '../models/User.js';
import { Farm } from '../models/Farm.js';
import { Weather } from '../models/Weather.js';
import { Recommendation } from '../models/Recommendation.js';
import { HistoryRecord } from '../models/HistoryRecord.js';
import { Prediction } from '../models/Prediction.js';
import { DEFAULT_CURRENT_WEATHER, DEFAULT_FORECAST_15_DAYS } from './weatherService.js';
import { DEFAULT_RECOMMENDATIONS } from './recommendationService.js';

export const INITIAL_FARMS = [
  {
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
        lastAnalysisDate: '24 Aug 2026, 09:30 AM'
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
        lastAnalysisDate: '22 Aug 2026, 04:15 PM'
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
        lastAnalysisDate: '20 Aug 2026, 11:00 AM'
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
        lastAnalysisDate: '18 Aug 2026, 08:45 AM'
      }
    ]
  },
  {
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
        lastAnalysisDate: '23 Aug 2026, 10:00 AM'
      }
    ]
  }
];

export const INITIAL_HISTORY = [
  {
    farmId: 'farm-1',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    farmName: 'Green Valley Mango Farm',
    date: '24 Aug 2026',
    time: '09:30 AM',
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
    farmId: 'farm-1',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    farmName: 'Green Valley Mango Farm',
    date: '18 Aug 2026',
    time: '10:15 AM',
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
    farmId: 'farm-1',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    farmName: 'Green Valley Mango Farm',
    date: '11 Aug 2026',
    time: '04:00 PM',
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
    farmId: 'farm-1',
    plot: 'Plot A',
    plotDetails: 'Plot A — 2.5 acres (Alphonso)',
    farmName: 'Green Valley Mango Farm',
    date: '04 Aug 2026',
    time: '08:45 AM',
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
    farmId: 'farm-1',
    plot: 'Plot B',
    plotDetails: 'Plot B — 3.0 acres (Kesar)',
    farmName: 'Green Valley Mango Farm',
    date: '22 Aug 2026',
    time: '02:30 PM',
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

import mongoose from 'mongoose';

export const seedDatabase = async () => {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  try {
    // 1. Seed Demo User
    let demoUser = await User.findOne({ email: 'farmer@mangosense.org' });
    if (!demoUser) {
      demoUser = await User.create({
        name: 'Ramesh Patil',
        email: 'farmer@mangosense.org',
        password: 'password123',
        phone: '+91 98230 45678',
        role: 'farmer',
        location: 'Ratnagiri, Maharashtra, India'
      });
    }
    console.log(
      '[Seed] DEMO-ONLY credentials (seeded sample account, not a real user): farmer@mangosense.org / password123'
    );

    // 2. Seed Farms (always flagged isDemo: true)
    const farmCount = await Farm.countDocuments();
    if (farmCount === 0) {
      for (const f of INITIAL_FARMS) {
        await Farm.create({ ...f, userId: demoUser._id, isDemo: true });
      }
      console.log('[Seed] Seeded DEMO mango farms and plots (isDemo: true)');
    }

    // 3. Seed Weather (demo data — always served with isDemo: true)
    const weatherCount = await Weather.countDocuments();
    if (weatherCount === 0) {
      await Weather.create({
        farmId: 'farm-1',
        ...DEFAULT_CURRENT_WEATHER,
        forecast: DEFAULT_FORECAST_15_DAYS,
        isDemo: true
      });
      console.log('[Seed] Seeded DEMO weather & 15-day forecast (isDemo: true)');
    }

    // 4. Seed Recommendations (demo fallback only — live output is rule-generated)
    const recCount = await Recommendation.countDocuments();
    if (recCount === 0) {
      for (const rec of DEFAULT_RECOMMENDATIONS) {
        await Recommendation.create({
          farmId: 'farm-1',
          plotId: 'plot-a',
          ...rec,
          isDemo: true
        });
      }
      console.log('[Seed] Seeded DEMO agronomic recommendations (isDemo: true)');
    }

    // 5. Seed History (always flagged isDemo: true)
    const histCount = await HistoryRecord.countDocuments();
    if (histCount === 0) {
      for (const h of INITIAL_HISTORY) {
        await HistoryRecord.create({ ...h, userId: demoUser._id, isDemo: true });
      }
      console.log('[Seed] Seeded DEMO historical analysis records (isDemo: true)');
    }

    // 6. Seed Prediction (always flagged isDemo: true)
    const predCount = await Prediction.countDocuments();
    if (predCount === 0) {
      await Prediction.create({
        userId: demoUser._id,
        farmId: 'farm-1',
        plotId: 'plot-a',
        plotName: 'Plot A — 2.5 acres',
        variety: 'Alphonso (Hapus)',
        isDemo: true,
        expectedYieldMin: 4.8,
        expectedYieldMax: 5.4,
        expectedYieldAverage: 5.1,
        yieldUnit: 'tonnes / acre',
        totalPlotExpectedMin: 12.0,
        totalPlotExpectedMax: 13.5,
        totalPlotUnit: 'tonnes total',
        yieldDistribution: [
          { scenario: 'Severe Drop Risk', yield: 3.8, probability: 10, fill: '#ef4444' },
          { scenario: 'Sub-optimal Weather', yield: 4.4, probability: 25, fill: '#f59e0b' },
          { scenario: 'Current Forecast Range', yield: 5.1, probability: 85, fill: '#15803d', isCurrent: true },
          { scenario: 'Optimized Management', yield: 5.8, probability: 45, fill: '#10b981' }
        ],
        stageMilestones: [
          { stage: 'Flower Bud Emergence', date: 'Early August', status: 'Completed', health: '82%' },
          { stage: 'Panicle Elongation (Current)', date: 'Late August', status: 'In Progress', health: '78%' },
          { stage: 'Full Anthesis & Pollination', date: 'Early September', status: 'Upcoming', health: 'Estimated 75%' },
          { stage: 'Fruitlet Set (Pea Stage)', date: 'Mid September', status: 'Upcoming', health: 'Pending' },
          { stage: 'Harvesting', date: 'Late October - November', status: 'Projected', health: 'Target: 5.1 t/acre' }
        ]
      });
      console.log('[Seed] Seeded default prediction record');
    }
  } catch (error) {
    console.warn('[Seed] Notice during seed operation:', error.message);
  }
};
