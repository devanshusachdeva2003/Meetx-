import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import Button from './ui/Button';

export function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-root flex h-screen bg-background text-gray-200 font-sans overflow-hidden relative">
      {/* Mobile Hamburger Button */}
      <Button 
        variant="none"
        size="none"
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden absolute top-5 left-4 z-[40] p-2 bg-card/80 backdrop-blur-xl border border-border rounded-xl text-white shadow-lg shadow-black/50"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]" 
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      
      <div className="flex-1 overflow-y-auto min-w-0 w-full relative">
        <Outlet />
      </div>
    </div>
  );
}
