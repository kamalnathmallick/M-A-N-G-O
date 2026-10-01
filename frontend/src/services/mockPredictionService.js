// Mock Yield Prediction Service for MangoSense
import { apiClient } from './apiClient';

export const mockPredictionService = {
  getLatestPrediction: async (plotId = 'plot-a') => {
    try {
      const data = await apiClient.get(`/predictions/latest?plotId=${plotId}`);
      if (data && data.expectedYieldMin !== undefined) {
        return { ...data, isDemo: false };
      }
    } catch (err) {
      // Fallback
    }
    return {
      isDemo: true,
      predictionId: 'pred-20260824-a',
      generatedAt: '24 Aug 2026, 09:30 AM',
      plotId: plotId,
      plotName: 'Plot A — 2.5 acres',
      variety: 'Alphonso (Hapus)',
      
      // Central Yield Metric
      expectedYieldMin: 4.8,
      expectedYieldMax: 5.4,
      expectedYieldAverage: 5.1,
      yieldUnit: 'tonnes / acre',
      totalPlotExpectedMin: 12.0, // 4.8 * 2.5
      totalPlotExpectedMax: 13.5, // 5.4 * 2.5
      totalPlotUnit: 'tonnes total',

      // Status
      predictionLabel: 'Prototype Prediction',
      confidenceNote: 'Prototype estimation based on multi-sample bud classification and 15-day climate projection.',

      // Core Factors
      factors: {
        budHealth: {
          label: 'Bud Health',
          value: '78% healthy',
          percentage: 78,
          impact: '+18% vs poor bud baseline',
          status: 'favorable',
          badge: 'High Quality Panicles'
        },
        climate: {
          label: 'Climate Condition',
          value: 'Favorable',
          percentage: 82,
          impact: '+12% optimal anthesis window',
          status: 'favorable',
          badge: 'Optimal Temperature'
        },
        flowerDropRisk: {
          label: 'Flower Drop Risk',
          value: 'Moderate',
          percentage: 35,
          impact: '-9% potential yield loss if untreated',
          status: 'warning',
          badge: 'Monitor Rain & Wind'
        },
        pestRisk: {
          label: 'Pest Risk',
          value: 'Low – Moderate',
          percentage: 22,
          impact: '-4% localized hopper pressure',
          status: 'favorable',
          badge: 'Early Stage Detected'
        }
      },

      // Historical comparison & variety benchmark
      benchmark: {
        varietyHistoricalAverage: 4.6,
        farmLastYearYield: 4.5,
        regionalBenchmark: 4.2,
        differenceFromLastYear: '+13.3%'
      },

      // Range simulation for chart
      yieldDistribution: [
        { scenario: 'Severe Drop Risk', yield: 3.8, probability: 10, fill: '#ef4444' },
        { scenario: 'Sub-optimal Weather', yield: 4.4, probability: 25, fill: '#f59e0b' },
        { scenario: 'Current Forecast Range', yield: 5.1, probability: 85, fill: '#15803d', isCurrent: true },
        { scenario: 'Optimized Management', yield: 5.8, probability: 45, fill: '#10b981' },
      ],

      // Timeline prediction
      stageMilestones: [
        { stage: 'Flower Bud Emergence', date: 'Early August', status: 'Completed', health: '82%' },
        { stage: 'Panicle Elongation (Current)', date: 'Late August', status: 'In Progress', health: '78%' },
        { stage: 'Full Anthesis & Pollination', date: 'Early September', status: 'Upcoming', health: 'Estimated 75%' },
        { stage: 'Fruitlet Set (Pea Stage)', date: 'Mid September', status: 'Upcoming', health: 'Pending' },
        { stage: 'Harvesting', date: 'Late October - November', status: 'Projected', health: 'Target: 5.1 t/acre' }
      ]
    };
  },

  /**
   * What-If simulator: POST /predictions/simulate (CONTRACT.md §3).
   * Payload: { budHealth, rainfallIntensity, pestControlActive, variety, plotAcres }
   * Response: flattened /predict/yield keys (§2). On backend error the
   * frontend-only calculateDynamicPrediction() runs as an explicitly-labelled
   * offline fallback (isDemo:true + offlineReason) — never silently live.
   */
  simulateWhatIf: async ({ budHealth = 78, rainfallIntensity = 'Moderate', pestControlActive = true, variety = 'Alphonso', plotAcres = 2.5 } = {}) => {
    try {
      const data = await apiClient.post('/predictions/simulate', {
        budHealth,
        rainfallIntensity,
        pestControlActive,
        variety,
        plotAcres
      });
      if (data && data.expectedYieldAverage !== undefined) {
        return { ...data, isDemo: false };
      }
      throw new Error('The server returned an invalid simulation response.');
    } catch (err) {
      const fallback = mockPredictionService.calculateDynamicPrediction({
        budHealth,
        rainfallIntensity,
        pestControlActive,
        variety,
        plotAcres
      });
      fallback.offlineReason =
        err && err.message ? err.message : 'Yield simulation service unavailable.';
      return fallback;
    }
  },

  // Calculate dynamic prediction when farmer modifies inputs
  calculateDynamicPrediction: ({ budHealth = 78, rainfallIntensity = 'Moderate', pestControlActive = true, variety = 'Alphonso' }) => {
    let base = 4.0;
    if (variety === 'Kesar') base = 4.5;
    if (variety === 'Banganapalli') base = 4.8;
    if (variety === 'Dasheri') base = 3.9;

    // Bud health effect
    const healthBonus = ((budHealth - 50) / 100) * 2.2;
    
    // Weather penalty
    let rainPenalty = 0;
    if (rainfallIntensity === 'High') rainPenalty = 0.6;
    if (rainfallIntensity === 'Severe') rainPenalty = 1.1;

    // Pest bonus
    const pestBonus = pestControlActive ? 0.3 : -0.4;

    const calcAverage = Math.max(2.5, +(base + healthBonus - rainPenalty + pestBonus).toFixed(2));
    const minVal = +(calcAverage - 0.3).toFixed(1);
    const maxVal = +(calcAverage + 0.3).toFixed(1);

    return {
      isDemo: true,
      expectedYieldMin: minVal,
      expectedYieldMax: maxVal,
      expectedYieldAverage: calcAverage,
      yieldUnit: 'tonnes / acre',
      dropRisk: rainPenalty > 0.4 ? 'High' : budHealth < 75 ? 'Moderate' : 'Low'
    };
  }
};
