import mongoose from 'mongoose';

const recommendationSchema = new mongoose.Schema(
  {
    farmId: { type: String, default: 'farm-1', index: true },
    plotId: { type: String, default: 'plot-a', index: true },
    predictionId: { type: String, index: true },
    category: {
      type: String,
      enum: ['WATER', 'PEST', 'POLLINATION', 'NUTRITION', 'DISEASE', 'WEATHER'],
      required: true
    },
    title: { type: String, required: true },
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW'],
      default: 'MEDIUM'
    },
    priorityColor: { type: String, default: 'amber' },
    shortText: { type: String, required: true },
    fullExplanation: { type: String, required: true },
    actionRequired: { type: String, required: true },
    timing: { type: String, default: 'Next 48 Hours' },
    icon: { type: String, default: 'Sparkles' },
    badge: { type: String, default: 'RECOMMENDED' },
    organicAlternative: { type: String, default: '' },
    isCompleted: { type: Boolean, default: false },
    // Seeded/demo recommendations must always be flagged so clients can
    // distinguish them from rule-generated output (CONTRACT.md §3).
    isDemo: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

export const Recommendation = mongoose.model('Recommendation', recommendationSchema);
