// Image Analysis Service for Mango Flower Buds
// Real uploads POST multipart to the backend /predictions/bud endpoint.
// Demo samples (no real File objects) take the explicitly-simulated path and
// are flagged isDemo:true. Backend failures for real uploads are propagated to
// the caller instead of silently degrading to simulation.

export const SAMPLE_BUD_IMAGES = [
  {
    id: 'img-1',
    url: '/samples/mango_sample_1.jpg',
    fallbackUrl: '/samples/mango_sample_1.jpg',
    title: 'Panicle Sample #1 (North Canopy)',
    stage: 'Panicle Elongation & Bloom',
    classification: 'Healthy Bud',
    confidence: 94.2,
    status: 'healthy',
    detectedBuds: 45,
    healthyBuds: 42,
    affectedBuds: 3,
    notes: 'Vigorous terminal axis elongation with uniform floral branching and zero anthracnose lesions.',
    boxes: [
      { x: 25, y: 15, width: 50, height: 60, label: 'Healthy Panicle', score: 0.95, status: 'healthy' }
    ]
  },
  {
    id: 'img-2',
    url: '/samples/mango_sample_2.jpg',
    fallbackUrl: '/samples/mango_sample_2.jpg',
    title: 'Panicle Sample #2 (East Canopy)',
    stage: 'Early Fruitlet Setting',
    classification: 'Healthy Bud',
    confidence: 91.8,
    status: 'healthy',
    detectedBuds: 48,
    healthyBuds: 44,
    affectedBuds: 4,
    notes: 'Uniform pea-stage fruitlet emergence on healthy reddish rachis branches.',
    boxes: [
      { x: 18, y: 20, width: 48, height: 65, label: 'Fruitlet Cluster', score: 0.93, status: 'healthy' }
    ]
  },
  {
    id: 'img-3',
    url: '/samples/mango_sample_3.jpg',
    fallbackUrl: '/samples/mango_sample_3.jpg',
    title: 'Panicle Sample #3 (Inner Canopy)',
    stage: 'Active Bloom & Anthesis',
    classification: 'Pest Risk (Mango Hopper)',
    confidence: 83.5,
    status: 'pest_risk',
    detectedBuds: 42,
    healthyBuds: 30,
    affectedBuds: 12,
    notes: 'Honeydew deposition and hopper activity suspected along secondary rachis branches.',
    boxes: [
      { x: 22, y: 28, width: 55, height: 50, label: 'Hopper Activity', score: 0.84, status: 'pest_risk' }
    ]
  },
  {
    id: 'img-4',
    url: '/samples/mango_sample_4.png',
    fallbackUrl: '/samples/mango_sample_4.png',
    title: 'Panicle Sample #4 (South Edge)',
    stage: 'Late Bloom & Desiccation Check',
    classification: 'Flower Drop Risk',
    confidence: 86.4,
    status: 'drop_risk',
    detectedBuds: 38,
    healthyBuds: 24,
    affectedBuds: 14,
    notes: 'Dry brownish floret desiccation with early flower drop risk detected on terminal cluster.',
    boxes: [
      { x: 20, y: 25, width: 60, height: 65, label: 'Desiccated Florets', score: 0.87, status: 'drop_risk' }
    ]
  }
];

import { apiClient } from './apiClient';

export const mockImageAnalysisService = {
  getSampleImages: async () => {
    return [...SAMPLE_BUD_IMAGES];
  },

  /**
   * Analyze a batch of bud images.
   * @param {Array} images    wizard image entries (may carry `rawFile`)
   * @param {Function} onProgress  progress callback driven by the REAL request
   *                 lifecycle: { currentIndex, total, percent, currentImageTitle }
   * @param {Object} meta     { farmId, plotId, variety, floweringStage,
   *                            canopyDirection, season } appended to FormData
   *                 per CONTRACT.md §3 (POST /predictions/bud).
   * @returns {Object} result with `isDemo` flag (false = live model output)
   * @throws {Error} when real files were sent and the backend failed — the
   *         message is surfaced to the user instead of fabricating results.
   */
  analyzeImageBatch: async (images, onProgress, meta = {}) => {
    const realFiles = images.filter((img) => img.rawFile instanceof File);

    if (realFiles.length > 0) {
      const formData = new FormData();
      realFiles.forEach((img) => {
        formData.append('images', img.rawFile, img.rawFile.name);
      });

      formData.append('variety', meta.variety || images[0]?.variety || 'Alphonso (Hapus)');
      formData.append(
        'floweringStage',
        meta.floweringStage || images[0]?.stage || 'Panicle Elongation & Bloom'
      );
      if (meta.farmId) formData.append('farmId', meta.farmId);
      if (meta.plotId) formData.append('plotId', meta.plotId);
      if (meta.canopyDirection) formData.append('canopyDirection', meta.canopyDirection);
      if (meta.season) formData.append('season', meta.season);

      const total = realFiles.length || 1;

      // Progress reflects the actual request lifecycle — no fake timers.
      if (onProgress) {
        onProgress({
          currentIndex: 0,
          total,
          percent: 30,
          currentImageTitle: `Uploading ${total} image${total > 1 ? 's' : ''} to the MangoSense backend...`
        });
      }

      let res;
      try {
        res = await apiClient.postFormData('/predictions/bud', formData);
      } catch (err) {
        // Real upload failed — propagate a meaningful error to the wizard.
        const error = new Error(
          err && err.message
            ? err.message
            : 'Image analysis request failed. Please check your connection and try again.'
        );
        error.offline = !!(err && err.offline);
        error.status = err && err.status;
        throw error;
      }

      if (onProgress) {
        onProgress({
          currentIndex: total,
          total,
          percent: 100,
          currentImageTitle: 'Finalizing analysis results...'
        });
      }

      if (!res) {
        throw new Error('The backend returned an empty analysis response.');
      }

      const resultImages = Array.isArray(res.images) ? res.images : [];
      if (resultImages.length === 0) {
        // Never fabricate a sample analysis when real images were submitted.
        const firstError =
          Array.isArray(res.errors) && res.errors.length > 0 ? res.errors[0].message : null;
        throw new Error(
          firstError ||
            'None of the uploaded images passed quality checks. Please upload clearer bud photos.'
        );
      }

      return {
        success: true,
        isDemo: res.isDemo === true,
        fromBackend: true,
        summary: res.summary,
        images: resultImages,
        errors: res.errors,
        predictionId: res.predictionId,
        modelVersion: res.modelVersion
      };
    }

    // ------------------------------------------------------------------
    // Demo-samples path: legitimate offline simulation, flagged isDemo:true.
    // ------------------------------------------------------------------
    const total = images.length || 4;
    const results = [];

    for (let i = 0; i < total; i++) {
      if (onProgress) {
        onProgress({
          currentIndex: i + 1,
          total,
          percent: Math.round(((i + 1) / total) * 100),
          currentImageTitle: images[i]?.title || `Sample #${i + 1}`
        });
      }
      // slight delay for UI feedback
      await new Promise((r) => setTimeout(r, 220));

      const sample = images[i] || SAMPLE_BUD_IMAGES[i % SAMPLE_BUD_IMAGES.length];
      results.push(sample);
    }

    const totalBuds = results.reduce((acc, r) => acc + (r.detectedBuds || 40), 0);
    const healthyBuds = results.reduce((acc, r) => acc + (r.healthyBuds || 32), 0);
    const affectedBuds = totalBuds - healthyBuds;
    const healthPercentage = Math.round((healthyBuds / totalBuds) * 100);

    const goodCount = results.filter((r) => r.status === 'healthy').length;

    return {
      success: true,
      isDemo: true,
      analysisTimestamp: new Date().toISOString(),
      summary: {
        totalImagesAnalyzed: results.length,
        totalBudsDetected: totalBuds,
        healthyBudsCount: healthyBuds,
        affectedBudsCount: affectedBuds,
        overallHealthScore: healthPercentage,
        distribution: {
          goodPercentage: Math.round((goodCount / results.length) * 100),
          poorPercentage: 100 - Math.round((goodCount / results.length) * 100),
          goodRatio: Math.round((goodCount / results.length) * 100),
          poorRatio: 100 - Math.round((goodCount / results.length) * 100)
        },
        flowerDropRisk: healthPercentage >= 80 ? 'Low' : healthPercentage >= 70 ? 'Moderate' : 'High',
        confidenceScore: 89.2
      },
      images: results
    };
  }
};
