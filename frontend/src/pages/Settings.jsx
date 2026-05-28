import React from 'react';
import { Shield, Bell, Sliders, ChevronRight } from 'lucide-react';
import Button from '../component/ui/Button';

export default function Settings() {
  return (
    <div className="flex-1 px-4 py-16 md:p-10 bg-background text-white">
      <div className="max-w-[1200px] mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-white/50">Manage your account and preferences.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* left column: profile card */}
          <aside className="lg:col-span-4">
            <div className="bg-card rounded-2xl p-6 border border-white/5">
              <h2 className="text-lg font-semibold mb-4 text-center sm:text-left">Profile Information</h2>
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gradient-primary overflow-hidden shrink-0">
                  <img src="/download.jpg" alt="profile" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-semibold">John Doe</p>
                  <p className="text-sm text-white/60">john.doe@email.com</p>
                  <div className="mt-4">
                    <Button size="sm">Change Photo</Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* right column: form */}
          <section className="lg:col-span-8">
            <div className="bg-card rounded-2xl p-6 border border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-white/60">Full Name</label>
                  <input className="w-full mt-2 p-3 rounded-xl bg-background border border-white/5" defaultValue="John Doe" />
                </div>
                <div>
                  <label className="text-sm text-white/60">Email Address</label>
                  <input className="w-full mt-2 p-3 rounded-xl bg-background border border-white/5" defaultValue="john.doe@email.com" />
                </div>
                <div>
                  <label className="text-sm text-white/60">Phone Number</label>
                  <input className="w-full mt-2 p-3 rounded-xl bg-background border border-white/5" defaultValue="+1 (555) 123-4567" />
                </div>
                <div>
                  <label className="text-sm text-white/60">Role</label>
                  <select className="w-full mt-2 p-3 rounded-xl bg-background border border-white/5">
                    <option>Product Manager</option>
                    <option>Developer</option>
                    <option>Designer</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-center sm:justify-end mt-6">
                <Button className="w-full sm:w-auto">Save Changes</Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
              <div className="bg-card rounded-2xl p-6 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-background">
                      <Shield className="w-5 h-5 text-green-400" />
                    </div>
                    <h4 className="font-semibold">Security</h4>
                  </div>
                  <p className="text-sm text-white/60">Update your password and manage security settings.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>

              <div className="bg-card rounded-2xl p-6 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-background">
                      <Bell className="w-5 h-5 text-purple-400" />
                    </div>
                    <h4 className="font-semibold">Notifications</h4>
                  </div>
                  <p className="text-sm text-white/60">Configure how you receive notifications and updates.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>

              <div className="bg-card rounded-2xl p-6 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 rounded-lg bg-background">
                      <Sliders className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h4 className="font-semibold">Preferences</h4>
                  </div>
                  <p className="text-sm text-white/60">Customize your meeting and app preferences.</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/30" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
