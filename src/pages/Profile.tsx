import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { fetchMyProjects, updateMyProfile, fetchSessionUser } from "../lib/makers-data";
import { User, Camera, Save, Loader2, AlertCircle, CheckCircle2, Rocket, Clock, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { useTheme } from "../contexts/ThemeContext";

import PageHero from "../components/PageHero";

export const Profile: React.FC = () => {
  const { theme } = useTheme();
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatarUrl || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.name != null) setName(user.name);
    if (user?.avatarUrl) setAvatarPreview(user.avatarUrl);
  }, [user?.id, user?.name, user?.avatarUrl]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user?.id) return;
        const data = await fetchMyProjects(user.id);
        const total = data.length;
        const pending = data.filter((p) => p.status === "PENDING").length;
        const approved = data.filter((p) => p.status === "APPROVED").length;
        setStats({ total, pending, approved });
      } catch (err) {
        console.error("Failed to fetch project stats");
      }
    };
    fetchStats();
  }, [user?.id]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    setLoading(true);
    try {
      await updateMyProfile(name, avatar);
      const u = await fetchSessionUser();
      if (u) setUser(u);
      setSuccess("Profile updated successfully");
      setAvatar(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <PageHero 
        title={`Profile <br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${theme === 'light' ? '#0f172a' : 'white'}'>Settings</span>`}
        subtitle="Manage your account information and security protocols."
        category="User Terminal"
      />

      <div className="max-w-2xl mx-auto py-8 sm:py-24 px-4 relative z-10">
        {/* Project Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-12 sm:mb-16">
          {([
            { label: "Total Projects", value: stats.total, icon: Rocket, boxLight: "bg-indigo-50 text-indigo-600", boxDark: "bg-indigo-500/20 text-indigo-400" },
            { label: "Pending Review", value: stats.pending, icon: Clock, boxLight: "bg-amber-50 text-amber-600", boxDark: "bg-amber-500/20 text-amber-400" },
            { label: "Approved Assets", value: stats.approved, icon: CheckCircle, boxLight: "bg-emerald-50 text-emerald-600", boxDark: "bg-emerald-500/20 text-emerald-400" },
          ] as const).map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`p-6 rounded-3xl border text-center space-y-3 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-xl' : 'bg-white/5 border-white/10'}`}
            >
              <div className={`h-10 w-10 rounded-2xl mx-auto flex items-center justify-center ${theme === "light" ? stat.boxLight : stat.boxDark}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div className={`text-2xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                {stat.value}
              </div>
              <div className={`text-[8px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-3xl rounded-2xl sm:rounded-[2.5rem] border overflow-hidden transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50' : 'bg-white/5 border-white/10'}`}
        >
          <form onSubmit={handleSubmit} className="p-5 sm:p-12 space-y-8 sm:space-y-12">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4 sm:space-y-6">
              <div className="relative group">
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  className={`h-28 w-28 sm:h-40 sm:w-40 rounded-full shadow-2xl overflow-hidden flex items-center justify-center border-4 transition-all duration-500 relative cursor-pointer ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <User className={`h-14 w-14 sm:h-20 sm:w-20 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                </motion.div>
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`absolute bottom-0 right-0 sm:bottom-2 sm:right-2 p-2 sm:p-3 rounded-full shadow-xl transition-all z-10 ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
                >
                  <Camera className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
                </motion.button>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
              <div className="text-center space-y-1.5 sm:space-y-2">
                <h3 className={`text-xl sm:text-2xl font-display uppercase tracking-tight transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{user?.name}</h3>
                <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{user?.email}</p>
              </div>
            </div>

            {error && (
              <div className="p-4 sm:p-6 bg-red-500/10 border border-red-500/20 rounded-xl sm:rounded-2xl flex items-center text-red-400 text-xs sm:text-sm">
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className={`p-4 sm:p-6 border rounded-xl sm:rounded-2xl flex items-center text-xs sm:text-sm transition-all duration-500 ${theme === 'light' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3 flex-shrink-0" />
                {success}
              </div>
            )}

            <div className="space-y-8 sm:space-y-10">
              {/* Basic Info */}
              <div className="space-y-4 sm:space-y-6">
                <h4 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Basic Information</h4>
                <div className="space-y-2 sm:space-y-3">
                  <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Full Name</label>
                  <div className="relative">
                    <User className={`absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-11 sm:pl-16 pr-5 sm:pr-6 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl border focus:ring-1 transition-all outline-none text-xs sm:text-sm font-sans ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-slate-300' : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'}`}
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>
              </div>

              <p className={`text-[10px] pt-6 border-t ${theme === "light" ? "border-slate-200 text-slate-500" : "border-white/5 text-white/40"}`}>
                Password changes use InsForge: sign out and use “Forgot password” on the login page, or your workspace password policy.
              </p>
            </div>

            <div className="pt-2 sm:pt-8">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 sm:py-6 rounded-full font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all duration-500 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" />
                    Update Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
