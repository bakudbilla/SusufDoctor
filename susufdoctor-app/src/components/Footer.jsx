import { useState } from "react";
import { Facebook, Twitter, Linkedin } from "lucide-react";
import pattern from "../assets/footer.png";
import { Link } from "react-router-dom";
import logo from "../assets/new_logo.png";
import PrivacyPolicies from "../utils/PrivacyPolicies";

export default function Footer() {
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  return (
    <>
      <PrivacyPolicies
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAccept={() => setShowPrivacyModal(false)}
        onDecline={() => setShowPrivacyModal(false)}
        showAcceptBtn={false}
        showDeclineBtn={false}
      />

      <footer
        className="bg-blue-900 text-white px-6 pt-6 pb-3 relative"
        style={{
          backgroundImage: `url(${pattern})`,
          backgroundSize: "contain",
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
        }}
      >
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div className="flex flex-col items-start -mt-2">
              <img
                src={logo}
                alt="logo"
                className="w-32 mb-3 object-contain"
              />
              <p className="text-blue-100 text-sm leading-relaxed mb-5">
                Generate Structured Radiology Reports — Instantly. Deliver structured, accurate reports instantly, allowing you to focus immediately on diagnosis and patient outcomes.
              </p>

              <div className="flex gap-4">
                {[Facebook, Linkedin, Twitter].map((Icon, idx) => (
                  <Link
                    key={idx}
                    to="/"
                    className="w-10 h-10 rounded-full border border-white/40 flex items-center justify-center
                    text-white transition transform hover:scale-110 hover:rotate-6
                    hover:shadow-blue-400/80 shadow-md duration-300"
                  >
                    <Icon size={18} />
                  </Link>
                ))}
              </div>
            </div>

            <div className="sm:col-span-2 flex justify-start gap-12">
              <div>
                <h3 className="font-bold text-lg mb-4">Services</h3>
                <ul className="space-y-2">
                  {["Report Generation", "Word Cloud", "Patient Analysis"].map((item) => (
                    <li key={item}>
                      <Link
                        to="/"
                        className="text-blue-200 cursor-pointer hover:text-white text-sm transition"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-4">Legal</h3>
                <ul className="space-y-2">
                  {[
                    { label: "Privacy Policy", action: () => setShowPrivacyModal(true) },
                    { label: "Terms of Service", action: null },
                    { label: "Cookie Policy", action: null },
                    { label: "Disclaimer", action: null },
                  ].map((item) => (
                    <li key={item.label}>
                      {item.action ? (
                        <button
                          onClick={item.action}
                          className="text-blue-200 hover:text-white text-sm transition text-left"
                        >
                          {item.label}
                        </button>
                      ) : (
                        <a
                          href="#"
                          className="text-blue-200 hover:text-white text-sm transition"
                        >
                          {item.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="border-t border-blue-800 mt-4 mb-3"></div>

          {/* Bottom Footer */}
          <div className="text-center">
            <p className="text-blue-200 text-sm">
              © 2025 SusufDoctor — All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}