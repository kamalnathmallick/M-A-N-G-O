import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    farmId: {
      type: String,
      required: true,
      index: true
    },
    plotId: {
      type: String,
      required: true,
      index: true
    },
    season: {
      type: String,
      default: '',
      index: true
    },
    plotName: {
      type: String,
      default: ''
    },
    variety: {
      type: String,
      default: ''
    },
    floweringStage: {
      type: String,
      default: ''
    },
    predictionLabel: {
      type: String,
      default: ''
    },
    confidenceNote: {
      type: String,
      default: ''
    },
    // Date the farmer ran the analysis in the field (from the wizard).
    analysisDate: {
      type: Date
    },
    // Where the climate inputs for the yield estimate came from:
    // 'live_weather' | 'service_defaults' | 'not_used'.
    climateSource: {
      type: String
    },

    // Yield Metrics — populated ONLY from a real inference response.
    // No defaults: a missing number must stay missing, never become 4.8.
    expectedYieldMin: {
      type: Number
    },
    expectedYieldMax: {
      type: Number
    },
    expectedYieldAverage: {
      type: Number
    },
    yieldUnit: {
      type: String,
      default: 'tonnes / acre'
    },
    totalPlotExpectedMin: {
      type: Number
    },
    totalPlotExpectedMax: {
      type: Number
    },
    totalPlotUnit: {
      type: String,
      default: 'tonnes total'
    },

    // Factors — `label` is presentation only; every metric below is filled
    // from the ML response or left absent.
    factors: {
      budHealth: {
        label: { type: String, default: 'Bud Health' },
        value: { type: String },
        percentage: { type: Number },
        impact: { type: String },
        status: { type: String },
        badge: { type: String }
      },
      climate: {
        label: { type: String, default: 'Climate Condition' },
        value: { type: String },
        percentage: { type: Number },
        impact: { type: String },
        status: { type: String },
        badge: { type: String }
      },
      flowerDropRisk: {
        label: { type: String, default: 'Flower Drop Risk' },
        value: { type: String },
        percentage: { type: Number },
        impact: { type: String },
        status: { type: String },
        badge: { type: String }
      },
      pestRisk: {
        label: { type: String, default: 'Pest Risk' },
        value: { type: String },
        percentage: { type: Number },
        impact: { type: String },
        status: { type: String },
        badge: { type: String }
      }
    },

    // Benchmark — only meaningful when a real reference dataset exists.
    benchmark: {
      varietyHistoricalAverage: { type: Number },
      farmLastYearYield: { type: Number },
      regionalBenchmark: { type: Number },
      differenceFromLastYear: { type: String }
    },

    // Scenarios & Distribution
    yieldDistribution: [
      {
        scenario: { type: String },
        yield: { type: Number },
        probability: { type: Number },
        fill: { type: String },
        isCurrent: { type: Boolean, default: false }
      }
    ],

    // Stage Milestones
    stageMilestones: [
      {
        stage: { type: String },
        date: { type: String },
        status: { type: String },
        health: { type: String }
      }
    ],

    // Model Versioning
    modelVersion: {
      budModel: { type: String, default: 'mangosense-cnn-v1' },
      yieldModel: { type: String, default: 'mangosense-yield-v1' }
    },

    // CNN sample counts — stored here so downstream services (recommendations,
    // dashboard) can read them without a separate HistoryRecord lookup.
    sampleCount: {
      type: Number
    },
    goodYieldCount: {
      type: Number
    },
    poorYieldCount: {
      type: Number
    },
    confidence: {
      type: Number
    },

    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Prediction = mongoose.model('Prediction', predictionSchema);
