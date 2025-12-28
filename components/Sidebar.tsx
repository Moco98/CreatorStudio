import React, { useRef, useState } from 'react';
import { ViewState, UserProfile } from '../types';
import { Layout, Calendar, User, Moon, Sun, Image as ImageIcon, Upload, RotateCcw, BarChart2, X, Check, Camera, Smile, Download, FileJson } from 'lucide-react';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  darkMode: boolean;
  setDarkMode: (v: boolean) => void;
  bgIndex: number;
  setBgIndex: (i: number) => void;
  backgrounds: any[];
  onUploadBackground: (file: File) => void;
  onResetTheme: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onExportData: () => void;
  onImportData: (file: File) => void;
}

const MEMOJI_PRESETS = [
    '👩‍💻', '👨‍💻', '🧑‍🎨', '👩‍🚀', '🦄', '🦁', '🦊', '🐨', '🐯', '🐙', '💀', '👽', '🤖', '💩', '😎', '🤠'
];

const Sidebar: React.FC<SidebarProps> = ({ 
    currentView, setView, 
    darkMode, setDarkMode,
    bgIndex, setBgIndex, backgrounds,
    onUploadBackground,
    onResetTheme,
    userProfile, setUserProfile,
    onExportData,
    onImportData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [tempProfile, setTempProfile] = useState<UserProfile>(userProfile);

  const menuItems = [
    { id: ViewState.PLANNER, label: 'Projects', icon: Layout },
    { id: ViewState.CALENDAR, label: 'Calendar & Log', icon: Calendar },
    { id: ViewState.STATS, label: 'Statistics', icon: BarChart2 },
  ];

  const cycleBackground = () => {
      setBgIndex((bgIndex + 1) % backgrounds.length);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onUploadBackground(e.target.files[0]);
      }
  };
  
  const handleDataImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          if (confirm("Restoring data will overwrite your current data. Are you sure?")) {
            onImportData(e.target.files[0]);
          }
          // Reset value so we can select the same file again if needed
          e.target.value = '';
      }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setTempProfile(prev => ({
                  ...prev,
                  avatarType: 'image',
                  avatarValue: reader.result as string
              }));
          };
          reader.readAsDataURL(e.target.files[0]);
      }
  };

  const saveProfile = () => {
      setUserProfile(tempProfile);
      setIsProfileOpen(false);
  };

  const cancelProfile = () => {
      setTempProfile(userProfile);
      setIsProfileOpen(false);
  };

  const openProfile = () => {
      setTempProfile(userProfile);
      setIsProfileOpen(true);
  };

  return (
    <>
        {/* Profile Modal */}
        {isProfileOpen && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
                <div className="w-full max-w-sm bg-white/90 dark:bg-gray-900/95 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-3xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">Edit Profile</h3>
                        <button onClick={cancelProfile}><X size={20} className="text-gray-500 hover:text-gray-800 dark:hover:text-white"/></button>
                    </div>

                    <div className="flex flex-col items-center mb-6">
                        {/* Avatar Preview & Selection */}
                        <div className="relative w-24 h-24 mb-4 group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                            <div className="w-full h-full rounded-full overflow-hidden shadow-lg border-2 border-white dark:border-gray-700 flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                                {tempProfile.avatarType === 'image' && <img src={tempProfile.avatarValue} alt="Avatar" className="w-full h-full object-cover" />}
                                {tempProfile.avatarType === 'emoji' && <span className="text-5xl select-none">{tempProfile.avatarValue}</span>}
                                {tempProfile.avatarType === 'initials' && (
                                    <div className={`w-full h-full bg-gradient-to-br ${tempProfile.avatarValue} flex items-center justify-center text-white text-3xl font-bold`}>
                                        {tempProfile.name.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white" size={24} />
                            </div>
                            <input 
                                type="file" 
                                ref={avatarInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleAvatarUpload}
                            />
                        </div>

                        {/* Memoji Picker */}
                        <div className="mb-4 w-full">
                            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                                <Smile size={12}/> Select Memoji
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mask-gradient">
                                <button 
                                    onClick={() => setTempProfile(prev => ({ ...prev, avatarType: 'initials', avatarValue: 'from-blue-500 to-indigo-600' }))}
                                    className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs hover:scale-110 transition-transform"
                                >
                                    {tempProfile.name.charAt(0)}
                                </button>
                                {MEMOJI_PRESETS.map(emoji => (
                                    <button 
                                        key={emoji}
                                        onClick={() => setTempProfile(prev => ({ ...prev, avatarType: 'emoji', avatarValue: emoji }))}
                                        className="w-10 h-10 shrink-0 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl hover:scale-110 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Name Input */}
                        <div className="w-full">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Name</label>
                            <input 
                                type="text"
                                value={tempProfile.name}
                                onChange={(e) => setTempProfile(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full bg-gray-50 dark:bg-black/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-900 dark:text-white font-bold text-lg text-center"
                                placeholder="Your Name"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={cancelProfile} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">Cancel</button>
                        <button onClick={saveProfile} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2">
                            <Check size={18} /> Save
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Sidebar Content */}
        <div className="w-full h-full flex flex-col pt-8 pb-4 px-4 text-gray-800 dark:text-gray-100 transition-colors">
            {/* Top Profile Header - Now Dynamic */}
            <div className="flex items-center gap-3 px-2 mb-10 cursor-pointer group" onClick={openProfile}>
                <div className="w-10 h-10 rounded-xl shadow-lg shadow-blue-500/20 overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-gray-800 group-hover:scale-105 transition-transform">
                    {userProfile.avatarType === 'image' && <img src={userProfile.avatarValue} alt="Avatar" className="w-full h-full object-cover" />}
                    {userProfile.avatarType === 'emoji' && <span className="text-2xl select-none">{userProfile.avatarValue}</span>}
                    {userProfile.avatarType === 'initials' && (
                        <div className={`w-full h-full bg-gradient-to-br ${userProfile.avatarValue} flex items-center justify-center text-white font-bold`}>
                            {userProfile.name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className="font-bold text-lg leading-tight tracking-tight drop-shadow-sm text-gray-900 dark:text-white truncate max-w-[140px]">
                        {userProfile.name}
                    </span>
                    <span className="text-[10px] opacity-50 uppercase font-bold tracking-wider group-hover:text-blue-500 transition-colors">Edit Profile</span>
                </div>
            </div>

            <nav className="flex-1 space-y-2">
                {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                    <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${
                        isActive 
                        ? 'bg-white/80 dark:bg-white/10 shadow-sm font-medium backdrop-blur-md text-blue-600 dark:text-blue-400' 
                        : 'hover:bg-white/40 dark:hover:bg-white/5 hover:backdrop-blur-sm opacity-70 hover:opacity-100'
                    }`}
                    >
                    <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : ''} />
                    {item.label}
                    </button>
                );
                })}
            </nav>

            {/* Appearance Controls */}
            <div className="px-2 mb-6 space-y-2">
                <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest px-1">Settings</div>
                <div className="grid grid-cols-4 gap-2">
                    <button 
                        onClick={() => setDarkMode(!darkMode)}
                        className="flex items-center justify-center py-2 rounded-lg bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm"
                        title={darkMode ? 'Light Mode' : 'Dark Mode'}
                    >
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                    <button 
                        onClick={cycleBackground}
                        className="flex items-center justify-center py-2 rounded-lg bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm"
                        title="Next Theme"
                    >
                        <ImageIcon size={16} />
                    </button>
                    <button 
                        onClick={onExportData}
                        className="flex items-center justify-center py-2 rounded-lg bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm"
                        title="Backup Data"
                    >
                        <Download size={16} />
                    </button>
                    <button 
                        onClick={() => dataInputRef.current?.click()}
                        className="flex items-center justify-center py-2 rounded-lg bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm group/import"
                        title="Restore Data"
                    >
                        <Upload size={16} className="group-hover/import:text-blue-500"/>
                        <input 
                            type="file" 
                            ref={dataInputRef} 
                            className="hidden" 
                            accept=".json"
                            onChange={handleDataImport}
                        />
                    </button>
                </div>
                 <div className="grid grid-cols-2 gap-2 mt-1">
                     <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm text-[10px] font-bold opacity-70 hover:opacity-100"
                        title="Upload Custom Background"
                    >
                        <ImageIcon size={12} /> BG Image
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </button>
                    <button 
                        onClick={onResetTheme}
                        className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/40 dark:bg-black/40 hover:bg-white/60 dark:hover:bg-white/10 border border-white/20 transition-all backdrop-blur-sm text-[10px] font-bold opacity-70 hover:opacity-100"
                        title="Reset to Default"
                    >
                        <RotateCcw size={12} /> Reset
                    </button>
                </div>
            </div>

            <div className="border-t border-gray-200/20 pt-4 space-y-1">
                <button 
                    onClick={openProfile}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm opacity-70 hover:opacity-100 hover:bg-white/20 dark:hover:bg-white/5 rounded-lg transition-colors"
                >
                    <User size={16} /> Profile
                </button>
            </div>
        </div>
    </>
  );
};

export default Sidebar;