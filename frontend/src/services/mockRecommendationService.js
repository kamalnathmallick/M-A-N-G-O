// Mock Recommendation Service for Farmer Advisory

export const MOCK_RECOMMENDATIONS = [
  {
    id: 'rec-1',
    category: 'WATER',
    title: 'Irrigation Management',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'Maintain adequate soil moisture. Provide light irrigation during flowering.',
    fullExplanation: 'During panicle elongation and full bloom, avoid heavy flood irrigation as it triggers vegetative flush instead of floral retention. Give light drip irrigation at 3-4 day intervals to sustain floral turgor.',
    actionRequired: 'Run drip lines for 90 minutes every 3rd day in morning hours (06:00 AM - 08:00 AM).',
    timing: 'Immediate — Next 48 Hours',
    icon: 'Droplet',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Mulch tree basin with dried grass/paddy straw (8-10 cm thickness) to conserve rhizosphere moisture.'
  },
  {
    id: 'rec-2',
    category: 'PEST',
    title: 'Pest Control (Mango Hopper & Thrips)',
    priority: 'MEDIUM',
    priorityColor: 'amber',
    shortText: 'Monitor for hoppers and thrips. Use recommended biological or chemical control.',
    fullExplanation: 'Early nymphs suck sap from tender panicles, turning them brown and dry (causing severe flower drop). Sample 5 panicles per tree in inner shaded canopy for hopper count.',
    actionRequired: 'If hopper count > 3/panicle, spray Azadirachtin (Neem oil 10,000 ppm) @ 2 ml/L or Thiamethoxam 25 WG @ 0.3 g/L.',
    timing: 'Inspect within 2 days; Spray in late evening',
    icon: 'Bug',
    badge: 'MEDIUM PRIORITY',
    organicAlternative: 'Neem seed kernel extract (NSKE 5%) spray with soap sticker.'
  },
  {
    id: 'rec-3',
    category: 'POLLINATION',
    title: 'Pollination & Honeybee Protection',
    priority: 'MEDIUM',
    priorityColor: 'amber',
    shortText: 'Encourage pollinators. Avoid excessive pesticide sprays during flowering.',
    fullExplanation: 'Over 85% of mango fruit set depends on insect vectors (Diptera & Apis honeybees). Heavy broad-spectrum spraying during peak bloom drastically cuts fruit set.',
    actionRequired: 'Refrain from spraying during peak bee foraging hours (08:30 AM to 12:30 PM). Place 2-3 bee boxes per acre if available.',
    timing: 'Throughout active bloom window (Next 12 days)',
    icon: 'Sparkles',
    badge: 'MEDIUM PRIORITY',
    organicAlternative: 'Spray 1% jaggery water on perimeter trees to attract beneficial dipteran flies and pollinators.'
  },
  {
    id: 'rec-4',
    category: 'NUTRITION',
    title: 'Foliar Nutrient & Micronutrient Spray',
    priority: 'LOW',
    priorityColor: 'emerald',
    shortText: 'Apply balanced nutrients to support flower retention and fruit set.',
    fullExplanation: 'Boron and Zinc are critical co-factors for pollen tube germination and ovule fertilization. Deficiency causes blackened tips and flower shedding.',
    actionRequired: 'Foliar spray of Solubor (Boron 20%) @ 1.25 g/L + Cheated Zinc @ 1.0 g/L at 50% panicle emergence.',
    timing: 'Within 5–7 days before flower opening',
    icon: 'PackagePlus',
    badge: 'LOW PRIORITY',
    organicAlternative: 'Enriched cow dung slurry (Jeevamsrutha) foliar filter spray @ 5%.'
  },
  {
    id: 'rec-5',
    category: 'WEATHER',
    title: 'Pre-Rain Protection against Powdery Mildew',
    priority: 'HIGH',
    priorityColor: 'red',
    shortText: 'Monitor upcoming rainfall and temperature changes during flowering.',
    fullExplanation: 'Forecast indicates intermittent showers on 27 Aug & 01 Sep. High relative humidity combined with warm temperatures creates peak conditions for Oidium mangiferae (Powdery mildew).',
    actionRequired: 'Apply protective spray of Wettable Sulphur 80% WP @ 2.5 g/L before the 27 Aug rain window.',
    timing: 'Critical: Complete before 26 Aug afternoon',
    icon: 'CloudRain',
    badge: 'HIGH PRIORITY',
    organicAlternative: 'Trichoderma harzianum bio-fungicide @ 5 ml/L.'
  }
];

import { apiClient } from './apiClient';

export const mockRecommendationService = {
  getRecommendations: async (filterPriority = 'ALL') => {
    let recs = [...MOCK_RECOMMENDATIONS];
    try {
      const data = await apiClient.get('/recommendations');
      if (Array.isArray(data) && data.length > 0) {
        recs = data;
      }
    } catch (err) {
      // Fallback
    }

    if (filterPriority === 'ALL') return recs;
    return recs.filter(r => r.priority === filterPriority);
  },

  getOverallFarmRisk: async () => {
    return {
      level: 'Moderate',
      riskScore: 38, // out of 100
      primaryDrivers: [
        'Rainfall showers predicted in 15-day window',
        'Early hopper nymph activity observed in 1 of 4 samples',
        'Panicle elongation healthy in 78% of canopy'
      ],
      farmerSummary: 'Farm health is currently good, with moderate attention needed on moisture regulation and pre-rain fungal prevention.'
    };
  }
};
