import React from 'react';
import ProfileSettings from '../component/settings/ProfileSettings';
import SecuritySettings from '../component/settings/SecuritySettings';
import AppearanceSettings from '../component/settings/AppearanceSettings';
import { useUser } from '../context/UserContext';

export default function Settings() {
  const { loading } = useUser();

  if (loading) return null;

  return (
    <main className="flex-1 min-w-0 px-4 py-16 md:px-8 md:py-10 flex flex-col gap-8 h-full relative overflow-y-auto overflow-x-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none -z-10" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto w-full space-y-10 relative z-10">
        <header className="space-y-2 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Settings</h1>
          <p className="text-gray-400">Manage your account, profile, and security preferences.</p>
        </header>

        <div className="flex flex-col gap-8">
          <ProfileSettings />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SecuritySettings />
            <AppearanceSettings />
          </div>
        </div>
      </div>
    </main>
  );
}
