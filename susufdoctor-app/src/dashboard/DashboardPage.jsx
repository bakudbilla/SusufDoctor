import { useState, useEffect, useRef } from "react";
import {  ArrowUp  } from "lucide-react";
import { Navigation } from "./components/layout/navigation";
import { Dashboard } from "./pages/dashboard";
import { UploadPage } from "./pages/upload-page";
import { PatientsPage } from "./pages/patients-page";
import Settings from "./pages/settings";

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem("currentPage") || "dashboard";
  });
  const [showScrollTop, setShowScrollTop] = useState(false);
  const mainRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("currentPage", currentPage);
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (mainRef.current && mainRef.current.scrollTop > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    const mainElement = mainRef.current;
    mainElement?.addEventListener("scroll", handleScroll);
    return () => mainElement?.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={setCurrentPage} />;
      case "upload":
        return <UploadPage />;
      case "patients":
        return <PatientsPage />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#DFFBFA]">
      <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
      <main ref={mainRef} className="flex-1 overflow-y-auto relative">
        <div className="container mx-auto p-6">{renderPage()}</div>

       {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="scroll-top-btn cursor-pointer fixed bottom-8 right-8 w-12 h-12 flex items-center justify-center bg-[#00B7EB] text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 z-50"
          aria-label="Scroll to top"
        >
          <span className="icon-bounce">
            < ArrowUp  size={24} />
          </span>
        </button>
      )}

      </main>
    </div>
  );
}
