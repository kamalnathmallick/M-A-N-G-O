import mongoose from 'mongoose';

const historyRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    farmId: { type: String, default: 'farm-1', index: true },
    plot: { type: String, default: 'Plot A' },
    farmName: { type: String, default: 'Green Valley Mango Farm' },
    plotDetails: { type: String, default: 'Plot A — 2.5 acres (Alphonso)' },
    season: { type: String, default: '', index: true },
    date: { type: String, required: true },
    time: { type: String, default: '09:30 AM' },
    budHealth: { type: Number, default: 78 },
    healthyBudsText: { type: String, default: '78%' },

    // Risk values
    flowerDropRisk: { type: String, default: 'Moderate' },
    riskBadgeColor: { type: String, default: 'amber' },
    climateCondition: { type: String, default: 'Unknown' },

    // Batch classification results
    imageIds: [{ type: String }],
    classification: { type: String, default: '' },
    confidence: { type: Number, default: null },
    rejectedCount: { type: Number, default: 0 },
    goodYieldCount: { type: Number, default: 0 },
    poorYieldCount: { type: Number, default: 0 },

    // Climate features captured at prediction time (null when live weather
    // was unavailable — never fabricated)
    climate: {
      temperature: { type: Number, default: null },
      humidity: { type: Number, default: null },
      isLive: { type: Boolean, default: false }
    },

    // Structured numeric yield (display strings below are for the UI)
    expectedYieldMin: { type: Number, default: null },
    expectedYieldMax: { type: Number, default: null },
    expectedYieldAverage: { type: Number, default: null },
    totalPlotExpectedMin: { type: Number, default: null },
    totalPlotExpectedMax: { type: Number, default: null },
    yieldUnit: { type: String, default: 'tonnes / acre' },
    predictedYield: { type: String, default: '4.8 – 5.4 t/acre' },
    totalTonnes: { type: String, default: '12.0 – 13.5 t' },

    sampleCount: { type: Number, default: 4 },
    keyObservation: { type: String, default: '' },

    // Model versioning (mirrors Prediction.modelVersion)
    modelVersion: {
      budModel: { type: String, default: 'mangosense-cnn-v1' },
      yieldModel: { type: String, default: 'mangosense-yield-rule-v1' }
    },

    isDemo: { type: Boolean, default: true }
  },
  {
    timestamps: true
  }
);

// Explicit createdAt index per CONTRACT.md §3 (userId/season indexed above)
historyRecordSchema.index({ createdAt: -1 });

export const HistoryRecord = mongoose.model('HistoryRecord', historyRecordSchema);
