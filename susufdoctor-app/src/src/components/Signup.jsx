/* eslint-disable no-useless-catch */
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import whatspecial from "../assets/whatspecial.png";
import radio from "../assets/radio.png";
import Loader from "../utils/Loader";
import logo2 from "../assets/logo2.png";

export default function Signup() {
  const [userInput, setUserInput] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    license_number: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000";

  function handleUserInput(e) {
    const { name, value } = e.target;
    setUserInput((prev) => ({ ...prev, [name]: value }));

    if (errors[name] && hasSubmitted) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (errorMsg) setErrorMsg("");
  }

  function validateInput() {
    const newErrors = {};

    if (!isLogin) {
      if (!userInput.first_name.trim()) newErrors.first_name = "First name is required";
      if (!userInput.last_name.trim()) newErrors.last_name = "Last name is required";
      if (!userInput.license_number.trim()) {
        newErrors.license_number = "License number is required";
      } else if (userInput.license_number.trim().length < 5) {
        newErrors.license_number = "Enter a valid license number";
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userInput.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(userInput.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!userInput.password) {
      newErrors.password = "Password is required";
    } else if (userInput.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (userInput.password.length > 72) {
      newErrors.password = "Password must be less than 72 characters";
    } else if (!isLogin) {
      if (!/\d/.test(userInput.password)) {
        newErrors.password = "Password must contain at least one number";
      } else if (!/[a-zA-Z]/.test(userInput.password)) {
        newErrors.password = "Password must contain at least one letter";
      }
    }

    return newErrors;
  }

  const handleRegister = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userInput.email.trim(),
          password: userInput.password,
          full_name: `${userInput.first_name.trim()} ${userInput.last_name.trim()}`,
          license_number: userInput.license_number.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail) {
          if (Array.isArray(data.detail)) {
            const firstError = data.detail[0];
            throw new Error(firstError.msg || "Registration failed");
          } else if (typeof data.detail === "string") {
            throw new Error(data.detail);
          }
        } else if (data.message) {
          throw new Error(data.message);
        } else {
          throw new Error("Registration failed. Please try again.");
        }
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  async function handleLogin() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: userInput.email.trim(),
          password: userInput.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail) {
          if (typeof data.detail === "string") {
            throw new Error(data.detail);
          } else if (Array.isArray(data.detail)) {
            throw new Error(data.detail[0]?.msg || "Login failed");
          }
        } else if (data.message) {
          throw new Error(data.message);
        } else {
          throw new Error("Invalid email or password");
        }
      }

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("token_type", data.token_type || "bearer");
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setHasSubmitted(true);
    setErrorMsg("");

    const foundErrors = validateInput();
    setErrors(foundErrors);

    if (Object.keys(foundErrors).length === 0) {
      setLoading(true);

      const authFunction = isLogin ? handleLogin() : handleRegister();

      authFunction
        .then(() => {
          setSuccess(true);
          setLoading(false);

          if (isLogin) {
            setTimeout(() => {
              window.location.href = "/dashboard";
            }, 1500);
          } else {
            setTimeout(() => {
              setSuccess(false);
              setIsLogin(true);
              setUserInput({
                first_name: "",
                last_name: "",
                email: userInput.email,
                password: "",
                license_number: "",
              });
              setHasSubmitted(false);
              setErrors({});
            }, 2000);
          }
        })
        .catch((error) => {
          setErrorMsg(error.message || "An error occurred. Please try again.");
          setLoading(false);
        });
    }
  }

  return (
    <>
      {loading && <Loader text={isLogin ? "Logging in..." : "Creating account..."} />}

      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-cyan-50 via-teal-50 to-cyan-100 px-4 py-8">
        <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
          <div className="p-8 md:p-12 flex flex-col relative">
            <div className="absolute top-2 left-2">
              <img src={logo2} alt="Logo" className="h-14 w-auto" />
            </div>
            <div className="mb-8 mt-8">
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-4xl font-bold text-blue-500">SusufDoctor</h1>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-medium ${
                      !isLogin ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Sign Up
                  </span>
                  <button
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                      setHasSubmitted(false);
                      setErrorMsg("");
                    }}
                    className={`relative w-14 h-7 rounded-full cursor-pointer transition-colors ${
                      isLogin ? "bg-blue-500" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                        isLogin ? "translate-x-7" : "translate-x-0"
                      }`}
                    ></div>
                  </button>
                  <span
                    className={`text-sm font-medium ${
                      isLogin ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    Login
                  </span>
                </div>
              </div>

              <p className="text-gray-600 text-sm">
                {isLogin
                  ? "Welcome back, Radiologist"
                  : "Create your radiologist account"}
              </p>
            </div>

            {/* Form Fields */}
            <div className={`flex-1 flex flex-col ${isLogin ? "space-y-5" : "space-y-4"}`}>
              {!isLogin && (
                <>
                  <div>
                    <input
                      name="first_name"
                      type="text"
                      placeholder="First Name"
                      value={userInput.first_name}
                      onChange={handleUserInput}
                      className={`w-full px-4 py-3 bg-gray-50 border ${
                        errors.first_name ? "border-red-500" : "border-gray-200"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                    />
                    {errors.first_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
                    )}
                  </div>

                  <div>
                    <input
                      name="last_name"
                      type="text"
                      placeholder="Last Name"
                      value={userInput.last_name}
                      onChange={handleUserInput}
                      className={`w-full px-4 py-3 bg-gray-50 border ${
                        errors.last_name ? "border-red-500" : "border-gray-200"
                      } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                    />
                    {errors.last_name && (
                      <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  value={userInput.email}
                  onChange={handleUserInput}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={userInput.password}
                  onChange={handleUserInput}
                  className={`w-full px-4 py-3 bg-gray-50 border ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
              </div>

              {!isLogin && (
                <div>
                  <input
                    name="license_number"
                    type="text"
                    placeholder="Medical License Number"
                    value={userInput.license_number}
                    onChange={handleUserInput}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.license_number ? "border-red-500" : "border-gray-200"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition`}
                  />
                  {errors.license_number && (
                    <p className="text-xs text-red-500 mt-1">{errors.license_number}</p>
                  )}
                </div>
              )}

              {errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                {isLogin ? "Login" : "Create Account"}
              </button>

              <p className="text-center text-sm text-gray-600 mt-2">
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setHasSubmitted(false);
                    setErrorMsg("");
                  }}
                  className="text-blue-500 hover:underline font-semibold"
                >
                  {isLogin ? "Sign Up" : "Login"}
                </button>
              </p>
            </div>
          </div>

          {/* Right Section (Image) */}
          <div className="hidden md:flex items-center justify-center bg-linear-to-br from-blue-500 to-blue-600 p-12">
            <div className="w-full max-w-md">
              <img
                src={isLogin ? whatspecial : radio}
                alt="Medical professionals"
                className={`w-full h-auto drop-shadow-2xl ${!isLogin && "animate-float"}`}
              />
              <div className="mt-8 text-center text-white">
                <h2 className="text-2xl font-bold mb-2">AI-Powered Radiology Reports</h2>
                <p className="text-blue-100">Generate accurate medical reports in seconds</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
