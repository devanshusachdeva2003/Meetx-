import React from 'react';
import { ChevronRight } from 'lucide-react';
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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
