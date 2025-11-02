const statsData = [
  {
    img: "/src/assets/modelaccuracy.jpeg",
    alt: "AI Model Accuracy",
    title: "95%",
    description: "AI Model Accuracy",
  },
  {
    img: "/src/assets/analytics.jpeg",
    alt: "Real Time Analytics",
    title: "Real time Patient Analytics",
    description: "",
  },
  {
    img: "/src/assets/predictions.jpeg", 
    alt: "AI Predictions",
    title: "99%",
    description: "Prediction Accuracy",
  },
];

export default function Stats() {
  return (
    <section className="px-6 py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {statsData.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-8 shadow-md hover:shadow-lg transform hover:scale-105 transition duration-300 flex flex-col items-center justify-center text-center"
            >
              <img
                src={stat.img}
                alt={stat.alt}
                className="w-32 h-32 sm:w-36 sm:h-36 lg:w-40 lg:h-40 object-contain mb-4"
              />
              <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">{stat.title}</div>
              {stat.description && (
                <p className="text-blue-700">{stat.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
