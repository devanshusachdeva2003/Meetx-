import React, { useState } from 'react';
import ProfileSettings from '../component/settings/ProfileSettings';
import SecuritySettings from '../component/settings/SecuritySettings';
import AppearanceSettings from '../component/settings/AppearanceSettings';
import { useUser } from '../context/UserContext';
import { UserCircle, Shield, Palette } from 'lucide-react';
import cn from '../lib/cn';

export default function Settings() {
  const { loading } = useUser();
  const [activeTab, setActiveTab] = useState('profile');

  if (loading) return null;

  const tabs = [
    { id: 'profile', label: 'Profile', icon: UserCircle },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  return (
    <main className="flex-1 min-w-0 px-4 py-8 md:px-8 md:py-10 flex flex-col h-full relative overflow-y-auto overflow-x-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-5xl mx-auto w-full relative z-10 flex flex-col md:flex-row gap-8 md:gap-12">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <header className="space-y-1 mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
            <p className="text-sm text-gray-400">Manage your preferences.</p>
          </header>
          
          <nav className="grid grid-cols-3 md:flex md:flex-col gap-2 pb-2 md:pb-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col md:flex-row items-center justify-center md:justify-start gap-1.5 md:gap-3 p-2 md:px-4 md:py-3 rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20 font-semibold" 
                      : "text-gray-400 hover:bg-white/5 hover:text-white font-medium"
                  )}
                >
                  <Icon size={20} className={cn(isActive ? "text-white" : "text-gray-400", "mb-0.5 md:mb-0")} />
                  <span className="text-xs md:text-base">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 max-w-3xl">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'appearance' && <AppearanceSettings />}
        </div>

      </div>
    </main>
  );
}
