/**
 * Rule-based recommendation engine configuration (CONTRACT.md §3).
 *
 * Every rule has the shape:
 *
 *   IF <metric> <op> <threshold> THEN <recommendation>
 *
 * Thresholds are exported separately (`THRESHOLDS`) so they are configurable
 * and unit-testable. Rules reference thresholds via `thresholdKey`.
 *
 * All recommendation copy is intentionally generic and advisory — it mirrors
 * the wording already approved in the frontend mock data
 * (`frontend/src/services/mockRecommendationService.js`). No claims beyond
 * standard, safe agronomic guidance are made.
 */

/** Metric thresholds — tune here, not inside the service. */
export const THRESHOLDS = {
  /** bud health below this % triggers the nutrition advisory */
  budHealthLow: 70,
  /** bud health at/above this % keeps the pollination advisory active */
  budHealthGood: 75,
  /** flower-drop risk score (0 = Low, 1 = Moderate, 2 = High) triggering irrigation advisory */
  flowerDropRiskHigh: 2,
  /** flower-drop risk score (or detected poor-yield pressure) triggering pest monitoring */
  pestPressureMin: 1,
  /** max rain probability (%) in the 15-day window triggering pre-rain protection */
  rainProbHigh: 60,
  /** current relative humidity (%) triggering powdery mildew advisory */
  humidityHigh: 85,
  /** good-ratio % below which the "high poor-yield ratio" advisory fires */
  goodRatioLow: 50
};

/**
 * Supported ops: '<', '<=', '>', '>=', '==', '!='
 * Each rule carries the full Recommendation payload (MOCK_RECOMMENDATIONS keys).
 */
export const RECOMMENDATION_RULES = [
  {
    id: 'rule-low-bud-health-nutrition',
    metric: 'budHealth',
    op: '<',
    thresholdKey: 'budHealthLow',
    category: 'NUTRITION',
    title: 'Foliar Nutrient & Micronutrient Spray',
    priority: 'LOW',
    priorityColor: 'emerald',
    shortText: 'Apply balanced nutrients to support flower retention and fruit set.',
    fullExplanation:
      'Boron and Zinc are critical co-factors for pollen tube germination and ovule fertilization. Deficiency can raise flower shedding. Consider a leaf/tissue check before deciding on any spray.',
    actionRequired:
      'Inspect leaves and panicles, then consult a local agricultural advisor about a balanced foliar nutrition schedule at 50% panicle emergence.',
    timing: 'Within 5–7 days before flower opening',
    icon: 'PackagePlus',
    badge: 'LOW PRIORITY',
    organicAlternative: 'Enriched cow dung slurry (Jeevamrutha) foliar filter spray @ 5%.'
  },
  {
    id: 'rule-high-flower-drop-irrigation',
    metric: 'flowerDropRiskScore',
    op: '>=',
    thresholdKey: 'flowerDropRiskHigh',
    category: 'WATER',
    title: 'Irrigation Management',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'Maintain adequate soil moisture. Provide light irrigation during flowering.',
    fullExplanation:
      'During panicle elongation and full bloom, avoid heavy flood irrigation as it can trigger vegetative flush instead of floral retention. Light, regular irrigation helps sustain floral turgor.',
    actionRequired:
      'Run light drip or micro-irrigation in the morning hours (06:00 AM – 08:00 AM) at short intervals rather than heavy soaking.',
    timing: 'Immediate — Next 48 Hours',
    icon: 'Droplet',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Mulch tree basin with dried grass/paddy straw (8-10 cm thickness) to conserve soil moisture.'
  },
  {
    id: 'rule-rain-window-pre-rain-protection',
    metric: 'maxRainProb',
    op: '>=',
    thresholdKey: 'rainProbHigh',
    category: 'WEATHER',
    title: 'Pre-Rain Protection against Powdery Mildew',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'Monitor upcoming rainfall and temperature changes during flowering.',
    fullExplanation:
      'High relative humidity combined with warm temperatures creates favourable conditions for powdery mildew (Oidium mangiferae) during flowering. The 15-day forecast shows a meaningful rain probability.',
    actionRequired:
      'Plan a protective spray or biological control window ahead of the forecast rain days, and avoid spraying immediately before heavy rain.',
    timing: 'Complete before the next forecast rain window',
    icon: 'CloudRain',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Trichoderma harzianum bio-fungicide @ 5 ml/L.'
  },
  {
    id: 'rule-healthy-bloom-pollination',
    metric: 'budHealth',
    op: '>=',
    thresholdKey: 'budHealthGood',
    category: 'POLLINATION',
    title: 'Pollination & Honeybee Protection',
    priority: 'MEDIUM',
    priorityColor: 'amber',
    shortText: 'Encourage pollinators. Avoid excessive pesticide sprays during flowering.',
    fullExplanation:
      'A large share of mango fruit set depends on insect vectors such as honeybees and dipteran flies. Heavy broad-spectrum spraying during peak bloom can reduce fruit set.',
    actionRequired:
      'Refrain from spraying during peak bee foraging hours (08:30 AM to 12:30 PM). Place 2-3 bee boxes per acre if available.',
    timing: 'Throughout active bloom window',
    icon: 'Sparkles',
    badge: 'MEDIUM PRIORITY',
    organicAlternative: 'Spray 1% jaggery water on perimeter trees to attract beneficial dipteran flies and pollinators.'
  },
  {
    id: 'rule-pest-pressure-monitoring',
    metric: 'pestPressureScore',
    op: '>=',
    thresholdKey: 'pestPressureMin',
    category: 'PEST',
    title: 'Pest Control (Mango Hopper & Thrips)',
    priority: 'MEDIUM',
    priorityColor: 'amber',
    shortText: 'Monitor for hoppers and thrips. Use recommended biological or chemical control.',
    fullExplanation:
      'Hopper and thrips activity during bloom can damage tender panicles and raise flower drop. Sample a few panicles per tree in the inner shaded canopy to estimate counts before deciding on treatment.',
    actionRequired:
      'Inspect 5 panicles per tree; if activity is observed above the locally recommended threshold, consult an agronomist about an approved insecticide or neem-based option.',
    timing: 'Inspect within 2 days; spray in late evening if required',
    icon: 'Bug',
    badge: 'MEDIUM PRIORITY',
    organicAlternative: 'Neem seed kernel extract (NSKE 5%) spray with soap sticker.'
  },
  {
    id: 'rule-high-poor-ratio',
    metric: 'goodRatio',
    op: '<',
    thresholdKey: 'goodRatioLow',
    category: 'YIELD',
    title: 'High Poor-Yield Ratio — Intensive Monitoring Required',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'More than half of sampled buds classified as Poor Yield Potential. Immediate intervention advised.',
    fullExplanation:
      'When the majority of scanned buds show Poor Yield Potential signatures, the risk of significantly reduced harvest is elevated. Early action on irrigation, nutrition, and pest management can improve flower retention before the critical pollination window closes.',
    actionRequired:
      'Review irrigation schedule, inspect panicles for early hopper/thrips activity, and consider a foliar boron/zinc application. Consult your local agricultural extension officer if the ratio remains above 50% after 5 days.',
    timing: 'Immediate — within 24–48 hours',
    icon: 'AlertTriangle',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Jeevamrutha foliar spray (5%) + neem seed kernel extract (NSKE 5%) as a combined intervention.'
  },
  {
    id: 'rule-high-humidity-mildew',
    metric: 'humidity',
    op: '>=',
    thresholdKey: 'humidityHigh',
    category: 'DISEASE',
    title: 'Powdery Mildew Prophylaxis',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'White powdery coating on flowers is caused by Oidium mangiferae. Consider sulfur or systemic fungicides.',
    fullExplanation:
      'High relative humidity combined with cloudy days raises the risk of powdery mildew, which can blacken panicles and drop flowers.',
    actionRequired:
      'Plan a protective application (e.g. Wettable Sulphur or an approved fungicide) before the next rain forecast, following the local label rates.',
    timing: 'Apply before upcoming rain forecast window',
    icon: 'ShieldAlert',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Trichoderma harzianum or Bacillus subtilis bio-fungicide @ 5 g/L.'
  }
];

/** Ops supported by `evaluateRules`. */
const OPERATORS = {
  '<': (v, t) => v < t,
  '<=': (v, t) => v <= t,
  '>': (v, t) => v > t,
  '>=': (v, t) => v >= t,
  '==': (v, t) => v === t,
  '!=': (v, t) => v !== t
};

/**
 * Evaluate rules against a metrics object.
 *
 * @param {object} metrics  e.g. { budHealth, flowerDropRiskScore, maxRainProb, humidity, pestPressureScore, temperature, windSpeed }
 * @param {object[]} [rules] defaults to RECOMMENDATION_RULES
 * @param {object} [thresholds] defaults to THRESHOLDS
 * @returns {object[]} matched rules (rule objects, including their recommendation payload)
 */
export const evaluateRules = (metrics = {}, rules = RECOMMENDATION_RULES, thresholds = THRESHOLDS) => {
  return rules.filter((rule) => {
    const op = OPERATORS[rule.op];
    if (!op) return false;
    const value = metrics[rule.metric];
    if (value === null || value === undefined || Number.isNaN(value)) return false;
    const threshold =
      rule.threshold !== undefined ? rule.threshold : thresholds[rule.thresholdKey];
    if (threshold === undefined) return false;
    return op(value, threshold);
  });
};
