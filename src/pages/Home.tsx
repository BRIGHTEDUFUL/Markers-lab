import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Rocket, ArrowRight, ShieldCheck, Globe, MessageSquare } from "lucide-react";
import { motion } from "motion/react";
import { fetchFeaturedGallery } from "../lib/makers-data";
import { useTheme } from "../contexts/ThemeContext";
import { mediaSrc } from "../lib/media-url";
import { starSpec } from "../lib/star-field";
import { Project } from "../types";

export const Home = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const heroStars = useMemo(
    () => Array.from({ length: 80 }, (_, i) => starSpec(i, theme, 1000)),
    [theme]
  );

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await fetchFeaturedGallery();
        setFeaturedProjects(Array.isArray(data) ? data.slice(0, 2) : []);
      } catch (error) {
        console.error("Error fetching featured projects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="page-shell">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className={`absolute top-0 left-0 w-full h-full mask-radial opacity-20 transition-colors duration-700 ${theme === 'light' ? 'bg-grid-slate-900' : 'bg-grid-white'}`} />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: theme === 'light' ? [0.1, 0.2, 0.1] : [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full blur-[120px] transition-colors duration-700 ${theme === 'light' ? 'bg-indigo-400/10' : 'bg-indigo-600/20'}`} 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: theme === 'light' ? [0.1, 0.2, 0.1] : [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full blur-[100px] transition-colors duration-700 ${theme === 'light' ? 'bg-purple-400/10' : 'bg-purple-600/20'}`} 
        />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 pt-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
          {heroStars.map((s, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: s.initialOpacity,
                scale: s.initialScale,
              }}
              animate={{
                opacity: theme === "light" ? [0.05, 0.32, 0.05] : [0.08, 0.5, 0.08],
                scale: s.isLarge ? [1, 1.2, 1] : [1, 1.5, 1],
              }}
              transition={{
                duration: s.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: s.delay,
              }}
              className="absolute rounded-full"
              style={{
                width: `${s.size}px`,
                height: `${s.size}px`,
                backgroundColor: s.starColor,
                left: s.leftPct,
                top: s.topPct,
                boxShadow: s.isLarge ? `0 0 ${s.size * 4}px ${s.starColor}` : `0 0 ${s.size * 2}px ${s.starColor}`,
                filter: `blur(${s.size * 0.2}px)`,
              }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative z-10 mb-8 drop-shadow-[0_0_15px_rgba(0,0,0,0.1)]`}
        >
          <span className={`px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'border-indigo-200 bg-white/50 text-indigo-600' : 'border-white/10 bg-white/5 text-indigo-400'}`}>
            Maker’s Lab
          </span>
        </motion.div>

        <div className="relative z-10 mb-12 w-full max-w-5xl mx-auto px-4">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9, filter: "blur(20px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className={`font-display text-[16vw] sm:text-[15vw] md:text-[13vw] leading-[0.82] uppercase tracking-tighter transition-colors duration-500 ${theme === "light" ? "text-slate-900 drop-shadow-[0_2px_40px_rgba(255,255,255,0.9)]" : "text-white drop-shadow-[0_4px_48px_rgba(0,0,0,0.85)]"}`}
          >
            <motion.span 
              animate={{ rotate: [-1.5, 1.5] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              style={{ originX: 0.5, originY: 0, display: "inline-block" }}
              className="bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-foreground/50"
            >
              Websites
            </motion.span><br />
            <span className={`text-transparent stroke-1 transition-all duration-500 cursor-default`} style={{ WebkitTextStroke: theme === 'light' ? "1px #0f172a" : "1px white" }}>Web Apps</span><br />
            <motion.span 
              animate={{ 
                scaleX: [1, 1.1, 0.9, 1.05, 0.98, 1],
                scaleY: [1, 0.9, 1.1, 0.95, 1.02, 1]
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                repeatDelay: 3, 
                ease: "easeInOut" 
              }}
              style={{ display: "inline-block", willChange: "transform" }}
              className="bg-clip-text text-transparent bg-gradient-to-t from-foreground via-foreground to-foreground/50"
            >
              & More
            </motion.span>
          </motion.h1>
          
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "100%", opacity: 1 }}
            transition={{ delay: 0.8, duration: 2, ease: "circOut" }}
            className="absolute -bottom-6 left-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.5)]"
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className={`relative z-10 max-w-2xl font-heading text-xl md:text-2xl font-light leading-relaxed mb-16 transition-colors duration-500 ${theme === 'light' ? 'text-slate-700 drop-shadow-[0_2px_10px_rgba(255,255,255,0.8)]' : 'text-white/80 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]'}`}
        >
          Where <span className="text-indigo-500 font-medium italic">ideas</span> merge with <span className="text-purple-500 font-medium italic">execution</span>.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col sm:flex-row items-center gap-8"
        >
          <Link 
            to={user ? "/submit-project" : "/register"} 
            className={`group relative px-12 py-6 font-bold uppercase tracking-[0.3em] text-[10px] overflow-hidden transition-all hover:pr-16 shadow-2xl ${theme === 'light' ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-white text-black shadow-white/10'}`}
          >
            <span className="relative z-10">{user ? "Start Project" : "Join Maker’s Lab"}</span>
            <ArrowRight className="absolute right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all h-5 w-5" />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
          </Link>
          <Link 
            to="/gallery" 
            className={`px-12 py-6 border font-bold uppercase tracking-[0.3em] text-[10px] transition-all relative overflow-hidden group ${theme === 'light' ? 'border-slate-200 text-slate-900 hover:border-slate-900' : 'border-white/20 text-white hover:border-white'}`}
          >
            <div className="absolute inset-0 bg-indigo-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative z-10">View Archive</span>
          </Link>
        </motion.div>
      </section>

      {/* Marquee Section */}
      <section className={`relative z-10 py-32 border-y transition-colors duration-500 ${theme === 'light' ? 'border-slate-200 bg-slate-100/30' : 'border-white/5 bg-white/2'} overflow-hidden`}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center mx-16">
              <span className={`font-display text-7xl md:text-9xl uppercase tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900/5' : 'text-white/5'}`}>
                Websites • Web Apps • Digital Experiences • Innovation •
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features - Brutalist Grid */}
      <section className={`relative z-10 grid grid-cols-1 md:grid-cols-3 border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
        {([
          { title: "Bespoke Websites", desc: "Digital experiences that tell your brand's story with uncompromising precision and elite motion design.", icon: Globe, gradient: "from-indigo-500/5" },
          { title: "High-End Web Apps", desc: "Scalable, high-performance applications built with cutting-edge tech stacks and fluid UX.", icon: Rocket, gradient: "from-purple-500/5" },
          { title: "And More", desc: "From immersive 3D environments to custom digital tools, we build beyond the traditional browser limits.", icon: ShieldCheck, gradient: "from-blue-500/5" },
        ] as const).map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.2 }}
            className={`p-10 sm:p-16 md:p-24 border-b md:border-b-0 md:border-r transition-all duration-700 group relative overflow-hidden ${theme === 'light' ? 'border-slate-200 hover:bg-slate-100' : 'border-white/5 hover:bg-white/5'} last:border-b-0 md:last:border-r-0`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
            <div className="mb-10 text-indigo-500 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 relative z-10">
              <feature.icon className="h-14 w-14" />
            </div>
            <h3 className={`font-heading text-3xl font-bold mb-8 uppercase tracking-tight transition-colors duration-500 relative z-10 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{feature.title}</h3>
            <p className={`font-sans text-lg leading-relaxed font-light transition-colors duration-500 relative z-10 ${theme === 'light' ? 'text-slate-500' : 'text-gray-400'}`}>{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Featured Projects - Immersive Showcase */}
      <section className={`relative z-10 py-20 sm:py-40 px-4 border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
        <div className="max-w-7xl mx-auto space-y-16 sm:space-y-32">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 md:gap-12">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4 sm:mb-6"
              >
                The Portfolio
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className={`text-5xl sm:text-6xl md:text-9xl font-display uppercase leading-[0.9] transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
              >
                Selected <br />
                <span className={`italic text-transparent transition-all duration-500`} style={{ WebkitTextStroke: theme === 'light' ? "1px #0f172a" : "1px white" }}>Creations</span>
              </motion.h2>
            </div>
            <Link 
              to="/gallery" 
              className={`group flex items-center space-x-4 sm:space-x-6 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-900 hover:text-indigo-600' : 'text-white hover:text-indigo-400'}`}
            >
              <span>Explore Full Archive</span>
              <div className={`w-12 sm:w-16 h-[1px] transition-all duration-500 ${theme === 'light' ? 'bg-slate-900 group-hover:bg-indigo-600 group-hover:w-20 sm:group-hover:w-24' : 'bg-white group-hover:bg-indigo-500 group-hover:w-20 sm:group-hover:w-24'}`} />
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16">
            {loading ? (
              [...Array(2)].map((_, i) => (
                <div key={i} className={`aspect-[16/10] rounded-2xl sm:rounded-[3rem] animate-pulse ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`} />
              ))
            ) : featuredProjects.length > 0 ? (
              featuredProjects.map((project, i) => {
                const coverImage = project.files?.find((f) => f.mimeType?.startsWith("image/"));
                const imageUrl = mediaSrc(
                  coverImage?.path,
                  `https://picsum.photos/seed/${project.id}/1200/800?blur=2`
                );
                
                return (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.2, duration: 0.8 }}
                    className={`group relative aspect-[16/10] overflow-hidden rounded-2xl sm:rounded-[3rem] border transition-all duration-700 ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50' : 'bg-white/5 border-white/10 shadow-2xl shadow-black/50'}`}
                  >
                    <img 
                      src={imageUrl} 
                      alt={project.title}
                      className={`absolute inset-0 w-full h-full object-cover grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-1000`}
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t transition-opacity duration-700 ${theme === 'light' ? 'from-white via-white/40 to-transparent opacity-95' : 'from-black via-black/40 to-transparent opacity-90'}`} />
                    
                    <div className="absolute inset-0 p-8 sm:p-16 flex flex-col justify-end translate-y-8 sm:translate-y-12 group-hover:translate-y-0 transition-transform duration-700">
                      <div className="space-y-3 sm:space-y-6">
                        <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] text-indigo-500 bg-indigo-500/10 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full w-fit">{project.category}</span>
                        <h3 className={`text-3xl sm:text-5xl md:text-7xl font-display uppercase tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.title}</h3>
                        <p className={`font-sans text-xs sm:text-base max-w-sm line-clamp-3 opacity-0 group-hover:opacity-100 transition-all duration-700 delay-100 ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                          {project.description}
                        </p>
                      </div>
                    </div>

                    {project.repoUrl && (
                      <a 
                        href={project.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-8 sm:top-16 right-8 sm:right-16 opacity-0 group-hover:opacity-100 transition-all duration-700 -translate-x-4 sm:-translate-x-8 group-hover:translate-x-0"
                      >
                        <div className={`w-12 h-12 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl ${theme === 'light' ? 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-indigo-600' : 'bg-white text-black shadow-white/10 hover:bg-indigo-500 hover:text-white'}`}>
                          <ArrowRight className="h-5 w-5 sm:h-8 sm:w-8" />
                        </div>
                      </a>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className={`col-span-1 md:col-span-2 py-20 sm:py-32 text-center border border-dashed rounded-2xl sm:rounded-[3rem] transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
                <p className={`font-sans uppercase tracking-widest text-[10px] sm:text-xs transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>No featured projects yet.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials - Immersive Design */}
      <section className={`relative z-10 py-20 sm:py-40 px-4 border-b transition-colors duration-500 ${theme === 'light' ? 'bg-slate-100/30 border-slate-200' : 'bg-white/2 border-white/5'} overflow-hidden`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 sm:mb-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-indigo-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-4 sm:mb-6"
            >
              Client Stories
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`text-4xl sm:text-6xl md:text-9xl font-display uppercase transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
            >
              Trusted by <span className={`italic text-transparent transition-all duration-500`} style={{ WebkitTextStroke: theme === 'light' ? "1px #0f172a" : "1px white" }}>Visionaries</span>
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {[
              { 
                quote: "Maker’s Lab transformed our vision into a digital masterpiece. Their attention to detail and elite motion design is unparalleled.",
                author: "Julian Sterling",
                role: "CEO, Nexus AI",
                image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200"
              },
              { 
                quote: "The most professional and creative team we've ever worked with. They don't just build apps; they build experiences.",
                author: "Aria Chen",
                role: "Founder, Quantum Labs",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"
              },
              { 
                quote: "Uncompromising precision and elite execution. Maker’s Lab is the gold standard for high-end web development.",
                author: "Dorian Thorne",
                role: "Design Director, Stellar",
                image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200"
              }
            ].map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className={`p-8 sm:p-16 border rounded-2xl sm:rounded-[3rem] transition-all duration-500 group relative overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 hover:bg-slate-50 shadow-2xl shadow-slate-200/20' : 'bg-white/5 border-white/10 hover:bg-white/10 shadow-2xl shadow-black/20'}`}
              >
                <div className="absolute top-0 right-0 p-4 sm:p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <MessageSquare className="h-16 w-16 sm:h-24 sm:w-24 text-indigo-500" />
                </div>
                <p className={`text-lg sm:text-2xl font-light leading-relaxed mb-8 sm:text-16 italic transition-colors duration-500 relative z-10 ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                  "{testimonial.quote}"
                </p>
                <div className="flex items-center space-x-4 sm:space-x-6 relative z-10">
                  <div className="relative">
                    <img 
                      src={testimonial.image} 
                      alt={testimonial.author}
                      className={`h-12 w-12 sm:h-16 sm:w-16 rounded-full object-cover border-2 transition-all duration-500 group-hover:border-indigo-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/20'}`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping group-hover:block hidden" />
                  </div>
                  <div>
                    <div className={`text-sm sm:text-base font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{testimonial.author}</div>
                    <div className={`text-[9px] sm:text-[10px] uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>{testimonial.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats - Minimalist */}
      <section className="relative z-10 py-24 sm:py-48 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-16">
          {[
            { label: "Deployments", value: "1.2k" },
            { label: "Partners", value: "500+" },
            { label: "Retention", value: "99%" },
            { label: "Accolades", value: "24" },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="text-center group"
            >
              <div className={`font-display text-4xl sm:text-6xl md:text-9xl mb-2 sm:mb-4 transition-all duration-500 group-hover:scale-110 group-hover:text-indigo-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stat.value}</div>
              <div className={`font-heading text-[8px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.4em] font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-500'}`}>{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};
