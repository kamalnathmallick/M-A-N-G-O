import React from 'react';
import { 
  HelpCircle, 
  Camera, 
  CloudSun, 
  Sprout, 
  PhoneCall, 
  MessageSquare, 
  FileQuestion,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function HelpSupportView() {
  const faqs = [
    {
      q: 'How many flower-bud sample photos should I take per farm?',
      a: 'We recommend taking 4 representative panicle photos across all 4 quadrants of your orchard (North, South, East, West canopy) to ensure an accurate farm-level health score.'
    },
    {
      q: 'When is the best time of day to capture photos?',
      a: 'Bright indirect morning light (07:30 AM to 10:30 AM) is optimal. Avoid severe afternoon sun backlighting and blurry nighttime shots.'
    },
    {
      q: 'How is the early yield prediction computed?',
      a: 'MangoSense combines bud density and health percentage with 15-day temperature stability, relative humidity and flower-drop stress index to calculate expected tonnes per acre.'
    },
    {
      q: 'What should I do if a sudden rain shower is predicted?',
      a: 'Check the Recommendations tab for pre-rain prophylactic sprays (such as wettable sulphur) to protect panicles from powdery mildew and anthracnose.'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase tracking-wider mb-1">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Farmer Assistance</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 font-display">
            Help & Agronomic Support
          </h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Field photography guidelines, frequently asked questions & mango expert helpline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="tel:18001234567"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#155e34] hover:bg-[#124d2b] text-white flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Toll-Free Helpline</span>
          </a>
        </div>
      </div>

      {/* Field Photography Best Practices */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 font-display flex items-center gap-2 pb-2 border-b border-slate-100">
          <Camera className="w-4 h-4 text-emerald-700" />
          <span>How to Snap Perfect Flower Bud Samples</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>1. Clear Close-up Focus</span>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Position camera 25–40 cm away from the terminal panicle. Ensure individual florets are crisp and focused.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>2. Multi-Canopy Sampling</span>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Do not take all photos from one tree. Sample at least 4 different trees across perimeter and center.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
            <div className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>3. Check for Pests & Honeydew</span>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Include shaded lower panicles where mango hopper nymphs and powdery mildew typically begin.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="bg-white rounded-2xl p-5 md:p-6 border border-slate-100/90 shadow-xs space-y-4">
        <h3 className="font-bold text-base text-slate-900 font-display flex items-center gap-2 pb-2 border-b border-slate-100">
          <FileQuestion className="w-4 h-4 text-emerald-700" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1">
              <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                {faq.q}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
