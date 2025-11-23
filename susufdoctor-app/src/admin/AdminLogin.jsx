import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '../dashboard/components/ui/button';
import logo from '../assets/logo2.png';
import { API_URL } from '../utils/constant';

export default function AdminLogin() {
    const navigate = useNavigate();

    const [credentials, setCredentials] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials(prev => ({ ...prev, [name]: value }));

        setFieldErrors(prev => ({
            ...prev,
            [name]: ''
        }));
        setError('');
    };

    const validateFields = () => {
        let errors = {};

        if (!credentials.email.trim()) {
            errors.email = "Email is required";
        } else if (!credentials.email.includes("@")) {
            errors.email = "Invalid email format";
        }

        if (!credentials.password.trim()) {
            errors.password = "Password is required";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateFields()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || data.message || 'Login failed');
                return;
            }

            if (!data.user.is_admin && !data.user.is_superuser) {
                setError('Access denied: Admin privileges required');
                return;
            }

            localStorage.setItem('admin_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));

            navigate('/admin/dashboard');

        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#DFFBFA] p-4">
            <div className="w-full max-w-md bg-card rounded-2xl shadow-lg p-8">

                {/* Logo */}
                <div className="flex flex-col items-center mb-6">
                    <img src={logo} alt="Logo" className="h-12 mb-2" />
                    <h1 className="text-2xl font-bold text-blue-500">Admin Login</h1>
                    <p className="text-sm text-muted-foreground mt-1">Access the admin panel</p>
                </div>

                {error && (
                    <div className="flex items-start gap-2 p-3 mb-4 rounded-md bg-destructive/20 border border-destructive">
                        <AlertCircle className="text-destructive mt-0.5" size={18} />
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-4">

                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Email Address
                        </label>

                        <input
                            type="email"
                            name="email"
                            value={credentials.email}
                            onChange={handleChange}
                            placeholder="admin@example.com"
                            className="w-full pl-4 pr-3 py-2.5 border border-gray-300 rounded-lg bg-input text-foreground 
                                       focus:ring-2 focus:ring-primary focus:outline-none"
                        />

                        {fieldErrors.email && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
                        )}
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Password
                        </label>

                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-lg bg-input text-foreground 
                                           focus:ring-2 focus:ring-primary focus:outline-none"
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3.5 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {fieldErrors.password && (
                            <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login to Admin Panel'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    Don’t have an account?{' '}
                    <button
                        onClick={() => navigate('/admin/signup')}
                        className="text-blue-500 cursor-pointer hover:text-purple-700 font-semibold"
                    >
                        Create one here
                    </button>
                </div>
            </div>
        </div>
    );
}
