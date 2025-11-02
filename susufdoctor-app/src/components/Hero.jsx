import { motion } from 'framer-motion';
import pattern from '../assets/Shape.png';
import CompareSection from './CompareSection';
import  Homeimage from '../assets/xray4.png'


export default function Hero() {
  return (
    <section
      id="home"
      className="relative bg-[#DFFBFA] px-4 sm:px-6 pt-44 pb-20 overflow-hidden"
    >
      <img
        src={pattern}
        alt="Pattern"
        className="absolute top-0 left-0 h-auto opacity-40"
        style={{
          width: '600px',
          maxWidth: '100vw',
          objectFit: 'contain',
          zIndex: 0,
        }}
      />

      <div className="relative max-w-7xl mx-auto flex flex-col-reverse md:flex-row items-center justify-between gap-10 md:gap-14 z-10">
        <div className="flex-1 text-center md:text-left md:pl-16">
          <p className="text-blue-500 font-semibold mb-2 sm:mb-4 text-xs sm:text-sm uppercase tracking-wide">
            Radiology Report Generation
          </p>

          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-blue-900 mb-4 leading-snug sm:leading-tight md:leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
          >
            Generate Structured <br /> Radiology Reports <br /> Instantly
          </motion.h1>

          <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">
            Deliver structured, accurate reports instantly, allowing you to focus immediately on diagnosis and patient outcomes.
          </p>

          <button className="bg-blue-500 cursor-pointer text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2 mx-auto md:mx-0">
            Watch Demo →
          </button>
        </div>

        <div className="flex-1 flex justify-center mb-6 md:mb-0 relative">
          <motion.img
            src={Homeimage}
            alt="Doctor with X-ray"
            className="w-full max-w-lg sm:max-w-xl md:max-w-2xl h-auto object-cover rounded-2xl"
            initial={{ y: 0 }}
            animate={{ y: [0, -20, 0] }}
            transition={{
              duration: 4,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        </div>
      </div>

      <CompareSection />
    </section>
  );
}
