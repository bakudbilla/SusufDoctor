import { useState } from 'react';
import { X, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_URL } from '../../utils/constant'

export default function AddRadiologistModal({ isOpen, onClose, onSubmit, loading: parentLoading }) {
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        license_number: '',
        password: '',
        confirmPassword: ''
    });
    const [formError, setFormError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setFormError('');
    };

    const validatePassword = (password) => {
        if (/^\d+$/.test(password)) {
            return 'Password cannot contain only numbers';
        }
        
        if (password.length < 6) {
            return 'Password must be at least 6 characters';
        }
        
        if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
            return 'Password must contain both letters and numbers';
        }
        
        return null;
    };

    const extractErrorMessage = (error) => {
        if (typeof error === 'string') {
            return error;
        }

        if (error && typeof error === 'object') {
            if (error.detail) {
                return typeof error.detail === 'string' 
                    ? error.detail 
                    : JSON.stringify(error.detail);
            }
            
            if (error.message) {
                return error.message;
            }
            
            return JSON.stringify(error);
        }

        return 'An unexpected error occurred';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.full_name || !formData.license_number || !formData.password) {
            setFormError('All fields are required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setFormError('Please enter a valid email address');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setFormError('Passwords do not match');
            return;
        }

        const passwordError = validatePassword(formData.password);
        if (passwordError) {
            setFormError(passwordError);
            return;
        }

        setLoading(true);
        
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email.toLowerCase().trim(),
                    full_name: formData.full_name.trim(),
                    license_number: formData.license_number.trim(),
                    password: formData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = extractErrorMessage(data.detail || data.message || data);
                setFormError(errorMsg);
                setLoading(false);
                return;
            }

            setFormData({
                email: '',
                full_name: '',
                license_number: '',
                password: '',
                confirmPassword: ''
            });
            setFormError('');
            setShowPassword(false);
            setShowConfirmPassword(false);
            
            if (onSubmit) {
                onSubmit(data.data || data);
            }

            
            handleClose();

        } catch (error) {
            console.error('Request error:', error);
            setFormError(error.message || 'Failed to connect to server');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            email: '',
            full_name: '',
            license_number: '',
            password: '',
            confirmPassword: ''
        });
        setFormError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-blue-500">Add New Radiologist</h2>
                    <button 
                        onClick={handleClose} 
                        className="text-gray-500 cursor-pointer hover:text-gray-700 shrink-0 transition"
                        disabled={loading}
                    >
                        <X size={24} />
                    </button>
                </div>

                {formError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                        <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                        <p className="text-red-700 text-sm">{String(formError)}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                disabled={loading || parentLoading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                placeholder="Enter full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading || parentLoading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                placeholder="example@hospital.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                License Number
                            </label>
                            <input
                                type="text"
                                name="license_number"
                                value={formData.license_number}
                                onChange={handleChange}
                                disabled={loading || parentLoading}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                placeholder="RAD-123456"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading || parentLoading}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading || parentLoading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    disabled={loading || parentLoading}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
                                    placeholder="Confirm password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    disabled={loading || parentLoading}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition disabled:opacity-50"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading || parentLoading}
                            className="flex-1 px-4 py-2 cursor-pointer bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || parentLoading}
                            className="flex-1 px-4 py-2 bg-blue-500 cursor-pointer text-white rounded-lg hover:bg-blue-600 transition font-medium disabled:bg-blue-400 disabled:cursor-not-allowed text-sm"
                        >
                            {loading || parentLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 cursor-pointer border-white border-t-transparent rounded-full animate-spin"></div>
                                    Creating...
                                </span>
                            ) : (
                                'Create Radiologist'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}