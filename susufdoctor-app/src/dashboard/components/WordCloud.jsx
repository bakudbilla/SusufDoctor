import { useEffect, useState } from "react";
import { API_URL } from "../../utils/constant";

export default function WordCloud({ refreshTrigger }) {
  const [imgUrl, setImgUrl] = useState("");

  useEffect(() => {
    const url = `${API_URL}/analytics/wordcloud?t=${Date.now()}/`;
    setImgUrl(url);
  }, [refreshTrigger]);

  return (
    <div className="mt-10 flex flex-col items-center fade-in w-full">
      <h2 className="text-2xl font-bold mb-4 text-[#0088FF]">Word Cloud Summary</h2>

      {imgUrl ? (
        <img
          src={imgUrl}
          alt="Word Cloud"
          className="wordcloud-img max-w-4xl w-full rounded-xl shadow-lg"
          onError={(e) => {
            e.target.onerror = null;
            // e.target.src = "/fallback.png";
          }}
        />
      ) : (
        <p className="text-gray-500">Loading word cloud...</p>
      )}
    </div>
  );
}
