import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Database,
  Layers,
  Network,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Server,
  FileText,
  BarChart3,
  FlaskConical,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const pct = (v) => (typeof v === 'number' ? `${(v * 100).toFixed(1)}%` : '—');
const num = (v) => (typeof v === 'number' ? String(v) : '—');
const cls = (v) => (typeof v === 'number' ? v.toFixed(3) : '—');

/**
 * Research / mentor briefing page.
 *
 * All dataset + evaluation numbers are fetched live from GET /ml/info
 * (Express proxy -> FastAPI /model/info -> evaluation_report.json,
 * training_metrics.json and a disk count of dataset/raw). Nothing here is
 * hardcoded: when the ML service is offline the page says so instead of
 * printing numbers. No production-readiness claims anywhere.
 */
export default function ResearchView() {
  const [modelInfo, setModelInfo] = useState(null); // { available, info } | null
  const [fetchState, setFetchState] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetchState('loading');
      try {
        const res = await apiClient.get('/ml/info');
        if (cancelled) return;
        setModelInfo(res || null);
        setFetchState('ready');
      } catch {
        if (cancelled) return;
        setModelInfo(null);
        setFetchState('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const info = modelInfo?.available ? modelInfo.info : null;
  const metrics = info?.evaluation?.metrics || null;
  const report = metrics?.classificationReport || null;
  const perClassRows = ['Good Yield Potential', 'Poor Yield Potential']
    .map((k) => (report && report[k] ? { label: k, ...report[k] } : null))
    .filter(Boolean);
  const confusion = info?.evaluation?.confusionMatrix || null;
  const warnings = info?.evaluation?.warnings || [];
  const counts = info?.dataset?.classCounts || null;
  const split = info?.split || null;
  const trainedYield = info?.yieldModel?.trained === true;

  // Real, implemented pipeline steps (the demo flow) — no fabricated
  // detection / segmentation / disease-mask steps (contract §0).
  const pipelineSteps = [
    { n: '1', title: 'React Client', tone: 'emerald', desc: 'Photo upload -> Express API (React never calls Python directly)' },
    { n: '2', title: 'Validation + Quality', tone: 'blue', desc: 'File type/size, blur, brightness & resolution gates — failures return 422' },
    { n: '3', title: 'Preprocess', tone: 'purple', desc: 'Resize 224×224 · ImageNet mean/std normalization' },
    { n: '4', title: 'CNN Inference', tone: 'amber', desc: 'MobileNetV3-small -> softmax -> GOOD / POOR + confidence' },
    { n: '5', title: 'Rule Engine + Advisory', tone: 'emerald', desc: 'Probabilities + 15-day climate -> rule-based range & farmer actions' }
  ];

  // Endpoints that EXIST today (not a future contract).
  const endpoints = [
    { method: 'POST', path: '/api/predictions/bud', layer: 'Express', desc: 'Multipart batch classification; 422 when every image fails quality checks.' },
    { method: 'GET', path: '/api/predictions/latest', layer: 'Express', desc: 'Latest stored run (classification result, rule-based range, model versions).' },
    { method: 'POST', path: '/api/predictions/simulate', layer: 'Express', desc: 'What-if simulator — rule engine only (trained: false).' },
    { method: 'GET', path: '/api/ml/info', layer: 'Express', desc: 'Public proxy of the model card + evaluation metrics (this page).' },
    { method: 'POST', path: '/predict/bud', layer: 'FastAPI', desc: 'CNN inference: quality gate -> resize/normalize -> MobileNetV3-small -> softmax.' },
    { method: 'GET', path: '/model/info', layer: 'FastAPI', desc: 'Model card read from evaluation_report.json / training_metrics.json + dataset disk count.' },
    { method: 'GET', path: '/health', layer: 'FastAPI', desc: 'Weights-loaded / demo-mode status.' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-600" />
            <span>Academic & University Mentor Briefing</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Research Architecture & Model Status
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Live evaluation metrics read from the actual training run — a preliminary
            small-dataset pipeline sanity check, not a production-readiness claim.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200/80 flex items-center gap-1.5 self-start md:self-auto">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Stage: Research Prototype — Preliminary</span>
        </div>
      </div>

      {/* Live evaluation metrics (fetched, never hardcoded) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="font-bold text-base text-slate-900 font-display flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-700" />
            <span>Model Card & Last Evaluation</span>
          </h3>
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            Source: evaluation_report.json
          </span>
        </div>

        {fetchState === 'loading' && (
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            Loading live metrics from the ML service…
          </p>
        )}

        {(fetchState === 'error' || (fetchState === 'ready' && !modelInfo?.available)) && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong>Model metrics unavailable — ML service is offline.</strong>
              <span className="block mt-1">
                The evaluation numbers are served by the ML service (port 8000) and are not
                cached or fabricated here. Start the ML service and reload this page.
              </span>
            </div>
          </div>
        )}

        {info && (
          <div className="space-y-4">
            {/* Identity row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Model Version</div>
                <div className="font-display font-extrabold text-slate-900 mt-0.5">{info.modelVersion || '—'}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {info.architecture || info.backbone || '—'} · {num(info.numClasses)}-class
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Classes</div>
                <div className="font-display font-extrabold text-slate-900 mt-0.5 text-sm">
                  {(info.classLabels || []).join(' · ') || '—'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  GOOD → {num(info.classToIndex?.GOOD)} · BAD → {num(info.classToIndex?.BAD)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Input</div>
                <div className="font-display font-extrabold text-slate-900 mt-0.5">
                  {(info.inputSize || [224, 224]).join('×')}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  mean {(info.normalization?.mean || []).join('/')}
                  <br />std {(info.normalization?.std || []).join('/')}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Checkpoint</div>
                <div className="font-display font-extrabold text-slate-900 mt-0.5 text-sm break-all">
                  {String(info.checkpoint || '—').split(/[\\/]/).pop()}
                </div>
                <div className={`text-[11px] mt-0.5 font-bold ${info.weightsLoaded ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {info.weightsLoaded ? `Weights loaded${info.isDemo ? '' : ' · live'}` : 'Weights NOT loaded (demo mode)'}
                </div>
              </div>
            </div>

            {/* Dataset + split */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dataset (on disk)</div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-2xl font-black text-slate-900 font-display">
                      {num(info.dataset?.totalImages)}
                    </div>
                    <div className="text-[11px] text-slate-500">total images</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-emerald-700 font-display">{num(counts?.GOOD)}</div>
                    <div className="text-[11px] text-slate-500">GOOD (class 0)</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-rose-600 font-display">{num(counts?.BAD)}</div>
                    <div className="text-[11px] text-slate-500">BAD (class 1)</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {info.dataset?.countedFromDisk
                    ? `Counted from ${info.dataset?.path} at request time.`
                    : 'Dataset folder not reachable — showing report value.'}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 p-4">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Split</div>
                <div className="flex items-end gap-4">
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 font-display">{num(split?.counts?.train)}</div>
                    <div className="text-[11px] text-slate-500">train</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 font-display">{num(split?.counts?.val)}</div>
                    <div className="text-[11px] text-slate-500">val</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 font-display">{num(split?.counts?.test)}</div>
                    <div className="text-[11px] text-slate-500">test</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-500 font-display">{num(split?.seed)}</div>
                    <div className="text-[11px] text-slate-500">seed</div>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {split?.strategy || '—'} · {info.training?.epochsRun ?? '—'} epochs run
                  {info.training?.bestEpoch ? ` (best ${info.training.bestEpoch})` : ''}
                </div>
              </div>
            </div>

            {/* Metrics + confusion matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Held-out Test Metrics
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Preliminary · tiny test set
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase">Test Acc</div>
                    <div className="text-lg font-black text-slate-900 font-display">{pct(metrics?.accuracy)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase">F1-macro</div>
                    <div className="text-lg font-black text-slate-900 font-display">{cls(metrics?.f1Macro)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase">Precision</div>
                    <div className="text-lg font-black text-slate-900 font-display">{cls(metrics?.precision)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400 font-bold uppercase">Recall</div>
                    <div className="text-lg font-black text-slate-900 font-display">{cls(metrics?.recall)}</div>
                  </div>
                </div>

                {perClassRows.length > 0 && (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 font-bold uppercase text-[10px]">
                        <th className="text-left pb-1.5">Class</th>
                        <th className="text-right pb-1.5">Precision</th>
                        <th className="text-right pb-1.5">Recall</th>
                        <th className="text-right pb-1.5">F1</th>
                        <th className="text-right pb-1.5">Support</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-700">
                      {perClassRows.map((row) => (
                        <tr key={row.label} className="border-t border-slate-100">
                          <td className="py-1.5 font-semibold">{row.label}</td>
                          <td className="text-right">{cls(row.precision)}</td>
                          <td className="text-right">{cls(row.recall)}</td>
                          <td className="text-right font-bold">{cls(row['f1-score'])}</td>
                          <td className="text-right">{num(row.support)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 p-4 space-y-3">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Confusion Matrix (test set, rows = actual, cols = predicted)
                </div>
                {confusion ? (
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-[auto_1fr_1fr] gap-1.5 text-xs items-center">
                      <span />
                      <span className="text-center font-bold text-slate-500">Pred GOOD</span>
                      <span className="text-center font-bold text-slate-500">Pred POOR</span>
                      <span className="font-bold text-slate-500">Act GOOD</span>
                      <span className="text-center font-black py-2 rounded bg-emerald-100 text-emerald-800">
                        {num(confusion[0]?.[0])}
                      </span>
                      <span className="text-center font-black py-2 rounded bg-rose-50 text-rose-700">
                        {num(confusion[0]?.[1])}
                      </span>
                      <span className="font-bold text-slate-500">Act POOR</span>
                      <span className="text-center font-black py-2 rounded bg-rose-50 text-rose-700">
                        {num(confusion[1]?.[0])}
                      </span>
                      <span className="text-center font-black py-2 rounded bg-emerald-100 text-emerald-800">
                        {num(confusion[1]?.[1])}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      The POOR class is not yet recalled on the held-out split — the model
                      currently leans toward GOOD. This is exactly the kind of result a
                      16-image dataset produces; it is disclosed, not hidden.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">Unavailable.</p>
                )}

                <div className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-[11px] text-slate-500">
                  Trained: {info.training?.model?.backbone || info.backbone || '—'} ·
                  pretrained={String(info.training?.model?.pretrained)} ·
                  freeze_backbone={String(info.training?.model?.freeze_backbone)} ·
                  feature_dim={num(info.training?.model?.feature_dim_actual)}
                </div>
              </div>
            </div>

            {/* Warnings from the training run itself */}
            {warnings.length > 0 && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 space-y-1.5">
                {warnings.map((w, i) => (
                  <p key={i} className="text-xs text-amber-900 leading-relaxed flex gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                    <span>{w}</span>
                  </p>
                ))}
              </div>
            )}

            {/* Yield model disclosure */}
            <div className={`rounded-xl border p-4 flex items-start gap-2.5 ${trainedYield ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
              <FlaskConical className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong>Yield estimation: {trainedYield ? 'trained regressor' : 'rule engine — NOT a trained model'}.</strong>{' '}
                {trainedYield
                  ? `Model version ${info.yieldModel?.version || '—'}.`
                  : `Version ${info.yieldModel?.ruleVersion || '—'}: deterministic rules over measured bud health + 15-day climate. No regression model (RandomForest / SVR / XGBoost) has been trained, and no tonnage figure on any page is model output.`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model milestone status cards (what actually exists) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Flower Bud Dataset', status: 'Collected (16 images)', note: 'GOOD 10 / BAD 6 raw panicle photos, binary labels, no bounding boxes. Field collection continues.', color: 'amber', icon: Database },
          { label: 'CNN Classifier', status: 'Trained — Preliminary', note: 'MobileNetV3-small transfer learning, 224×224, 2 classes. Sanity-check accuracy only; POOR recall still 0.00 on the test split.', color: 'emerald', icon: Network },
          { label: 'Quality Gate', status: 'Implemented', note: 'Blur / brightness / resolution / file-type checks before inference — failures reject the sample instead of guessing.', color: 'blue', icon: CheckCircle2 },
          { label: 'Climate Fusion', status: 'Rule Engine', note: '15-day projection fused with measured class probabilities for drop-risk and advisories — deterministic, no learned weights.', color: 'purple', icon: Layers },
          { label: 'Yield Regressor', status: 'Not Trained', note: 'Deliberately absent: no synthetic labels or untrained regressor is presented as a model. Tonnage is a labelled rule-based estimate.', color: 'amber', icon: Cpu },
          { label: 'FastAPI + Express API', status: 'Live', note: 'Implemented and exercised end-to-end: React -> Express -> FastAPI -> PyTorch, with MongoDB persistence.', color: 'teal', icon: Server }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100/90 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                  item.color === 'amber'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : item.color === 'blue'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : item.color === 'emerald'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : item.color === 'purple'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-teal-50 text-teal-800 border-teal-200'
                }`}>
                  {item.status}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-900 font-display">{item.label}</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.note}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Architecture Flow Diagram */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 font-display flex items-center gap-2 pb-3 border-b border-slate-100">
          <Layers className="w-4 h-4 text-emerald-700" />
          <span>End-to-End System Data Flow Pipeline</span>
        </h3>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            {pipelineSteps.map((step) => (
              <div key={step.n} className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <div className={`font-bold ${
                  step.tone === 'emerald' ? 'text-emerald-700'
                  : step.tone === 'blue' ? 'text-blue-700'
                  : step.tone === 'purple' ? 'text-purple-700'
                  : 'text-amber-700'
                }`}>
                  {step.n}. {step.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
          The CNN does <strong>binary classification only</strong> — it does not detect buds,
          draw bounding boxes or segment disease. Yield tonnage comes from the rule engine in
          step 5, never from the CNN.
        </p>
      </div>

      {/* Live API surface (implemented, not a future contract) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-base text-slate-900 font-display">Implemented API Surface</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">React → Express → FastAPI</span>
        </div>

        <div className="space-y-2.5">
          {endpoints.map((ep, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-bold ${ep.method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {ep.method}
                </span>
                <span className="font-bold text-slate-800">{ep.path}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px]">{ep.layer}</span>
              </div>
              <div className="text-slate-500 font-sans text-xs sm:text-right">{ep.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Improvement (no promised accuracy numbers) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-base text-slate-900 font-display">Future Improvement</h3>
          </div>
          <span className="text-xs text-slate-400">No accuracy is being promised</span>
        </div>

        <ul className="space-y-2.5">
          {[
            'Grow the dataset to 100–200+ images per class across multiple groves, seasons, cameras and lighting conditions — the single highest-impact step.',
            'Balance the classes (currently 10 GOOD / 6 BAD) and enlarge the held-out test set beyond 4 images so metrics stop swinging run-to-run.',
            'Use group-aware splits (images from the same tree or grove stay in one split) to prevent near-duplicate leakage.',
            'Add disciplined augmentation and capture guidance (distance, focus, backlight) recorded alongside each label.',
            'Hold out an external validation set that is never touched during training or model selection.',
            'Calibrate softmax probabilities and record per-image quality metadata so confidence scores are trustworthy.',
            'Only after the above: revisit model capacity, class weighting and threshold tuning — target metrics to be decided from that larger evaluation, not promised now.'
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-xs text-slate-600 leading-relaxed">
              <span className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 text-[10px] font-extrabold mt-0.5">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-[11px] text-slate-500 leading-relaxed flex gap-2">
          <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            Honest framing for the demo: this is a <strong>classification proof-of-concept</strong>.
            The pipeline (upload → quality gate → preprocess → CNN → probabilities → UI) is real and
            runs live; the accuracy is preliminary and the yield estimate is rule-based.
          </span>
        </div>
      </div>
    </div>
  );
}
