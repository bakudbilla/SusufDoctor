"use client";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import bgImage from "../assets/radiology.jpeg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "" });

  const validate = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "Email is required.";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    const isValid = validate();

    if (!isValid) {
      toast.error("Please fill all required fields correctly.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Login successful!");
      setErrors({ email: "", password: "" });
    }, 1500);
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 font-sans"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg whitespace-nowrap">
            Welcome to SusufDoctor
          </h1>
          <p className="text-gray-200 mt-2">Login to your account</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl shadow-xl p-8">
          <div className="mb-5">
            <label className="block text-sm font-medium text-white mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="awinpang@example.com"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white/60 placeholder-gray-500 text-gray-900 ${
                errors.email ? "border-red-500" : "border-transparent"
              }`}
            />
            {errors.email && (
              <p className="text-red-300 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white/60 placeholder-gray-500 text-gray-900 ${
                  errors.password ? "border-red-500" : "border-transparent"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-700 hover:text-gray-900"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 cursor-pointer" />
                ) : (
                  <Eye className="w-5 h-5 cursor-pointer" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-300 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full bg-[#0088FF]/90 hover:bg-[#0088FF] disabled:bg-blue-400 text-white font-medium py-2.5 rounded-lg transition duration-200 shadow-md"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 border-t border-white/30"></div>
            <span className="text-white/70 text-sm">or</span>
            <div className="flex-1 border-t border-white/30"></div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 border border-white/40 hover:border-white/70 text-white font-medium py-2.5 rounded-lg transition duration-200 backdrop-blur-sm bg-white/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-white mt-6 text-sm">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-[#00B7EB] hover:text-[#00D9FF] font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
