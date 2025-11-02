import checkmark from "../assets/checkmark.png";
import whatspecial from "../assets/whatspecial.png"


export default function WhatsSpecial() {
  const features = [
    "Reports are generated instantly. The application eliminates manual dictation and typing errors.",
    "Diagnostic clarity is enhanced. The platform includes visual tools like Gradcam for better visualization.",
    "Patient safety is improved. Critical findings are automatically flagged for immediate attention.",
    "Using RLHF, the reports are continuously refined to match the standards and preferences of expert radiologists."
  ];

  return (
    <section className="bg-[#DFFBFA] pt-10 px-6">
      <div className="max-w-7xl mx-auto relative flex justify-center">

        <div className="bg-blue-900 text-white p-10 lg:p-16 w-full max-w-4xl relative flex flex-col lg:flex-row items-center gap-12">

          {/* IMAGE HIDDEN ON SMALL SCREENS */}
          <div className="hidden lg:block lg:absolute lg:-left-44 lg:top-1/2 lg:-translate-y-1/2 w-full lg:w-[480px]">
            <img
              src={whatspecial}
              alt="Doctors discussing"
              className="w-full h-[430px] object-cover shadow-xl"
            />
          </div>

          <div className="flex-1 lg:ml-[310px]">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              What Makes SusufDoctor Special
            </h2>

            <p className="text-blue-100 mb-8 leading-relaxed">
              At SusufDoctor, our priority is to help radiologists generate clinically relevant
              reports at the shortest time possible.
            </p>

            <div className="space-y-5">
              {features.map((point, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <img src={checkmark} alt="check" className="w-7 h-7 sm:w-8 sm:h-8" />
                  <p className="text-blue-100 text-sm leading-relaxed">{point}</p>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
