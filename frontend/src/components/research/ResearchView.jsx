import React from 'react';
import { 
  Cpu, 
  Database, 
  Layers, 
  Network, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Code2, 
  Server, 
  FileText, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export default function ResearchView() {
  const modelStatuses = [
    { label: 'Flower Bud Dataset', status: 'Pending Collection', note: 'Standardized panicle image dataset under collection across Konkan & Andhra groves.', color: 'amber', icon: Database },
    { label: 'CNN Feature Extractor', status: 'Architecture Planned', note: 'Transfer learning backbone (YOLOv8-Nano / EfficientNet-B2) for bud instance segmentation.', color: 'blue', icon: Network },
    { label: 'Climatic Feature Fusion', status: 'Engineered Spec', note: '15-day sliding window integrating GDD (Growing Degree Days), VPD, RH & rainfall anomalies.', color: 'emerald', icon: Layers },
    { label: 'Yield Estimation Regressor', status: 'Prototype Heuristic', note: 'Ensemble Random Forest / SVR / XGBoost trained on bud count + meteorological regressors.', color: 'purple', icon: Cpu },
    { label: 'FastAPI Backend Layer', status: 'Interface Ready', note: 'Async REST endpoints designed for `/api/v1/analyze-buds` and `/api/v1/predict-yield`.', color: 'teal', icon: Server },
  ];

  const apiEndpoints = [
    { method: 'POST', path: '/api/v1/buds/detect-batch', desc: 'Upload multiple panicle JPEG/PNG images for bud count & health classification (YOLOv8/CNN).' },
    { method: 'POST', path: '/api/v1/climate/correlate', desc: 'Fetch weather station 15-day telemetry & compute flower-drop stress index.' },
    { method: 'POST', path: '/api/v1/yield/predict-range', desc: 'Feature fusion of bud density + climate vectors → yields min/max tonnes/acre interval.' },
    { method: 'GET', path: '/api/v1/advisory/recommendations', desc: 'Generates rule-based and ML-driven IPM & irrigation tasks for farmers.' },
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
            Transparent technical roadmap detailing the transition from frontend prototype to production ML pipeline.
          </p>
        </div>

        <div className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-bold border border-amber-200/80 flex items-center gap-1.5 self-start md:self-auto">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span>Stage: Research Prototype</span>
        </div>
      </div>

      {/* Model Milestone Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modelStatuses.map((item, idx) => {
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
                <h4 className="font-bold text-sm text-slate-900 font-display">
                  {item.label}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {item.note}
                </p>
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

        {/* Visual Architecture Blocks */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 font-mono text-xs text-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-bold text-emerald-700">1. Mobile Client</div>
              <div className="text-[11px] text-slate-500 mt-1">Multi-angle bud photos + GPS micro-location</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-bold text-blue-700">2. FastAPI Gateway</div>
              <div className="text-[11px] text-slate-500 mt-1">Image preprocessing, resizing & normalization</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-bold text-purple-700">3. CNN Inference</div>
              <div className="text-[11px] text-slate-500 mt-1">Bud detection, health score & disease masks</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-bold text-amber-700">4. Feature Fusion</div>
              <div className="text-[11px] text-slate-500 mt-1">Bud density + 15-day weather vectors</div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
              <div className="font-bold text-emerald-800">5. Yield & Advisory</div>
              <div className="text-[11px] text-slate-500 mt-1">Predicted t/acre range + Farmer actions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Target FastAPI Backend Integration Contract */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100/90 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-base text-slate-900 font-display">
              Target FastAPI API Contract (Future Integration)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">OpenAPI 3.1 Ready</span>
        </div>

        <div className="space-y-2.5">
          {apiEndpoints.map((ep, i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded font-bold ${ep.method === 'POST' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                  {ep.method}
                </span>
                <span className="font-bold text-slate-800">{ep.path}</span>
              </div>
              <div className="text-slate-500 font-sans text-xs sm:text-right">
                {ep.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
