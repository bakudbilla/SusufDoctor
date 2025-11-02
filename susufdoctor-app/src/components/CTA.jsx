import pattern from '../assets/CTA_pattern.png';
import { CheckCircle2 } from "lucide-react";

export default function CTA() {
  return (
    <section
      className="px-6 py-12 relative overflow-hidden text-white"
      style={{
        backgroundColor: '#0A2E72',
        backgroundImage: `url(${pattern})`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundBlendMode: 'lighten',
      }}
    >
      <div className="absolute inset-0 bg-blue-900/40 z-0"></div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10 md:px-8">
        
        <div className="text-center md:text-left">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
            You are just an upload <br /> away to generating a clinically relevant report.
          </h2>
        </div>

        <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 shadow-lg border border-white/20">
          <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-white/20"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-orange-400"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="94, 100"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="text-2xl font-bold text-orange-400">94%</span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <CheckCircle2 className="text-green-400 w-5 h-5" />
            <p className="text-sm font-medium text-white/90">Model Accuracy</p>
          </div>
        </div>

        <button className="bg-orange-400 text-blue-900 px-3 sm:px-6 py-4 cursor-pointer rounded-lg font-bold hover:bg-orange-300 transition flex items-center gap-3 whitespace-nowrap">
          <span>Click to upload an X-ray</span>
          <span className="text-2xl leading-none">→</span>
        </button>
      </div>
    </section>
  );
}
