import React from 'react';
import { Bell, Sliders, ChevronRight } from 'lucide-react';
import ProfileSettings from '../component/settings/ProfileSettings';
import SecuritySettings from '../component/settings/SecuritySettings';
import { useUser } from '../context/UserContext';

export default function Settings() {
  const { loading } = useUser();

  if (loading) return null;

  return (
    <div className="flex-1 px-4 py-16 md:p-10 bg-background text-white">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-white/50">Manage your account and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Extracted Profile Form & Card */}
          <ProfileSettings />

          {/* Static Cards */}
          <section className="lg:col-span-8 lg:col-start-5 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Security Settings (Dynamic 2FA) */}
              <SecuritySettings />

              <div className="bg-card rounded-2xl p-6 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-background">
                      <Bell className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="font-semibold">Notifications</h4>
                  </div>
                  <p className="text-sm text-white/60">Configure how you receive notifications and updates.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 shrink-0 ml-4" />
              </div>

              <div className="bg-card rounded-2xl p-6 border border-white/5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors md:col-span-2">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-background">
                      <Sliders className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold">Preferences</h4>
                  </div>
                  <p className="text-sm text-white/60">Customize your meeting and app preferences.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30 shrink-0 ml-4" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
