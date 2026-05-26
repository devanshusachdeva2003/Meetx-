import React, { useState, useEffect } from 'react';

/**
 * MeetX Settings Mobile Component
 * Features: Tailwind CSS styling, React state management, and simulated form submission.
 */
const MeetXSettingsMobile = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle', 'saving', 'success'
  const [activeTab, setActiveTab] = useState('Settings');

  const navItems = [
    { id: 'Home', label: 'Home', icon: <HomeIcon /> },
    { id: 'Meetings', label: 'Meetings', icon: <MeetingsIcon /> },
    { id: 'Settings', label: 'Settings', icon: <SettingsIcon /> },
    { id: 'More', label: 'More', icon: <MoreIcon /> },
  ];

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveStatus('saving');

    // Simulate network request
    setTimeout(() => {
      setSaveStatus('success');
      setIsSaving(false);
      
      // Reset after success
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#131315] text-white font-['Hanken_Grotesk'] flex flex-col pb-24">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-[#131315]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#7c3aed] rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight">MeetX</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-white/70 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100&h=100" alt="Profile" className="w-8 h-8 rounded-full border border-white/10" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-[#131315] rounded-full"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-6">
        <div className="space-y-1 px-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-white/50 text-sm">Manage your account and preferences.</p>
        </div>

        {/* Profile Information Section */}
        <section className="bg-[#1c1b1d] rounded-3xl p-6 border border-white/5 space-y-8">
          <h2 className="text-xl font-semibold">Profile Information</h2>
          
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-2 border-[#7c3aed] p-1">
                <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=300&h=300" alt="User" className="w-full h-full rounded-full object-cover" />
              </div>
              <button className="absolute bottom-1 right-1 bg-[#7c3aed] p-2 rounded-full shadow-lg border-2 border-[#1c1b1d] hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
            <div className="text-center">
              <button className="px-6 py-2 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/5 transition-colors">Change Photo</button>
              <p className="text-[10px] text-white/30 mt-2 uppercase tracking-widest">JPG, GIF or PNG. Max size of 2MB</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm text-white/60 ml-1">Full Name</label>
              <input type="text" defaultValue="John Doe" className="w-full bg-[#131315] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#7c3aed] transition-colors" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm text-white/60 ml-1">Email Address</label>
              <input type="email" defaultValue="john.doe@email.com" className="w-full bg-[#131315] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#7c3aed] transition-colors" />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60 ml-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                  <span className="text-lg">🇺🇸</span>
                </div>
                <input type="tel" defaultValue="+1 (555) 123-4567" className="w-full bg-[#131315] border border-white/5 rounded-2xl pl-14 pr-5 py-4 focus:outline-none focus:border-[#7c3aed] transition-colors" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-white/60 ml-1">Role</label>
              <div className="relative">
                <select className="w-full bg-[#131315] border border-white/5 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#7c3aed] appearance-none transition-colors">
                  <option>Product Manager</option>
                  <option>Developer</option>
                  <option>Designer</option>
                </select>
                <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-white/40">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isSaving}
              className={`w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                saveStatus === 'success' ? 'bg-green-600' : 'bg-[#7c3aed] hover:bg-[#6d28d9]'
              } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : saveStatus === 'success' ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Saved Successfully!</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </form>
        </section>

        {/* Menu Links */}
        <div className="space-y-3">
          <MenuLink 
            icon={<ShieldIcon />} 
            title="Security" 
            subtitle="Update password and security" 
            bgColor="bg-green-500/10 text-green-500" 
          />
          <MenuLink 
            icon={<BellIcon />} 
            title="Notifications" 
            subtitle="Configure receive alerts" 
            bgColor="bg-purple-500/10 text-purple-500" 
          />
        </div>

        {/* Upgrade Card */}
        <div className="p-6 bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] rounded-3xl space-y-4">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 110-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
            </svg>
            <h3 className="font-bold text-lg">Upgrade to Pro</h3>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">Unlock more features and higher limits for your team.</p>
          <button className="w-full bg-white text-[#7c3aed] py-3 rounded-xl font-bold hover:bg-white/90 transition-all">Upgrade Now</button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#131315]/90 backdrop-blur-xl border-t border-white/5 px-6 py-4 flex justify-between items-center z-50">
        {navItems.map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === item.id ? 'text-[#7c3aed]' : 'text-white/40'}`}
          >
            <div className="relative">
              {item.icon}
              {activeTab === item.id && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#7c3aed] rounded-full border-2 border-[#131315]"></div>
              )}
            </div>
            <span className={`text-[10px] ${activeTab === item.id ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

// Sub-components for cleaner code
const MenuLink = ({ icon, title, subtitle, bgColor }) => (
  <button className="w-full flex items-center justify-between p-5 bg-[#1c1b1d] border border-white/5 rounded-2xl group hover:border-white/10 transition-colors">
    <div className="flex items-center gap-4">
      <div className={`p-3 rounded-xl ${bgColor}`}>
        {icon}
      </div>
      <div className="text-left">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-white/40">{subtitle}</p>
      </div>
    </div>
    <svg className="w-5 h-5 text-white/20 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
    </svg>
  </button>
);

// Icon Components
const HomeIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const MeetingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const SettingsIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>;
const MoreIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>;
const ShieldIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const BellIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>;

export default MeetXSettingsMobile;
