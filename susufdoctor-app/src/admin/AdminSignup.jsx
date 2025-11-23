import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { API_URL } from '../utils/constant';
import { Button } from '../dashboard/components/ui/button';
import { toast } from 'sonner';

export default function AdminSignup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        password: '',
        confirmPassword: ''
    });

    const [fieldErrors, setFieldErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        setFieldErrors(prev => ({
            ...prev,
            [name]: ''
        }));
    };

    const validateForm = () => {
        let errors = {};

        if (!formData.full_name.trim()) {
            errors.full_name = "Full name is required";
        }

        if (!formData.email.trim()) {
            errors.email = "Email is required";
        } else if (!formData.email.includes("@")) {
            errors.email = "Email is invalid";
        }

        if (!formData.password) {
            errors.password = "Password is required";
        } else if (formData.password.length < 6) {
            errors.password = "Password must be at least 6 characters";
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = "Confirm password is required";
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
        }

        setFieldErrors(errors);

        return Object.keys(errors).length === 0; 
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/create-admin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    full_name: formData.full_name,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.detail || data.message || "Failed to create superuser");
                return;
            }

            toast.success("Superuser account created successfully!");

            setTimeout(() => navigate("/admin/login"), 1200);

        } catch (error) {
            toast.error("Network error: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#DFFBFA] flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                <div className="bg-white rounded-2xl shadow-xl p-8 md:p-9">

                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-blue-500">Create Admin Account</h1>
                        <p className="text-gray-600 text-sm mt-1">Setup your superuser account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter your full name"
                            />
                            {fieldErrors.full_name && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.full_name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                placeholder="admin@example.com"
                            />
                            {fieldErrors.email && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="At least 6 characters"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3.5 text-gray-400"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {fieldErrors.password && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="w-full pl-4 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3.5 text-gray-400"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmPassword}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 text-white cursor-pointer rounded-lg disabled:opacity-50 mt-2"
                        >
                            {loading ? "Creating Account..." : "Create Superuser Account"}
                        </Button>

                    </form>

                    <div className="mt-4 text-center">
                        <p className="text-gray-600 text-sm">
                            Already have an account?{" "}
                            <button
                                onClick={() => navigate('/admin/login')}
                                className="text-blue-500 cursor-pointer hover:text-purple-700 font-semibold"
                            >
                                Login here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
