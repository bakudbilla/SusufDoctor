import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Brain, 
  Upload, 
  Users, 
  Home,
  Settings,
  User,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'upload', label: 'Upload Images', icon: Upload },
  { id: 'patients', label: 'Patient Management', icon: Users },
];

export function Navigation({ currentPage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = (id) => {
    onNavigate(id);
    setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden  p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
      > 
        {isOpen ? <X className="h-6 w-6 text-[#0088FF]" /> : <Menu className="h-6 w-6 text-[#0088FF]" />}
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
            <Brain className="h-6 w-6 text-[#0088FF]" />
            <span className="text-xl font-dynapuff text-[#0088FF]">Susuf Doctor</span>
          </div>
        </div>

        {/* Navigation items */}
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
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shrink-0">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Dr. Awinpang Bernice</p>
              <p className="text-xs text-muted-foreground truncate">Radiologist</p>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
