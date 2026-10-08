import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Bug,
  Flame,
  Maximize2,
  Filter,
  ArrowRight,
  Info,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  ImageOff
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SAMPLE_BUD_IMAGES } from '../../services/mockImageAnalysisService';
import { apiClient } from '../../services/apiClient';

/**
 * Resolve an image URL returned by the backend.
 *
 * The backend returns relative paths like /uploads/<filename>.
 * The browser needs an absolute URL: http://localhost:5000/uploads/<filename>.
 * We derive the backend origin from apiClient.baseUrl so no URL is hardcoded.
 *
 * Rules:
 *  - Already absolute (http/https/blob/data)  → return as-is
 *  - Relative path starting with /            → prepend backend origin
 *  - Empty / falsy                            → return null (triggers fallback)
 */
const backendOrigin = (() => {
  try {
    return new URL(apiClient.baseUrl).origin; // e.g. "http://localhost:5000"
  } catch {
    return 'http://localhost:5000';
  }
})();

const resolveImageUrl = (url) => {
  if (!url) return null;
  if (/^(https?:|blob:|data:)/.test(url)) return url;
  if (url.startsWith('/')) return `${backendOrigin}${url}`;
  return url;
};

/**
 * Renders a bud image with URL resolution and a graceful "unavailable" fallback.
 * Tries img.url first; if that fails or is empty, tries img.fallbackUrl; if both
 * fail, shows an "Image unavailable" placeholder instead of a blank rectangle.
 */
function BudImage({ url, fallbackUrl, title, className }) {
  const primary = resolveImageUrl(url);
  const secondary = resolveImageUrl(fallbackUrl);
  const [src, setSrc] = useState(primary || secondary);
  const [failed, setFailed] = useState(!primary && !secondary);

  const handleError = useCallback(() => {
    if (src === primary && secondary && secondary !== primary) {
      setSrc(secondary);
    } else {
      setFailed(true);
    }
  }, [src, primary, secondary]);

  if (failed || !src) {
    return (
      <div className={`flex flex-col items-center justify-center gap-1.5 bg-slate-800 text-slate-500 ${className}`}>
        <ImageOff className="w-6 h-6" />
        <span className="text-[10px] font-medium">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      className={className}
      onError={handleError}
    />
  );
}

export default function ImageAnalysisView({
  images = SAMPLE_BUD_IMAGES, 
  isDemo = true,
  analysisSummary = null,
  modelVersion = null,
  errors = [],
  onContinueToYield, 
  onStartNewAnalysis 
}) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  // Farm-level result of THIS run, fetched from the backend after the batch is
  // stored. No mock fallback on purpose: if it is unavailable we say so.
  const [farmResult, setFarmResult] = useState(null);
  const [advisories, setAdvisories] = useState([]);
  const [farmResultLoading, setFarmResultLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFarmResultLoading(true);
      try {
        const [prediction, recs] = await Promise.all([
          apiClient.get('/predictions/latest').catch(() => null),
          apiClient.get('/recommendations').catch(() => null)
        ]);
        if (cancelled) return;
        setFarmResult(prediction || null);
        setAdvisories(Array.isArray(recs) ? recs.slice(0, 3) : []);
      } catch {
        if (!cancelled) {
          setFarmResult(null);
          setAdvisories([]);
        }
      } finally {
        if (!cancelled) setFarmResultLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [images]);
  const [activeModalImage, setActiveModalImage] = useState(null);

  // Binary metrics (CONTRACT.md §0: dataset is binary GOOD/BAD;
  // statuses: healthy = Good Yield Potential, everything else = Poor)
  const total = images.length;
  const goodList = images.filter(img => img.status === 'healthy');
  const poorList = images.filter(img => img.status && img.status !== 'healthy');

  const goodPercent = images.length
    ? Math.round((goodList.length / images.length) * 100)
    : 0;
  const poorPercent = 100 - goodPercent;

  // Avg model confidence — from per-image confidence, else summary, else "—"
  const confidences = images
    .map(img => img.confidence)
    .filter(v => typeof v === 'number' && !Number.isNaN(v));
  const avgConfidence = confidences.length
    ? +(confidences.reduce((acc, v) => acc + v, 0) / confidences.length).toFixed(1)
    : typeof analysisSummary?.confidenceScore === 'number'
    ? analysisSummary.confidenceScore
    : null;

  // Image quality pass rate — from quality.is_valid, else derived from
  // summary.rejectedCount, else "—" when the backend omitted quality data.
  const withQuality = images.filter(
    img => img.quality && typeof img.quality.is_valid === 'boolean'
  );
  const qualityPassPercent = withQuality.length
    ? Math.round(
        (withQuality.filter(img => img.quality.is_valid).length / withQuality.length) * 100
      )
    : typeof analysisSummary?.rejectedCount === 'number'
    ? Math.round((total / (total + analysisSummary.rejectedCount)) * 100)
    : null;

  // ---------------------------------------------------------------------
  // Hero card (spec §5): the classification result itself — prediction,
  // actual softmax confidence, both class probabilities, model identity and
  // aggregate counts. Every number derives from per-image model output.
  // ---------------------------------------------------------------------
  const withRisk = images.filter(
    img => img.risk && typeof img.risk.goodYield === 'number' && typeof img.risk.poorYield === 'number'
  );
  const isSingle = images.length === 1;
  const singleImage = isSingle ? images[0] : null;

  // Batch mean of BOTH class probabilities (only images carrying risk).
  const meanRisk = withRisk.length
    ? {
        goodYield:
          withRisk.reduce((acc, img) => acc + img.risk.goodYield, 0) / withRisk.length,
        poorYield:
          withRisk.reduce((acc, img) => acc + img.risk.poorYield, 0) / withRisk.length
      }
    : null;
  const heroRisk = singleImage?.risk || meanRisk;

  // Prediction: single image -> its label; batch -> majority class with counts,
  // "Mixed" on a tie (mirrors backend batchClassification).
  const heroPrediction = isSingle
    ? singleImage.classification || '—'
    : total === 0
    ? '—'
    : goodList.length > poorList.length
    ? 'Good Yield Potential'
    : poorList.length > goodList.length
    ? 'Poor Yield Potential'
    : 'Mixed';

  const heroPredictionLabel =
    heroPrediction === 'Good Yield Potential'
      ? 'GOOD YIELD POTENTIAL'
      : heroPrediction === 'Poor Yield Potential'
      ? 'POOR YIELD POTENTIAL'
      : heroPrediction === 'Mixed'
      ? `Mixed (G${goodList.length} / P${poorList.length})`
      : heroPrediction;

  // Confidence: single -> exact softmax of that image; batch -> mean of the
  // per-image confidences (labelled as average below).
  const heroConfidence = isSingle
    ? typeof singleImage.confidence === 'number'
      ? singleImage.confidence
      : null
    : avgConfidence;

  // Model identity: architecture is a static fact (config backbone);
  // version comes from the run's modelVersion or the per-image record.
  const heroModelVersion =
    modelVersion?.budModel ||
    images.find(img => img.model_version)?.model_version ||
    (isDemo ? null : 'mangosense-cnn-v1');
  const heroModelLine = heroModelVersion
    ? `MobileNetV3-small · ${heroModelVersion}`
    : 'MobileNetV3-small';

  // Partial quality rejections disclosed on the result page (spec §11).
  const rejectedCount =
    typeof analysisSummary?.rejectedCount === 'number'
      ? analysisSummary.rejectedCount
      : Array.isArray(errors)
      ? errors.length
      : 0;

  const pct = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—');

  const filteredImages = images.filter(img => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'GOOD') return img.status === 'healthy';
    if (selectedFilter === 'POOR') return img.status && img.status !== 'healthy';
    return true;
  });

  const donutData = [
    { name: 'Good Yield Potential', value: goodPercent, color: '#16a34a' },
    { name: 'Poor Yield Potential', value: poorPercent, color: '#ef4444' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Summary Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              {isDemo ? 'Demo Data' : 'Live CNN Model Result'}
            </span>
            <span className="text-slate-400">•</span>
            <span>Yield Potential Classification</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Flower Bud Classification & Health
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            {isDemo
              ? 'Multi-canopy sample classification from the offline demo pipeline.'
              : 'Multi-canopy sample classification from the live CNN model on your uploaded samples.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onStartNewAnalysis}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Re-upload</span>
          </button>
          <button
            onClick={onContinueToYield}
            className="bg-[#155e34] hover:bg-[#124d2b] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <span>Proceed to Yield Prediction</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero: AI FLOWER-BUD ANALYSIS — the classification result itself.
          Prediction / confidence / both class probabilities / model identity
          all come from actual per-image model output (spec §5-§7). */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-emerald-200/70 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Flower-Bud Analysis</span>
          </div>
          <span
            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
              isDemo
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {isDemo ? 'Demo Data — ML service unavailable or demo samples' : 'Live CNN Model Result'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Prediction */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Predicted Yield Potential
            </div>
            <div
              className={`font-display font-extrabold text-lg leading-tight ${
                heroPrediction === 'Good Yield Potential'
                  ? 'text-emerald-700'
                  : heroPrediction === 'Poor Yield Potential'
                  ? 'text-rose-600'
                  : heroPrediction === 'Mixed'
                  ? 'text-amber-600'
                  : 'text-slate-500'
              }`}
            >
              {heroPredictionLabel}
            </div>
            {!isSingle && total > 0 && heroPrediction !== 'Mixed' && (
              <div className="text-xs text-slate-500 mt-1">
                Majority class — {goodList.length} Good / {poorList.length} Poor of {total} samples
              </div>
            )}
            {isSingle && (
              <div className="text-xs text-slate-500 mt-1">
                Single-sample classification
              </div>
            )}
            {!isSingle && total > 0 && heroPrediction === 'Mixed' && (
              <div className="text-xs text-slate-500 mt-1">
                Tie between classes — no majority
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Confidence
            </div>
            <div className="font-display font-extrabold text-lg text-slate-900">
              {typeof heroConfidence === 'number' ? `${heroConfidence}%` : '—'}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {!isSingle && typeof heroConfidence === 'number'
                ? 'Average per-image softmax confidence'
                : typeof heroConfidence === 'number'
                ? 'Softmax output of the model'
                : 'Not available'}
            </div>
          </div>

          {/* Model */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Model
            </div>
            <div className="font-display font-extrabold text-lg text-slate-900">
              MobileNetV3-small
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {heroModelVersion ? `Version ${heroModelVersion}` : 'Version not recorded for demo samples'}
            </div>
          </div>
        </div>

        {/* Both class probabilities (§6): exact risk for a single image,
            batch mean otherwise. */}
        <div className="mt-4 rounded-xl border border-slate-100 p-4">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
            Class Probabilities{!isSingle && withRisk.length > 0 ? ` (mean of ${withRisk.length} sample${withRisk.length > 1 ? 's' : ''})` : ''}
          </div>
          {heroRisk ? (
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-emerald-700">GOOD {pct(heroRisk.goodYield)}</span>
                  <span className="text-slate-400">Good Yield Potential</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, heroRisk.goodYield * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-rose-600">POOR {pct(heroRisk.poorYield)}</span>
                  <span className="text-slate-400">Poor Yield Potential</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, heroRisk.poorYield * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500">Not available for these samples.</p>
          )}
        </div>

        {/* Aggregate row (§7) */}
        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Samples analyzed</div>
            <div className="font-display font-extrabold text-slate-900">{total}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-emerald-600 uppercase">Good</div>
            <div className="font-display font-extrabold text-emerald-700">{goodList.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-rose-500 uppercase">Poor</div>
            <div className="font-display font-extrabold text-rose-600">{poorList.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase">Good-potential ratio</div>
            <div className="font-display font-extrabold text-slate-900">{goodPercent}%</div>
          </div>
        </div>

        {/* Partial quality rejections (§11) — disclosed, never silently dropped */}
        {rejectedCount > 0 && (
          <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <strong>{rejectedCount} sample{rejectedCount > 1 ? 's' : ''} rejected by quality checks.</strong>{' '}
              Image quality is insufficient for reliable classification. Please upload a clearer image.
              {' '}The results above cover the {total} sample{total !== 1 ? 's' : ''} that passed validation.
              {Array.isArray(errors) && errors.length > 0 && (
                <span className="block mt-1 text-amber-800">
                  {errors.map((e, i) => `${e.filename || `Image ${i + 1}`}: ${e.message}`).join(' · ')}
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Summary Cards: Donut Chart + Drop Risk Factors */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Donut Health Distribution Card (6/12) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Overall Bud Health Summary
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                {images.length} Samples Assessed
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Breakdown of healthy floral panicles versus risk-affected clusters.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-12 items-center gap-4">
              {/* Donut Chart */}
              <div className="sm:col-span-5 h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val) => [`${val}%`, 'Proportion']}
                      contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-slate-900 font-display">
                    {goodPercent}%
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">
                    Good
                  </span>
                </div>
              </div>

              {/* Legend & Stats */}
              <div className="sm:col-span-7 space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <span className="font-bold text-emerald-950">Good Yield Potential</span>
                  </div>
                  <span className="font-extrabold text-emerald-800">{goodPercent}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/70 border border-rose-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-rose-950">Poor Yield Potential</span>
                  </div>
                  <span className="font-extrabold text-rose-800">{poorPercent}%</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-sky-50/70 border border-sky-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span className="font-bold text-sky-950">Avg Model Confidence</span>
                  </div>
                  <span className="font-extrabold text-sky-800">
                    {avgConfidence !== null ? `${avgConfidence}%` : '—'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-purple-50/70 border border-purple-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span className="font-bold text-purple-950">Image Quality Pass</span>
                  </div>
                  <span className="font-extrabold text-purple-800">
                    {qualityPassPercent !== null ? `${qualityPassPercent}%` : '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flower Drop Risk Factors Card (6/12) */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-base text-slate-900 font-display">
                Flower Drop Risk Analysis
              </h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                {analysisSummary?.flowerDropRisk || (isDemo ? 'Moderate' : 'Not available')} Risk
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Estimated flower-drop sensitivity synthesized across 3 agronomic vectors:
            </p>

            <div className="space-y-3">
              {/* Factor 1: Bud Condition */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>1. Bud Vigor & Morphology</span>
                    <span className="text-emerald-700">{goodPercent}% Favorable</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {goodList.length} of {total} sample{total === 1 ? '' : 's'} classified
                    Good Yield Potential
                    {avgConfidence !== null ? ` · mean model confidence ${avgConfidence}%` : ''}.
                  </p>
                </div>
              </div>

              {/* Factor 2: Pest Indicators */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Bug className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>2. Pest Activity (Mango Hopper Nymphs)</span>
                    <span className="text-slate-500">Not estimated</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    The trained model is a binary bud-health classifier (GOOD / BAD). It has
                    no hopper, mildew or desiccation labels, so pest pressure cannot be
                    inferred from these photos.
                  </p>
                </div>
              </div>

              {/* Factor 3: Environmental Stress */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>3. Climatic & Thermal Stress</span>
                    <span className="text-sky-700">
                      {analysisSummary?.flowerDropRisk || 'Not available'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Produced by the rule engine from the 15-day climate projection — not by
                    the image model. Advisories are shown below; the rule-based tonnage
                    estimate lives on the Yield Prediction page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model & run provenance — Option A: the classification result page
          never shows rule-based tonnage figures under a "Live Model Result"
          badge (spec §9). The rule-based estimate lives on the Yield
          Prediction page, clearly labelled there. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-base text-slate-900 font-display">
              Model &amp; Run Info
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Classification model only
            </span>
          </div>
          <div className="mt-3 space-y-2.5">
            <p className="text-[11px] text-slate-500">
              Bud model:{' '}
              <strong className="text-slate-700">
                {heroModelVersion || modelVersion?.budModel || '—'}
              </strong>{' '}
              (MobileNetV3-small, 2-class)
            </p>
            <p className="text-[11px] text-slate-500">
              Input 224×224 · ImageNet normalization · softmax over
              Good/Poor Yield Potential.
            </p>
            {farmResult && (
              <p className="text-[11px] text-slate-500">
                {farmResult.variety} · {farmResult.floweringStage} · season{' '}
                {farmResult.season || '—'}
              </p>
            )}
            <p className="text-[10px] text-slate-400">
              A rule-based tonnage estimate (not a trained yield model) is shown on the
              Yield Prediction page, labelled as such.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 font-display pb-3 border-b border-slate-100">
            Recommended Actions
          </h3>
          {advisories.length === 0 ? (
            <p className="text-xs text-slate-400 mt-3">
              No advisories returned for this plot yet.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {advisories.map((rec) => (
                <li key={rec._id || rec.title} className="flex items-start gap-2">
                  <ShieldAlert className="w-3.5 h-3.5 mt-0.5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{rec.title}</p>
                    <p className="text-[11px] text-slate-500">{rec.shortText || rec.fullExplanation}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Interactive Sample Images Grid with Filters */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-base text-slate-900 font-display">
              Sample Bud Classification Gallery
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Click any sample to inspect its class probabilities, quality metrics and confidence
            </span>
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'ALL' ? 'bg-[#155e34] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({images.length})
            </button>
            <button
              onClick={() => setSelectedFilter('GOOD')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'GOOD' ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Good ({goodList.length})
            </button>
            <button
              onClick={() => setSelectedFilter('POOR')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                selectedFilter === 'POOR' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
              }`}
            >
              Poor ({poorList.length})
            </button>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredImages.map((img, idx) => (
            <div
              key={img.id}
              onClick={() => setActiveModalImage(img)}
              className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-200/70 hover:border-emerald-300 hover:shadow-md transition-all duration-200 group cursor-pointer flex flex-col justify-between"
            >
              {/* Photo Box */}
              <div className="relative aspect-4/3 overflow-hidden bg-slate-900">
                <BudImage url={img.url} fallbackUrl={img.fallbackUrl} title={img.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />

                {/* Optional overlay (only present when the source supplies boxes) */}
                {img.boxes && img.boxes[0] && (
                  <div 
                    className={`absolute border-2 rounded-lg pointer-events-none ${
                      img.status === 'healthy' 
                        ? 'border-emerald-400 bg-emerald-400/10' 
                        : img.status === 'diseased'
                        ? 'border-purple-400 bg-purple-400/10'
                        : img.status === 'pest_risk'
                        ? 'border-amber-400 bg-amber-400/10'
                        : 'border-rose-400 bg-rose-400/10'
                    }`}
                    style={{
                      left: `${img.boxes[0].x}%`,
                      top: `${img.boxes[0].y}%`,
                      width: `${img.boxes[0].width}%`,
                      height: `${img.boxes[0].height}%`
                    }}
                  >
                    <span className="absolute -top-5 left-0 text-[9px] font-extrabold bg-black/80 text-white px-1.5 py-0.5 rounded backdrop-blur-xs whitespace-nowrap">
                      {img.boxes[0].label} ({Math.round(img.boxes[0].score * 100)}%)
                    </span>
                  </div>
                )}

                {/* Top Corner Badge */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {img.confidence}% Conf.
                  </span>
                  <div className="w-6 h-6 rounded-full bg-white/90 text-slate-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
              </div>

              {/* Card Meta */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 line-clamp-1">
                    {img.title}
                  </span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    img.status === 'healthy' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : img.status === 'diseased'
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : img.status === 'pest_risk'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {img.classification}
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {img.notes}
                </p>

                {/* Per-image class probabilities — only when the model returned them */}
                {img.risk &&
                  typeof img.risk.goodYield === 'number' &&
                  typeof img.risk.poorYield === 'number' && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-emerald-700">
                        GOOD {(img.risk.goodYield * 100).toFixed(1)}%
                      </span>
                      <span className="text-rose-600">
                        POOR {(img.risk.poorYield * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500"
                        style={{ width: `${Math.min(100, img.risk.goodYield * 100)}%` }}
                      />
                      <div
                        className="h-full bg-rose-500"
                        style={{ width: `${Math.min(100, img.risk.poorYield * 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    Quality:{' '}
                    {img.quality
                      ? img.quality.is_valid
                        ? 'Passed'
                        : 'Failed'
                      : 'Not checked'}
                  </span>
                  <span className="font-semibold text-slate-700">
                    {isDemo ? 'Demo Classification' : 'Live CNN Classification'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Zoom for Single Sample Inspection */}
      {activeModalImage && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            {/* Modal Image Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 font-display">
                  {activeModalImage.title}
                </h4>
                <div className="text-xs text-slate-500 font-medium">
                  {activeModalImage.stage} • {isDemo ? 'Demo Sample Inspection' : 'Live Model Inspection'}
                </div>
              </div>
              <button
                onClick={() => setActiveModalImage(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* High-res Display */}
            <div className="relative aspect-16/10 bg-slate-950 flex items-center justify-center overflow-hidden">
              <BudImage url={activeModalImage.url} fallbackUrl={activeModalImage.fallbackUrl} title={activeModalImage.title} className="w-full h-full object-contain" />

              {activeModalImage.boxes && activeModalImage.boxes[0] && (
                <div 
                  className={`absolute border-2 rounded-lg ${
                    activeModalImage.status === 'healthy' 
                      ? 'border-emerald-400 bg-emerald-400/20' 
                      : 'border-amber-400 bg-amber-400/20'
                  }`}
                  style={{
                    left: `${activeModalImage.boxes[0].x}%`,
                    top: `${activeModalImage.boxes[0].y}%`,
                    width: `${activeModalImage.boxes[0].width}%`,
                    height: `${activeModalImage.boxes[0].height}%`
                  }}
                >
                  <span className="absolute -top-7 left-0 text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded shadow">
                    {activeModalImage.boxes[0].label} ({Math.round(activeModalImage.boxes[0].score * 100)}%)
                  </span>
                </div>
              )}
            </div>

            {/* Modal Details */}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs text-slate-400 font-semibold uppercase">Classification</span>
                  <div className="text-base font-extrabold text-slate-900">
                    {activeModalImage.classification} — {activeModalImage.confidence}%
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-semibold uppercase">
                    Image Quality
                  </span>
                  <div className="text-base font-extrabold text-emerald-700">
                    {activeModalImage.quality
                      ? `${activeModalImage.quality.is_valid ? 'Passed' : 'Failed'}${
                          typeof activeModalImage.quality.blur_score === 'number'
                            ? ` • Blur ${Math.round(activeModalImage.quality.blur_score)}`
                            : ''
                        }`
                      : 'Not checked'}
                  </div>
                </div>
              </div>

              {/* Both class probabilities for this image (§6) */}
              {activeModalImage.risk &&
                typeof activeModalImage.risk.goodYield === 'number' &&
                typeof activeModalImage.risk.poorYield === 'number' && (
                <div className="rounded-xl border border-slate-200 p-3 space-y-2">
                  <span className="text-xs text-slate-400 font-semibold uppercase">
                    Class Probabilities
                  </span>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-emerald-700">
                        GOOD {(activeModalImage.risk.goodYield * 100).toFixed(1)}%
                      </span>
                      <span className="text-slate-400">Good Yield Potential</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(100, activeModalImage.risk.goodYield * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-rose-600">
                        POOR {(activeModalImage.risk.poorYield * 100).toFixed(1)}%
                      </span>
                      <span className="text-slate-400">Poor Yield Potential</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${Math.min(100, activeModalImage.risk.poorYield * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-700 border border-slate-200">
                <span className="font-bold">Agronomist Observation: </span>
                <span>{activeModalImage.notes}</span>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setActiveModalImage(null)}
                  className="px-5 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900 transition-colors"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
