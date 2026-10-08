import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Upload, 
  Check, 
  Sparkles, 
  Trash2, 
  Info, 
  AlertCircle, 
  ArrowRight, 
  Image as ImageIcon, 
  CheckCircle2, 
  RotateCcw,
  Zap,
  SlidersHorizontal,
  Eye
} from 'lucide-react';
import { SAMPLE_BUD_IMAGES, mockImageAnalysisService } from '../../services/mockImageAnalysisService';

// Upload constraints — the backend accepts at most 10 images per analysis and
// the ML quality gate works on JPEG/PNG only.
const MAX_SAMPLES = 10;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_EXT = ['.jpg', '.jpeg', '.png'];
const ACCEPT_ATTR = '.jpg,.jpeg,.png,image/jpeg,image/png';

const fileExtension = (name = '') => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};

const revokeSampleUrl = (img) => {
  if (img?.isObjectUrl && img?.url) URL.revokeObjectURL(img.url);
};

export default function NewAnalysisWizard({ 
  farms, 
  selectedFarm, 
  selectedPlot, 
  onAnalysisCompleted,
  onCancel 
}) {
  // Form State
  const [farmId, setFarmId] = useState(selectedFarm || farms[0]?.id || 'farm-1');
  const activeFarm = farms.find(f => f.id === farmId) || farms[0];
  const [plotId, setPlotId] = useState(selectedPlot || activeFarm?.plots[0]?.id || 'plot-a');
  const activePlot = activeFarm?.plots.find(p => p.id === plotId) || activeFarm?.plots[0];

  const [farmArea, setFarmArea] = useState(activePlot?.name.split('—')[1]?.trim() || '2.5 acres');
  const [mangoVariety, setMangoVariety] = useState(activePlot?.variety || 'Alphonso (Hapus)');
  const [floweringStage, setFloweringStage] = useState('Panicle Elongation & Active Bloom');
  const [canopyDirection, setCanopyDirection] = useState('North');
  const [season, setSeason] = useState(`${new Date().getFullYear()}`);
  const [analysisDate, setAnalysisDate] = useState(new Date().toISOString().split('T')[0]);

  // Image Samples State — starts EMPTY. Samples are either real uploads (pending
  // until the backend classifies them) or demo samples the farmer adds on
  // purpose, which are labelled "Demo sample" and never carry a fake result.
  const [selectedImages, setSelectedImages] = useState([]);
  const [cameraActive, setCameraActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStepLabel, setAnalysisStepLabel] = useState('');
  const [analysisError, setAnalysisError] = useState(null);
  const [uploadNotice, setUploadNotice] = useState(null);
  const [previewModalImage, setPreviewModalImage] = useState(null);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Release blob URLs when the wizard unmounts so previews don't leak.
  const samplesRef = useRef(selectedImages);
  samplesRef.current = selectedImages;
  useEffect(() => () => {
    samplesRef.current.forEach(revokeSampleUrl);
    streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // Handle variety choices
  const varieties = [
    'Alphonso (Hapus)',
    'Kesar',
    'Dasheri',
    'Banganapalli',
    'Totapuri',
    'Langra',
    'Chausa',
    'Amrapali'
  ];

  const floweringStages = [
    'Stage 1: Early Dormant Bud Swelling',
    'Stage 2: Panicle Elongation & Active Bloom',
    'Stage 3: Full Anthesis & Pollination',
    'Stage 4: Early Fruitlet Set (Mustard / Pea stage)'
  ];

  // Quick Demo Add sample
  const handleAddDemoSample = () => {
    const nextIndex = (selectedImages.length % SAMPLE_BUD_IMAGES.length);
    const newSample = {
      ...SAMPLE_BUD_IMAGES[nextIndex],
      id: `sample-${Date.now()}-${selectedImages.length + 1}`,
      title: `Panicle Sample #${selectedImages.length + 1}`,
      // Bundled artwork is NOT a model result — label it as a demo sample.
      classification: 'Demo sample',
      status: 'demo',
      confidence: null,
      detectedBuds: null,
      healthyBuds: null,
      affectedBuds: null,
      notes: 'Bundled demo artwork — not analysed by the model.',
      isObjectUrl: false
    };
    setSelectedImages([...selectedImages, newSample]);
  };

  // Remove image (and release its blob URL)
  const handleRemoveImage = (id) => {
    const target = selectedImages.find((img) => img.id === id);
    revokeSampleUrl(target);
    setSelectedImages(selectedImages.filter(img => img.id !== id));
  };

  /**
   * Validate + register real image files as analysis samples.
   * Shared by the file picker and the camera capture.
   * A sample carries NO classification until the backend returns a real one —
   * pre-filling confidence/bud counts here would be fabricated ML output.
   */
  const addFiles = (incoming) => {
    const files = Array.from(incoming || []);
    if (files.length === 0) {
      setUploadNotice({ type: 'error', text: 'Please upload at least one flower-bud image.' });
      return;
    }

    const rejected = [];
    const accepted = [];
    let room = MAX_SAMPLES - selectedImages.length;

    for (const file of files) {
      if (room <= 0) {
        rejected.push(`${file.name}: sample limit reached (max ${MAX_SAMPLES})`);
        continue;
      }
      const ext = fileExtension(file.name);
      const typeOk = ACCEPTED_EXT.includes(ext) || ['image/jpeg', 'image/png'].includes(file.type);
      if (!typeOk) {
        rejected.push(`${file.name}: unsupported image format (use JPG, JPEG or PNG)`);
        continue;
      }
      if (file.size === 0) {
        rejected.push(`${file.name}: file is empty`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        rejected.push(`${file.name}: larger than 10 MB`);
        continue;
      }
      const duplicate = selectedImages.some(
        (img) => img.rawFile && img.rawFile.name === file.name && img.rawFile.size === file.size
      );
      if (duplicate) {
        rejected.push(`${file.name}: already added`);
        continue;
      }
      accepted.push(file);
      room -= 1;
    }

    if (accepted.length > 0) {
      const stamp = Date.now();
      const newItems = accepted.map((file, idx) => ({
        id: `upload-${stamp}-${idx}`,
        url: URL.createObjectURL(file),
        isObjectUrl: true,
        title: file.name.slice(0, 20) || `Uploaded Sample #${selectedImages.length + idx + 1}`,
        stage: floweringStage,
        // Canopy direction is captured per sample so North/South/East/West
        // samples stay distinguishable in the analysis request.
        canopyDirection,
        // Pending: the real label/confidence arrive from the backend response.
        classification: 'Pending analysis',
        confidence: null,
        status: 'pending',
        detectedBuds: null,
        healthyBuds: null,
        affectedBuds: null,
        notes: 'Awaiting real model analysis.',
        rawFile: file,
        sizeBytes: file.size,
        analysisDate
      }));
      setSelectedImages([...selectedImages, ...newItems]);
    }

    if (rejected.length > 0) {
      setUploadNotice({ type: 'error', text: rejected.join(' · ') });
    } else if (accepted.length > 0) {
      setUploadNotice({
        type: 'info',
        text: `${accepted.length} image${accepted.length > 1 ? 's' : ''} ready for analysis.`
      });
    }
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow re-selecting the same file
    addFiles(files);
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  // Real camera capture. Falls back to the file picker when the device or the
  // browser does not expose a camera, so the flow is never blocked.
  const handleCameraCapture = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setUploadNotice({ type: 'error', text: 'Camera not available here — use Upload Photos instead.' });
      fileInputRef.current?.click();
      return;
    }
    try {
      setUploadNotice(null);
      setCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.playsInline = true;
        await video.play().catch(() => {});
      }
    } catch {
      stopCamera();
      setUploadNotice({ type: 'error', text: 'Camera permission denied or unavailable — use Upload Photos instead.' });
    }
  };

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      stopCamera();
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `canopy-capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
          addFiles([file]);
        }
        stopCamera();
      },
      'image/jpeg',
      0.92
    );
  };

  // Run AI Analysis — progress is driven by the REAL request lifecycle:
  // demo samples animate through the offline simulation, real uploads report
  // actual upload/inference milestones. Backend failures surface an error
  // instead of silently returning simulated results.
  const handleRunAnalysis = async () => {
    if (selectedImages.length === 0) {
      setUploadNotice({ type: 'error', text: 'Please upload at least one flower-bud image.' });
      return;
    }

    const hasRealFiles = selectedImages.some((img) => img.rawFile instanceof File);

    setAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(hasRealFiles ? 8 : 10);
    setAnalysisStepLabel(
      hasRealFiles
        ? 'Preparing flower bud samples for upload…'
        : 'Preprocessing multi-canopy flower bud samples…'
    );

    try {
      const result = await mockImageAnalysisService.analyzeImageBatch(
        selectedImages,
        (progress) => {
          if (typeof progress?.percent === 'number') setAnalysisProgress(progress.percent);
          if (hasRealFiles && progress?.currentImageTitle) {
            setAnalysisStepLabel(progress.currentImageTitle);
          } else if (!hasRealFiles) {
            const pct = progress?.percent || 0;
            setAnalysisStepLabel(
              pct >= 100
                ? 'Finalizing farm recommendations…'
                : pct >= 65
                ? 'Fusing climatic data & 15-day rainfall projection…'
                : pct >= 35
                ? 'Simulating CNN preprocessing & bud classification…'
                : 'Preprocessing multi-canopy flower bud samples…'
            );
          }
        },
        {
          farmId,
          plotId,
          variety: mangoVariety,
          floweringStage,
          canopyDirection,
          season,
          analysisDate,
          plotArea: farmArea
        }
      );

      setAnalysisProgress(100);
      setAnalysisStepLabel('Finalizing farm recommendations…');
      setAnalyzing(false);

      // Cache the analysis result in localStorage so the offline fallback in
      // mockPredictionService can reconstruct real yield/health data if the API
      // is momentarily unavailable on the Yield Prediction page.
      try {
        localStorage.setItem('mangosense_last_analysis', JSON.stringify({
          ...result,
          variety: mangoVariety,
          analysisDate,
          cachedAt: new Date().toISOString()
        }));
      } catch {
        // localStorage may be unavailable in private browsing — non-fatal.
      }

      if (onAnalysisCompleted) {
        onAnalysisCompleted({
          farmId,
          plotId,
          variety: mangoVariety,
          area: farmArea,
          stage: floweringStage,
          canopyDirection,
          season,
          result
        });
      }
    } catch (err) {
      setAnalyzing(false);
      setAnalysisError(
        err?.message || 'Analysis failed. Please check your connection and try again.'
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Header */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Farm Field Assessment Wizard</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Start New Farm Analysis
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Capture multiple flower bud samples across your farm to predict bud health, drop risk & yield.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRunAnalysis}
            disabled={selectedImages.length === 0 || analyzing}
            className="bg-[#155e34] hover:bg-[#124d2b] disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>{analyzing ? 'Analyzing Buds...' : 'Continue to Analysis'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Analysis Error Banner (backend failure surfaced, §22) */}
      {analysisError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Analysis failed. </span>
            <span className="font-medium leading-relaxed">{analysisError}</span>
            <p className="text-[11px] text-rose-700 mt-1">
              No results were saved. Resolve the issue above and press “Continue to Analysis” again.
            </p>
          </div>
        </div>
      )}

      {/* Analyzing Overlay Modal */}
      {analyzing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Spinning AI Panicle Badge */}
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 relative mb-5">
              <Sparkles className="w-10 h-10 animate-spin text-emerald-600" style={{ animationDuration: '4s' }} />
              <span className="absolute -bottom-2 px-2.5 py-0.5 rounded-full bg-[#155e34] text-white text-[10px] font-bold">
                {analysisProgress}%
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900 font-display">
              Analyzing Flower Buds
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-6">
              {analysisStepLabel}
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-[#155e34] h-full transition-all duration-300 rounded-full"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>

            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>
                {selectedImages.some((img) => img.rawFile instanceof File)
                  ? 'Live Model Inference'
                  : 'Prototype Deep Learning Simulator'}
              </span>
              <span>Processing {selectedImages.length} images</span>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Farm & Plot Details Setup */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <span className="w-5 h-5 rounded-full bg-[#155e34] text-white text-[11px] font-bold flex items-center justify-center">1</span>
          <span>Farm & Plot Setup</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Farm Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Farm Name
            </label>
            <select
              value={farmId}
              onChange={(e) => {
                setFarmId(e.target.value);
                const f = farms.find(farm => farm.id === e.target.value);
                if (f && f.plots[0]) {
                  setPlotId(f.plots[0].id);
                  setMangoVariety(f.plots[0].variety);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.location})</option>
              ))}
            </select>
          </div>

          {/* Plot */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Plot Selection
            </label>
            <select
              value={plotId}
              onChange={(e) => {
                setPlotId(e.target.value);
                const p = activeFarm?.plots.find(plot => plot.id === e.target.value);
                if (p) {
                  setFarmArea(p.name.split('—')[1]?.trim() || '2.5 acres');
                  setMangoVariety(p.variety);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              {(activeFarm?.plots || []).map((p) => (
                <option key={p.id} value={p.id}>{p.name} - {p.variety}</option>
              ))}
            </select>
          </div>

          {/* Farm Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Plot Area
            </label>
            <input
              type="text"
              value={farmArea}
              onChange={(e) => setFarmArea(e.target.value)}
              placeholder="e.g. 2.5 acres"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          {/* Mango Variety */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Mango Variety
            </label>
            <select
              value={mangoVariety}
              onChange={(e) => setMangoVariety(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              {varieties.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Flowering Stage */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Flowering Stage
            </label>
            <select
              value={floweringStage}
              onChange={(e) => setFloweringStage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              {floweringStages.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Canopy Direction */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Canopy Direction
            </label>
            <select
              value={canopyDirection}
              onChange={(e) => setCanopyDirection(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            >
              <option value="North">North Canopy</option>
              <option value="South">South Canopy</option>
              <option value="East">East Canopy</option>
              <option value="West">West Canopy</option>
            </select>
          </div>

          {/* Analysis Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Analysis Date
            </label>
            <input
              type="date"
              value={analysisDate}
              onChange={(e) => setAnalysisDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>

          {/* Season */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Season
            </label>
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              placeholder="e.g. 2026 Flowering Season"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/30"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Capture or Upload Flower Bud Samples (Multiple Image Selection) */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#155e34] text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span>Capture Flower Bud Samples</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Multiple representative photos give a reliable farm-level estimate.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200/60">
              {selectedImages.length} samples selected
            </span>
            <button
              onClick={() => setSelectedImages([])}
              className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* 2 Large Action Buttons: Take Photos & Upload Photos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Action 1: Take Photos (real device camera) */}
          <button
            onClick={handleCameraCapture}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-400 transition-all text-center group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform mb-3">
              <Camera className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-emerald-950 font-display">
              {cameraActive ? 'Camera Open — Capture Frame' : 'Take Photos'}
            </h4>
            <p className="text-xs text-emerald-800/80 mt-1 max-w-xs">
              Use mobile camera to snap flower panicles directly in the field.
            </p>
            <span className="mt-3 text-[11px] font-bold text-emerald-700 bg-white/90 px-3 py-1 rounded-full shadow-2xs">
              + Add Sample via Camera
            </span>
          </button>

          {/* Action 2: Upload Photos (File Selector) */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-all text-center group cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPT_ATTR}
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-14 h-14 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-900/10 group-hover:scale-105 transition-transform mb-3">
              <Upload className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-base text-slate-900 font-display">
              Upload Photos
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              Select multiple photos from gallery or memory card (JPEG, PNG).
            </p>
            <span className="mt-3 text-[11px] font-bold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
              Browse Image Files
            </span>
          </div>
        </div>

        {/* Upload validation feedback */}
        {uploadNotice && (
          <div className={`rounded-xl border p-3 flex items-start gap-2.5 text-xs ${
            uploadNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            {uploadNotice.type === 'error'
              ? <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              : <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="font-medium">{uploadNotice.text}</span>
          </div>
        )}

        {/* Farmer Photography Guidance Card */}
        <div className="rounded-xl bg-amber-50/70 border border-amber-200/70 p-3.5 flex items-start gap-3 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Tips for accurate farm prediction:</span>
            <ul className="list-disc list-inside text-amber-800/90 space-y-0.5">
              <li>Capture buds from different parts of the farm (North, South, East, West canopy) for a better farm-level estimate.</li>
              <li>Take clear photos in daylight; avoid severe backlighting or blurry close-ups.</li>
              <li>Include 4 representative panicles (North, South, East, West) for robust statistics.</li>
            </ul>
          </div>
        </div>

        {/* Selected Images Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selected Samples ({selectedImages.length})
            </h4>
            <button
              onClick={handleAddDemoSample}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/50"
            >
              + Quick Add Demo Sample
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {selectedImages.map((img, idx) => (
              <div 
                key={img.id}
                className="relative group rounded-xl overflow-hidden bg-slate-900 aspect-square border border-slate-200 shadow-2xs"
              >
                <img
                  src={img.url}
                  alt={img.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                
                {/* Overlay Badge & Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30 p-1.5 flex flex-col justify-between opacity-90 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white bg-black/50 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage(img.id);
                      }}
                      className="w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors"
                      title="Remove sample"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="text-left">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-block ${
                      img.status === 'pending'
                        ? 'bg-slate-500 text-white'
                        : img.status === 'demo'
                        ? 'bg-indigo-500 text-white'
                        : img.status === 'healthy' 
                        ? 'bg-emerald-600 text-white' 
                        : img.status === 'diseased'
                        ? 'bg-purple-600 text-white'
                        : img.status === 'pest_risk'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                    }`}>
                      {img.classification}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA to Continue to Analysis */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            {selectedImages.length >= 4 ? (
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Great! {selectedImages.length} samples is optimal for yield inference.
              </span>
            ) : (
              <span className="text-amber-700 font-medium">
                Recommendation: Add at least 4 samples for comprehensive estimation.
              </span>
            )}
          </div>

          <button
            onClick={handleRunAnalysis}
            disabled={selectedImages.length === 0 || analyzing}
            className="w-full sm:w-auto bg-[#155e34] hover:bg-[#124d2b] disabled:bg-slate-200 disabled:text-slate-400 text-white px-8 py-3.5 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-950/20 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-emerald-200" />
            <span>Continue to Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live camera capture overlay (only when a real camera stream is open) */}
      {cameraActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl">
            <div className="relative aspect-video bg-black">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
              <div className="absolute inset-0 border-[6px] border-emerald-500/70 pointer-events-none" />
              <div className="absolute top-3 left-3 text-[11px] font-bold text-white bg-black/60 px-2 py-1 rounded">
                {canopyDirection} canopy
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 p-4">
              <button
                onClick={stopCamera}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCaptureFrame}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-900/40 transition-colors"
              >
                <Camera className="w-4 h-4" /> Capture frame
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
