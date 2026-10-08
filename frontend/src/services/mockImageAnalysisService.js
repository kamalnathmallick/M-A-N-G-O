// Image Analysis Service for Mango Flower Buds
// Real uploads POST multipart to the backend /predictions/bud endpoint.
// Demo samples (no real File objects) take the explicitly-simulated path and
// are flagged isDemo:true. Backend failures for real uploads are propagated to
// the caller instead of silently degrading to simulation.
//
// Contract §0: the dataset is binary (GOOD -> "Good Yield Potential" /
// healthy, BAD -> "Poor Yield Potential" / poor_yield). No bounding boxes or
// bud counts exist, so demo samples never carry `boxes`, `detectedBuds`,
// `healthyBuds` or `affectedBuds` either — the same rule as the ML service.
// Demo `risk` values are derived from each sample's stated demo confidence so
// the probability display has something consistent to show; the whole page is
// labelled Demo Data while these samples are on screen.

export const SAMPLE_BUD_IMAGES = [
  {
    id: 'img-1',
    url: '/samples/mango_sample_1.jpg',
    fallbackUrl: '/samples/mango_sample_1.jpg',
    title: 'Panicle Sample #1 (North Canopy)',
    stage: 'Panicle Elongation & Bloom',
    classification: 'Good Yield Potential',
    confidence: 94.2,
    status: 'healthy',
    risk: { goodYield: 0.942, poorYield: 0.058 },
    notes: 'Vigorous terminal axis elongation with uniform floral branching (demo sample).'
  },
  {
    id: 'img-2',
    url: '/samples/mango_sample_2.jpg',
    fallbackUrl: '/samples/mango_sample_2.jpg',
    title: 'Panicle Sample #2 (East Canopy)',
    stage: 'Early Fruitlet Setting',
    classification: 'Good Yield Potential',
    confidence: 91.8,
    status: 'healthy',
    risk: { goodYield: 0.918, poorYield: 0.082 },
    notes: 'Uniform pea-stage development on healthy reddish rachis branches (demo sample).'
  },
  {
    id: 'img-3',
    url: '/samples/mango_sample_3.jpg',
    fallbackUrl: '/samples/mango_sample_3.jpg',
    title: 'Panicle Sample #3 (Inner Canopy)',
    stage: 'Active Bloom & Anthesis',
    classification: 'Poor Yield Potential',
    confidence: 83.5,
    status: 'poor_yield',
    risk: { goodYield: 0.165, poorYield: 0.835 },
    notes: 'Uneven development observed along secondary rachis branches (demo sample).'
  },
  {
    id: 'img-4',
    url: '/samples/mango_sample_4.png',
    fallbackUrl: '/samples/mango_sample_4.png',
    title: 'Panicle Sample #4 (South Edge)',
    stage: 'Late Bloom & Desiccation Check',
    classification: 'Poor Yield Potential',
    confidence: 86.4,
    status: 'poor_yield',
    risk: { goodYield: 0.136, poorYield: 0.864 },
    notes: 'Dry brownish floret desiccation with early flower drop signs (demo sample).'
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
      if (meta.analysisDate) formData.append('analysisDate', meta.analysisDate);
      // Plot area drives the plot-total yield figures; sent as typed by the farmer.
      if (meta.plotArea) formData.append('plotArea', meta.plotArea);
      // Per-sample canopy direction (North/South/East/West) so the backend can
      // label each stored image with the direction it was captured from.
      const sampleMeta = {};
      realFiles.forEach((img) => {
        if (img.canopyDirection) sampleMeta[img.rawFile.name] = img.canopyDirection;
      });
      if (Object.keys(sampleMeta).length > 0) {
        formData.append('sampleMeta', JSON.stringify(sampleMeta));
      }

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
        // Required sentence (spec §11) comes first; per-image detail follows.
        const firstError =
          Array.isArray(res.errors) && res.errors.length > 0 ? res.errors[0].message : null;
        throw new Error(
          firstError
            ? `Image quality is insufficient for reliable classification. Please upload a clearer image. ${firstError}`
            : 'Image quality is insufficient for reliable classification. Please upload a clearer image.'
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
        // Yield + climate provenance returned WITH the analysis (spec §16)
        yieldEstimation: res.yieldEstimation ?? null,
        climate: res.climate ?? null,
        modelVersion: res.modelVersion
      };
    }

    // ------------------------------------------------------------------
    // Demo-samples path: legitimate offline simulation, flagged isDemo:true.
    // Aggregates below are computed from the demo samples' own labels,
    // confidences and risk values — no hardcoded confidence, no fabricated
    // bud counts (contract §0), no bounding boxes.
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

    const n = results.length || 1;
    const goodCount = results.filter((r) => r.status === 'healthy').length;
    const goodPct = Math.round((goodCount / n) * 100);

    // overallHealthScore = round(mean P(GOOD) * 100), same rule as contract §2
    const risks = results
      .map((r) => r.risk?.goodYield)
      .filter((v) => typeof v === 'number' && !Number.isNaN(v));
    const overallHealthScore = risks.length
      ? Math.round((risks.reduce((acc, v) => acc + v, 0) / risks.length) * 100)
      : goodPct;

    // confidenceScore = mean per-image confidence (one decimal) — measured,
    // never a hardcoded 89.2.
    const confidences = results
      .map((r) => r.confidence)
      .filter((v) => typeof v === 'number' && !Number.isNaN(v));
    const confidenceScore = confidences.length
      ? +(confidences.reduce((acc, v) => acc + v, 0) / confidences.length).toFixed(1)
      : null;

    return {
      success: true,
      isDemo: true,
      analysisTimestamp: new Date().toISOString(),
      summary: {
        totalImagesAnalyzed: results.length,
        overallHealthScore,
        distribution: {
          goodPercentage: goodPct,
          poorPercentage: 100 - goodPct,
          goodRatio: goodPct,
          poorRatio: 100 - goodPct
        },
        flowerDropRisk:
          overallHealthScore >= 80 ? 'Low' : overallHealthScore >= 70 ? 'Moderate' : 'High',
        confidenceScore
      },
      images: results
    };
  }
};
