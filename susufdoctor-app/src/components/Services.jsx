import { motion } from "framer-motion";
import { SlideLeft } from "../utils/animations";
import { services } from '../utils/constant';

export default function Services() {
 
  return (
    <section id="services" className="bg-linear-to-b from-white to-blue-50 py-24 px-6">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-4xl font-bold text-blue-900 mb-4">Our Services</h2>
        <p className="text-gray-600 max-w-2xl mx-auto mb-16">
          We provide an end-to-end AI platform that structures data, accelerates report turnaround,
          and enhances clinical analysis for every study.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, i) => (
            <motion.div
              variants={SlideLeft(0.4)}
              initial="hidden"
              whileInView="visible"
              whileHover={{ scale: 1.05 }}
              key={i}
              className="bg-white cursor-pointer rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border border-blue-100 flex flex-col overflow-hidden"
            >
              <div className="p-6 flex-1">
                <div className="flex justify-center mb-6">
                  <img
                    src={service.img}
                    alt={service.title}
                    className="w-20 h-20 object-contain"
                  />
                </div>
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  {service.title}
                </h3>
              </div>

              <p className="text-[#454D5D] bg-[#7DEFEB] p-4 text-sm w-full">
                {service.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
