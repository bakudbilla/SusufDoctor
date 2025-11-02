import { useEffect, useRef } from "react";
import doctor1 from "../assets/doctor1.jpeg";
import CTA from "./CTA";
import quotes from "../assets/quotes.png";
import Stats from "./Stats";

export default function Testimonials() {
  const carouselRef = useRef(null);

  const testimonials = [
    {
      name: "Amber Morales",
      image: doctor1,
      rating: 5,
      text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore fugiat sunt culpa officia deserunt mollit anim est laborum.",
    },
    {
      name: "John Smith",
      image: doctor1,
      rating: 5,
      text: "The platform has transformed how we generate reports in our clinic. Highly recommended for any medical facility seeking efficiency and accuracy.",
    },
    {
      name: "Sarah Johnson",
      image: doctor1,
      rating: 5,
      text: "Exceptional tool for radiologists. The AI-powered features save us countless hours while maintaining the highest standards of accuracy and patient care.",
    },
  ];

  useEffect(() => {
    const scrollContainer = carouselRef.current;
    if (scrollContainer) {
      let scrollAmount = 0;
      const speed = 1;
      const scrollStep = () => {
        if (scrollAmount >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
          scrollAmount = 0;
        } else {
          scrollContainer.scrollLeft += speed;
          scrollAmount += speed;
        }
      };
      const interval = setInterval(scrollStep, 30);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <section className="px-6 py-20 bg-[#DFFBFA]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-3">Testimonials</h2>
        <p className="text-center text-gray-600 mb-12">
          This is what our customers said about the platform
        </p>

        <div
          ref={carouselRef}
          className="flex overflow-x-auto no-scrollbar space-x-8 pb-6 pt-10"
        >
          {testimonials.concat(testimonials).map((testimonial, index) => (
            <div
              key={index}
              className="relative min-w-[300px] sm:min-w-[350px] md:min-w-[370px] 
              bg-[#d1e4f5] rounded-2xl p-6 border border-[#F0F3F8]
              shadow-[0_4px_20px_rgba(110,120,145,0.2)] hover:shadow-[0_8px_30px_rgba(110,120,145,0.3)]
              transition-all duration-300 mt-6"
            >
              <div className="absolute -top-4 right-4 bg-blue-600 w-8 h-8 rounded-full flex items-center justify-center">
                <img src={quotes} alt="" className="w-4 h-4" />
              </div>

              <div className="absolute -top-7 left-6 w-14 h-14 rounded-full overflow-hidden border-4 border-white shadow-md bg-white">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="mt-8 flex items-center justify-between pr-3">
                <h4 className="font-semibold text-blue-900 text-sm">{testimonial.name}</h4>
                <div className="flex gap-0.5">
                  {Array(testimonial.rating)
                    .fill(0)
                    .map((_, i) => (
                      <svg
                        key={i}
                        className="w-3.5 h-3.5 fill-orange-400"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                </div>
              </div>

              <div className="mt-3">
                <p className="text-blue-900 font-semibold text-base leading-snug mb-1">
                  “{testimonial.text.split(".")[0]}.”
                </p>
                <p className="text-[#454D5D] text-sm leading-snug line-clamp-4">
                  {testimonial.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

        <CTA />
        {/* <Stats /> */}
    </section>
  );
}
