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
      default: 'Plot A — 2.5 acres'
    },
    variety: {
      type: String,
      default: 'Alphonso (Hapus)'
    },
    floweringStage: {
      type: String,
      default: 'Panicle Elongation & Bloom'
    },
    predictionLabel: {
      type: String,
      default: 'Prototype Prediction'
    },
    confidenceNote: {
      type: String,
      default: 'Estimation based on multi-sample bud classification and 15-day climate projection.'
    },

    // Yield Metrics
    expectedYieldMin: {
      type: Number,
      required: true,
      default: 4.8
    },
    expectedYieldMax: {
      type: Number,
      required: true,
      default: 5.4
    },
    expectedYieldAverage: {
      type: Number,
      required: true,
      default: 5.1
    },
    yieldUnit: {
      type: String,
      default: 'tonnes / acre'
    },
    totalPlotExpectedMin: {
      type: Number,
      default: 12.0
    },
    totalPlotExpectedMax: {
      type: Number,
      default: 13.5
    },
    totalPlotUnit: {
      type: String,
      default: 'tonnes total'
    },

    // Factors
    factors: {
      budHealth: {
        label: { type: String, default: 'Bud Health' },
        value: { type: String, default: '78% healthy' },
        percentage: { type: Number, default: 78 },
        impact: { type: String, default: '+18% vs poor bud baseline' },
        status: { type: String, default: 'favorable' },
        badge: { type: String, default: 'High Quality Panicles' }
      },
      climate: {
        label: { type: String, default: 'Climate Condition' },
        value: { type: String, default: 'Favorable' },
        percentage: { type: Number, default: 82 },
        impact: { type: String, default: '+12% optimal anthesis window' },
        status: { type: String, default: 'favorable' },
        badge: { type: String, default: 'Optimal Temperature' }
      },
      flowerDropRisk: {
        label: { type: String, default: 'Flower Drop Risk' },
        value: { type: String, default: 'Moderate' },
        percentage: { type: Number, default: 35 },
        impact: { type: String, default: '-9% potential yield loss if untreated' },
        status: { type: String, default: 'warning' },
        badge: { type: String, default: 'Monitor Rain & Wind' }
      },
      pestRisk: {
        label: { type: String, default: 'Pest Risk' },
        value: { type: String, default: 'Low – Moderate' },
        percentage: { type: Number, default: 22 },
        impact: { type: String, default: '-4% localized hopper pressure' },
        status: { type: String, default: 'favorable' },
        badge: { type: String, default: 'Early Stage Detected' }
      }
    },

    // Benchmark
    benchmark: {
      varietyHistoricalAverage: { type: Number, default: 4.6 },
      farmLastYearYield: { type: Number, default: 4.5 },
      regionalBenchmark: { type: Number, default: 4.2 },
      differenceFromLastYear: { type: String, default: '+13.3%' }
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
