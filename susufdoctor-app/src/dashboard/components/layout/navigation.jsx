import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import logo from '../../../assets/logo2.png'
import { Upload, Users, Home, Settings, User, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { API_URL } from "../../../utils/constant";

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'upload', label: 'Upload Images', icon: Upload },
  { id: 'patients', label: 'Patient Management', icon: Users },
];

export function Navigation({ currentPage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [radiologistName, setRadiologistName] = useState("Dr. Unknown");
  const [profilePicture, setProfilePicture] = useState(null);

  useEffect(() => {
    fetchRadiologistName();
  }, []);

  const fetchRadiologistName = async () => {
    try {
      const token = localStorage.getItem("access_token");
      const storedName = localStorage.getItem("radiologist_name");

      // Try to get from API first
      try {
        const response = await fetch(`${API_URL}auth/profile`, {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          const user = data.user;
          const fullName = user.full_name || storedName || "Dr. Unknown";
          setRadiologistName(fullName);
          localStorage.setItem("radiologist_name", fullName);
          
          // Set profile picture if available
          if (user.profile_picture_url) {
            setProfilePicture(user.profile_picture_url);
          }
          return;
        }
      } catch (e) {
        console.log("Auth/profile endpoint not available, using localStorage");
      }

      // Fallback to localStorage
      if (storedName) {
        setRadiologistName(storedName);
      }
    } catch (error) {
      console.error("Error fetching radiologist name:", error);
    }
  };

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white shadow-md border border-gray-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#0088FF] transition-all duration-200"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-[#0088FF]" />
        ) : (
          <Menu className="h-6 w-6 text-[#0088FF]" />
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <div
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col border-r bg-background transform transition-transform duration-200 ease-in-out shadow-lg ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center border-b px-4">
          <div className="flex items-center space-x-2">
            <img src={logo} alt='logo' className='h-15'/>
            <span className="text-xl font-dynapuff text-[#0088FF]">Susuf Doctor</span>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start cursor-pointer transition-colors ${
                  isActive ? 'bg-[#0088FF] text-primary-foreground hover:bg-[#0088FF]' : 'hover:bg-secondary'
                }`}
                onClick={() => handleNavigate(item.id)}
              >
                <Icon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.id === 'notifications' && (
                  <Badge variant="destructive" className="ml-auto text-xs shrink-0">
                    3
                  </Badge>
                )}
              </Button>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t p-4 space-y-4">
          <div className="border-t pt-4 flex items-center space-x-3">
            {profilePicture ? (
              <img
                src={profilePicture}
                alt="Profile"
                className="h-8 w-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
                <User className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{radiologistName}</p>
              <p className="text-xs text-muted-foreground truncate">Radiologist</p>
            </div>
            <Button 
              onClick={() => handleNavigate('settings')} 
              variant="ghost" 
              size="sm" 
              className="shrink-0 hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}