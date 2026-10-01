import mongoose from 'mongoose';

const plotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    variety: { type: String, required: true },
    treeCount: { type: Number, default: 150 },
    treeAge: { type: String, default: '7 Years' },
    floweringStage: { type: String, default: 'Panicle Elongation & Bloom' },
    healthScore: { type: Number, default: 78 },
    expectedYield: { type: String, default: '4.8 – 5.4' },
    yieldUnit: { type: String, default: 'tonnes/acre' },
    flowerDropRisk: { type: String, default: 'Moderate' },
    climateRisk: { type: String, default: 'Low – Moderate' },
    lastAnalysisDate: { type: String, default: '' }
  },
  { _id: false }
);

const farmSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    name: {
      type: String,
      required: [true, 'Please provide farm name'],
      trim: true
    },
    location: {
      type: String,
      required: [true, 'Please provide farm location'],
      trim: true
    },
    totalArea: {
      type: String,
      default: '10.0 acres'
    },
    establishedYear: {
      type: Number,
      default: 2018
    },
    soilType: {
      type: String,
      default: 'Laterite Red Loam'
    },
    irrigationType: {
      type: String,
      default: 'Drip Micro-irrigation'
    },
    season: {
      type: String,
      default: '',
      index: true
    },
    // True for seeded/demo farms so clients can label them honestly
    isDemo: {
      type: Boolean,
      default: false
    },
    plots: [plotSchema]
  },
  {
    timestamps: true
  }
);

export const Farm = mongoose.model('Farm', farmSchema);
