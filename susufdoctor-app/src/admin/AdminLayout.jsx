import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, LogOut, Menu, X } from 'lucide-react';
import { Button } from '../dashboard/components/ui/button';
import logo from '../assets/logo2.png';

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState({ full_name: "Admin", email: "" });
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { id: 'users', label: 'Radiologist Management', icon: Users, path: '/admin/users' },
    { id: 'reports', label: 'Recent Reports', icon: FileText, path: '/admin/reports' },
  ];

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(storedUser);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`flex flex-col border-r transition-all duration-300 shadow-lg bg-white ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex items-center justify-between h-16 px-4 border-b">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <img src={logo} alt="logo" className="h-10" />
              <span className="text-xl font-bold text-[#0088FF]">SuSufDoctor</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 cursor-pointer rounded transition"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path; 
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start cursor-pointer transition-colors ${
                  isActive ? 'bg-[#0088FF] text-white hover:bg-[#0088FF]' : 'hover:bg-gray-100 text-gray-700'
                }`}
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-2 h-4 w-4 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Button>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0088FF] text-white font-bold shrink-0">
              {currentUser.full_name?.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{currentUser.full_name}</p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            )}
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="shrink-0 hover:bg-red-50 text-red-600"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-[#DFFBFA] flex flex-col overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-blue-500">
            {navItems.find(item => location.pathname === item.path)?.label || 'Dashboard'} 
          </h2>
        </div>

        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
