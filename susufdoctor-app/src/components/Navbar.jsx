/* eslint-disable no-unused-vars */
import { NavLink } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "../assets/new_logo.png";
import { useNavigate } from "react-router-dom";
import { NavAnimation } from "../utils/animations";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const navlinks = [
  { name: "Home", id: "home" },
  { name: "Services", id: "services" },
  { name: "About", id: "about" },
  { name: "Testimonials", id: "testimonials" },
];

export default function Navbar() {
  const [activeSection, setActiveSection] = useState("home");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    section?.scrollIntoView({ behavior: "smooth" });
    setIsMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      navlinks.forEach((link) => {
        const section = document.getElementById(link.id);
        if (section) {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(link.id);
          }
        }
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-[#0088FF] text-white px-4 md:px-6 flex justify-between items-center z-50 shadow-md">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <img src={logo} alt="logo" className="h-20 w-auto object-contain" />
      </motion.div>

      <ul className="hidden md:flex gap-8 items-center ml-6">
        {navlinks.map((link, index) => (
          <motion.li
            key={link.id}
            variants={NavAnimation(0.18 * index)}
            initial="initial"
            animate="animate"
          >
            <NavLink
              to="/"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.id);
              }}
              className={`text-base transition outline-0 ${
                activeSection === link.id
                  ? "font-bold border-b-2 border-white"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              {link.name}
            </NavLink>
          </motion.li>
        ))}
      </ul>

      <motion.button
        className="hidden md:block bg-white text-blue-600 px-4 py-2 rounded-lg cursor-pointer font-semibold text-sm transition-all duration-300 shadow-md hover:shadow-blue-400 hover:shadow-lg hover:scale-105 hover:bg-blue-50"
        variants={NavAnimation(1)}
        initial="initial"
        animate="animate"
        onClick={() => navigate("/signup")}
      >
        Sign in
      </motion.button>

      <motion.button
        className="md:hidden flex items-center"
        onClick={() => setIsMenuOpen((s) => !s)}
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        initial={false}
        animate={{ rotate: isMenuOpen ? 90 : 0, scale: isMenuOpen ? 1.05 : 1 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        <AnimatePresence mode="popLayout">
          {isMenuOpen ? (
            <motion.span
              key="close"
              initial={{ opacity: 0, rotate: -90, y: -6 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, rotate: 90, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <X size={26} className="cursor-pointer"/>
            </motion.span>
          ) : (
            <motion.span
              key="menu"
              initial={{ opacity: 0, rotate: 90, y: 6 }}
              animate={{ opacity: 1, rotate: 0, y: 0 }}
              exit={{ opacity: 0, rotate: -90, y: 6 }}
              transition={{ duration: 0.22 }}
            >
              <Menu size={26} className="cursor-pointer"/>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.18 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
            />

            <motion.div
              key="glass-menu"
              initial={{ opacity: 0, scale: 0.96, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -6 }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="fixed top-16 left-1/2 -translate-x-1/2 z-50 md:hidden w-11/12 sm:w-3/4 rounded-2xl p-5
                         bg-black/30 backdrop-blur-md border border-white/10 shadow-xl ring-1 ring-white/5"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mb-4" />

              <ul className="flex flex-col gap-4">
                {navlinks.map((link) => (
                  <motion.li
                    key={link.id}
                    whileHover={{ x: 6 }}
                    transition={{ duration: 0.18 }}
                  >
                    <NavLink
                      to="/"
                      onClick={(e) => {
                        e.preventDefault();
                        scrollToSection(link.id);
                      }}
                      className={`block text-base py-2 px-3 rounded-lg transition-colors outline-0 ${
                        activeSection === link.id
                          ? "font-semibold text-white bg-white/8 border-l-4 border-white/20"
                          : "text-white/90 hover:bg-white/6"
                      }`}
                    >
                      {link.name}
                    </NavLink>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-5">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    navigate("/signup");
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-[#0088FF] text-white cursor-pointer py-3 rounded-xl font-semibold shadow-sm hover:brightness-95 transition"
                >
                  Sign in
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}
