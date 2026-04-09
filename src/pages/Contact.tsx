import React, { useState } from "react";
import { motion } from "motion/react";
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle } from "lucide-react";
import PageHero from "../components/PageHero";
import { useTheme } from "../contexts/ThemeContext";
import { toast } from "sonner";

const CONTACT_EMAIL = "creators.makerslab@gmail.com";

export const Contact: React.FC = () => {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      toast.error("Please complete all fields with real content.");
      return;
    }
    setLoading(true);
    const subject = encodeURIComponent(`Maker’s Lab inquiry from ${trimmedName}`);
    const body = encodeURIComponent(
      `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\n---\n\n${trimmedMessage}`
    );
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    try {
      window.location.assign(mailto);
    } catch {
      window.open(mailto, "_blank", "noopener,noreferrer");
    }
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 400);
  };

  const resetForm = () => {
    setSuccess(false);
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="page-shell">
      <PageHero 
        title={`Initiate <br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${theme === 'light' ? '#0f172a' : 'white'}'>Contact</span>`}
        subtitle="We are open for elite collaborations. Transmit your inquiry and our team will respond within 24 hours."
        category="Contact Terminal"
      />

      <div className="max-w-7xl mx-auto px-4 py-24 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
          {/* Left Column: Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-12"
          >
            <div className="space-y-8">
              {[
                { icon: Mail, label: "Inquiries", value: CONTACT_EMAIL },
                { icon: MapPin, label: "Location", value: "Tesano, Accra, Ghana" },
                { icon: Phone, label: "Direct Line", value: "+233 (0) 55 000 0000" }
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-6 group">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:border-indigo-500/50 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'}`}>
                    <item.icon className={`h-5 w-5 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400 group-hover:text-indigo-600' : 'text-white/40 group-hover:text-indigo-400'}`} />
                  </div>
                  <div className="space-y-1">
                    <div className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>{item.label}</div>
                    <div className={`font-sans transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`flex space-x-6 pt-12 border-t transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
              {["Twitter", "Instagram", "LinkedIn", "GitHub"].map(social => (
                <a key={social} href="#" className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400 hover:text-slate-900' : 'text-gray-500 hover:text-white'}`}>{social}</a>
              ))}
            </div>
          </motion.div>

          {/* Right Column: Form */}
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
            
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`text-center space-y-8 p-12 backdrop-blur-xl rounded-[2.5rem] border transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50' : 'bg-white/5 border-white/10'}`}
              >
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border transition-colors duration-500 ${theme === 'light' ? 'bg-green-50 border-green-100' : 'bg-green-500/10 border-green-500/20'}`}>
                  <CheckCircle className="h-10 w-10 text-green-400" />
                </div>
                <div className="space-y-4">
                  <h2 className={`text-3xl font-display uppercase transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Transmission <br /> Received</h2>
                  <p className={`font-sans leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                    Your default email app should open with this message ready to send. If nothing opened, email us at{" "}
                    <a href={`mailto:${CONTACT_EMAIL}`} className="text-indigo-500 hover:underline">{CONTACT_EMAIL}</a>.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={resetForm}
                  className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-white transition-colors"
                >
                  Send Another Transmission
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className={`space-y-8 backdrop-blur-3xl border p-12 rounded-[2.5rem] transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50' : 'bg-white/2 border-white/5'}`}>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Full Name</label>
                    <input 
                      type="text" 
                      required 
                      name="name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. ALEXANDER VANCE"
                      className={`w-full px-6 py-5 rounded-2xl border focus:ring-1 transition-all outline-none font-sans ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-slate-300' : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Email Address</label>
                    <input 
                      type="email" 
                      required 
                      name="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alexander@vance.com"
                      className={`w-full px-6 py-5 rounded-2xl border focus:ring-1 transition-all outline-none font-sans ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-slate-300' : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'}`}
                    />
                  </div>
                  <div className="space-y-3">
                    <label className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Inquiry Brief</label>
                    <textarea 
                      required 
                      name="message"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Describe your project vision or inquiry..."
                      className={`w-full px-6 py-5 rounded-2xl border focus:ring-1 transition-all outline-none resize-none font-sans ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-300 focus:ring-slate-300' : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'}`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-6 rounded-full font-bold text-xs uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center group ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    <>
                      Transmit Inquiry <Send className="ml-4 h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
