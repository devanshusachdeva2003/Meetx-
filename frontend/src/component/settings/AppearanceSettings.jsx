import React from 'react';
import { Sun, Moon, Palette } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import Button from '../ui/Button';

export default function AppearanceSettings() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="bg-card/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden group h-full flex flex-col">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[60px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors duration-500" />
      
      <div className="flex items-center gap-4 mb-6 relative z-10">
        <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.1)] group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)] transition-shadow">
          <Palette className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="font-bold text-xl text-white">Appearance</h2>
          <p className="text-sm text-gray-400">Customize how MeetX looks on your device</p>
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-white">Theme Mode</h4>
            <p className="text-xs text-gray-400 mt-0.5">Toggle between Dark and Light mode</p>
          </div>
          <Button 
            onClick={toggleTheme} 
            variant="outline" 
            className="flex items-center gap-2 hover:bg-white/10"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4" /> Light
              </>
            ) : (
              <>
                <Moon className="w-4 h-4" /> Dark
              </>
            )}
          </Button>
        </div>
        
        <div className="h-6 mt-4 flex items-center justify-center">
          {/* Empty spacer for alignment with SecuritySettings card */}
        </div>
      </div>
    </div>
  );
}
