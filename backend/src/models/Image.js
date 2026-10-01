import mongoose from 'mongoose';

const boundingBoxSchema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    label: { type: String, default: 'Bud Cluster' },
    score: { type: Number, default: 0.9 },
    status: { type: String, default: 'healthy' }
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    farmId: {
      type: String,
      index: true
    },
    plotId: {
      type: String,
      index: true
    },
    season: {
      type: String,
      default: '',
      index: true
    },
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      default: 'image/jpeg'
    },
    size: {
      type: Number,
      default: 0
    },
    canopyDirection: {
      type: String,
      enum: ['North', 'South', 'East', 'West', 'Inner', 'General'],
      default: 'General'
    },
    stage: {
      type: String,
      default: 'Panicle Elongation & Bloom'
    },
    // Quality check
    quality: {
      isValid: { type: Boolean, default: true },
      blurScore: { type: Number, default: 120 },
      isBlurry: { type: Boolean, default: false },
      brightness: { type: Number, default: 128 },
      message: { type: String, default: 'Pass' }
    },
    // Inference results
    classification: {
      type: String,
      default: 'Good Yield Potential'
    },
    confidence: {
      type: Number,
      default: 90.0
    },
    status: {
      // Binary label set per CONTRACT.md §0:
      //   healthy (GOOD), poor_yield (BAD), rejected (quality failure)
      // legacy values kept for previously stored documents.
      type: String,
      enum: ['healthy', 'poor_yield', 'rejected', 'pest_risk', 'diseased', 'drop_risk'],
      default: 'healthy'
    },
    // NOTE: detectedBuds / healthyBuds / affectedBuds / boxes intentionally
    // have NO defaults and are never written by the backend — the dataset has
    // no bounding boxes or bud counts, and fabricated values must never be
    // emitted (CONTRACT.md §0). The fields are kept only for legacy documents.
    detectedBuds: {
      type: Number
    },
    healthyBuds: {
      type: Number
    },
    affectedBuds: {
      type: Number
    },
    notes: {
      type: String,
      default: ''
    },
    boxes: [boundingBoxSchema],
    // True when classification came from the offline demo fallback
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export const Image = mongoose.model('Image', imageSchema);
