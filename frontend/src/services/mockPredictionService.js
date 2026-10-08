// Mock Yield Prediction Service for MangoSense
import { apiClient } from './apiClient';

export const mockPredictionService = {
  getLatestPrediction: async (plotId = 'plot-a') => {
    try {
      const data = await apiClient.get(`/predictions/latest?plotId=${plotId}`);
      if (data && data.expectedYieldMin !== undefined) {
        // Keep the backend's flag: a stored demo/heuristic prediction must not
        // be relabelled "Live Model Result" by the frontend.
        return { ...data, isDemo: data.isDemo === true };
      }
    } catch (err) {
      // Fallback — use last cached analysis from localStorage so real analysis
      // results survive a momentary API outage.
    }

    // Try to reconstruct from the last analysis result cached in localStorage.
    // NewAnalysisWizard writes 'mangosense_last_analysis' on every successful run.
    let cached = null;
    try {
      const raw = localStorage.getItem('mangosense_last_analysis');
      if (raw) cached = JSON.parse(raw);
    } catch {
      cached = null;
    }

    if (cached && cached.yieldEstimation) {
      const ye = cached.yieldEstimation;
      const summary = cached.summary || {};
      const goodCount = summary.goodYieldCount ?? 0;
      const poorCount = summary.poorYieldCount ?? 0;
      const total = goodCount + poorCount;
      const goodRatio = total > 0 ? Math.round((goodCount / total) * 100) : null;
      const health = typeof summary.overallHealthScore === 'number' ? summary.overallHealthScore : null;
      const dropRisk = summary.flowerDropRisk || 'Moderate';
      const avg = ye.expectedYieldAverage;

      return {
        isDemo: true,
        predictionId: 'pred-offline-cache',
        generatedAt: cached.analysisDate || null,
        plotId,
        variety: cached.variety || 'Alphonso (Hapus)',
        expectedYieldMin: ye.expectedYieldMin,
        expectedYieldMax: ye.expectedYieldMax,
        expectedYieldAverage: avg,
        yieldUnit: ye.yieldUnit || 'tonnes / acre',
        totalPlotExpectedMin: ye.totalPlotExpectedMin,
        totalPlotExpectedMax: ye.totalPlotExpectedMax,
        totalPlotUnit: 'tonnes total',
        predictionLabel: 'Offline Estimate (cached)',
        confidenceNote: 'Offline cache — backend unreachable. Showing last known analysis result.',
        factors: {
          budHealth: {
            label: 'Bud Health',
            value: health !== null ? `${health}% healthy` : 'Not measured',
            percentage: health,
            impact: goodRatio !== null ? `${goodCount} Good / ${poorCount} Poor of ${total} samples (${goodRatio}% good ratio)` : '—',
            status: health !== null && health >= 75 ? 'favorable' : 'warning',
            badge: health !== null && health >= 75 ? 'Good quality panicles' : 'Below threshold'
          },
          flowerDropRisk: {
            label: 'Flower Drop Risk',
            value: dropRisk,
            percentage: dropRisk === 'Low' ? 15 : dropRisk === 'High' ? 65 : 35,
            impact: goodRatio !== null ? `Derived from ${goodRatio}% good-yield ratio` : 'Based on cached data',
            status: dropRisk === 'Low' ? 'favorable' : 'warning',
            badge: dropRisk === 'Low' ? 'Low risk' : dropRisk === 'High' ? 'Elevated' : 'Monitor conditions'
          },
          climate: {
            label: 'Climate Condition',
            value: 'See Climate page',
            percentage: 70,
            impact: 'Check live weather for current conditions',
            status: 'favorable',
            badge: 'Check live weather'
          },
          pestRisk: {
            label: 'Pest Risk',
            value: poorCount > 0 ? 'Low–Moderate' : 'Low',
            percentage: poorCount > 0 ? 25 : 10,
            impact: poorCount > 0 ? 'Poor-yield signal detected in cached analysis' : 'Normal',
            status: 'favorable',
            badge: 'Normal'
          }
        },
        yieldDistribution: avg != null ? [
          { scenario: 'Severe Drop Risk',       yield: +(avg * 0.75).toFixed(1), probability: 10,  fill: '#ef4444' },
          { scenario: 'Sub-optimal Weather',    yield: +(avg * 0.90).toFixed(1), probability: 25,  fill: '#f59e0b' },
          { scenario: 'Current Forecast Range', yield: avg,                       probability: 85,  fill: '#15803d', isCurrent: true },
          { scenario: 'Optimised Management',   yield: +(avg * 1.20).toFixed(1), probability: 45,  fill: '#10b981' }
        ] : [],
        stageMilestones: [
          { stage: 'Flower Bud Emergence',          date: 'Early Season',  status: 'Completed',   health: health !== null ? `${health}% observed` : '—' },
          { stage: 'Panicle Elongation (Current)',  date: 'Active Stage',  status: 'In Progress', health: health !== null ? `${health}% healthy` : '—' },
          { stage: 'Full Anthesis & Pollination',   date: 'Upcoming',      status: 'Upcoming',    health: 'Pending next analysis' },
          { stage: 'Fruitlet Set (Pea Stage)',       date: 'Upcoming',      status: 'Upcoming',    health: 'Pending' },
          { stage: 'Harvesting',                    date: 'End of Season', status: 'Projected',   health: avg != null ? `Target: ${avg} t/acre (cached)` : 'Pending' }
        ]
      };
    }

    // No cached analysis — show a neutral placeholder (no hardcoded 78% or 4.8-5.4).
    return {
      isDemo: true,
      predictionId: 'pred-no-analysis',
      generatedAt: null,
      plotId,
      variety: 'Alphonso (Hapus)',
      expectedYieldMin: null,
      expectedYieldMax: null,
      expectedYieldAverage: null,
      yieldUnit: 'tonnes / acre',
      totalPlotExpectedMin: null,
      totalPlotExpectedMax: null,
      totalPlotUnit: 'tonnes total',
      predictionLabel: 'No Analysis Yet',
      confidenceNote: 'Run a new bud analysis to generate your first yield prediction.',
      factors: {},
      yieldDistribution: [],
      stageMilestones: []
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
        return { ...data, isDemo: data.isDemo === true };
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
