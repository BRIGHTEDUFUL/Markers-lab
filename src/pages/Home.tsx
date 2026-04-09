import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowRight, ArrowUpRight, Zap, Shield, Globe, Star, Quote } from "lucide-react";
import { motion } from "motion/react";
import { fetchFeaturedGallery } from "../lib/makers-data";
import { useTheme } from "../contexts/ThemeContext";
import { mediaSrc } from "../lib/media-url";
import { Project } from "../types";
import StarField from "../components/StarField";

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = "",
}) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const Home = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedGallery()
      .then((d) => setFeaturedProjects(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative">

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-screen min-h-[100dvh] px-4 pt-20 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className={`absolute inset-0 mask-radial opacity-[0.08] ${isDark ? "bg-grid-white" : "bg-grid-slate-900"}`} />
          <div className={`absolute inset-0 ${isDark ? "bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,transparent_25%,rgba(3,3,3,0.5)_100%)]" : "bg-[radial-gradient(ellipse_70%_55%_at_50%_45%,transparent_25%,rgba(248,250,252,0.55)_100%)]"}`} />
        </div>
        <StarField count={55} theme={theme} salt={1000} />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 mb-8">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-md text-[10px] font-bold uppercase tracking-[0.25em] transition-colors duration-500 ${isDark ? "border-white/10 bg-white/5 text-indigo-400" : "border-indigo-200 bg-white/60 text-indigo-600"}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Maker's Lab
          </span>
        </motion.div>
        <div className="relative z-10 mb-10 w-full max-w-6xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, scale: 0.92, filter: "blur(18px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
            className={`font-display text-[17vw] sm:text-[14vw] md:text-[12vw] lg:text-[10vw] leading-[0.84] uppercase tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}
          >
            <motion.span animate={{ rotate: [-1.5, 1.5] }} transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }} style={{ originX: 0.5, originY: 0, display: "inline-block" }} className={`bg-clip-text text-transparent ${isDark ? "bg-gradient-to-b from-white via-white to-white/40" : "bg-gradient-to-b from-slate-900 via-slate-900 to-slate-900/40"}`}>
              Websites
            </motion.span>
            <br />
            <span className="text-transparent" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.35)" : "1.5px rgba(15,23,42,0.3)" }}>Web Apps</span>
            <br />
            <motion.span animate={{ scaleX: [1, 1.06, 0.96, 1.03, 0.99, 1], scaleY: [1, 0.96, 1.06, 0.97, 1.01, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 4, ease: "easeInOut" }} style={{ display: "inline-block", willChange: "transform" }} className={`bg-clip-text text-transparent ${isDark ? "bg-gradient-to-t from-white/40 via-white to-white" : "bg-gradient-to-t from-slate-900/40 via-slate-900 to-slate-900"}`}>
              &amp; More
            </motion.span>
          </motion.h1>
          <motion.div initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay: 0.8, duration: 1.8, ease: "circOut" }} className="mt-6 mx-auto h-px w-48 bg-gradient-to-r from-transparent via-indigo-500 to-transparent shadow-[0_0_16px_rgba(99,102,241,0.6)]" />
        </div>
        <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }} className={`relative z-10 max-w-xl font-heading text-lg md:text-xl font-light leading-relaxed mb-12 ${isDark ? "text-white/70" : "text-slate-600"}`}>
          Where <span className="text-indigo-500 font-semibold italic">ideas</span> merge with <span className="text-purple-500 font-semibold italic">execution</span>.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }} className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
          <Link to={user ? "/submit-project" : "/register"} className={`group relative flex items-center gap-3 px-8 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] overflow-hidden shadow-2xl transition-all duration-300 active:scale-95 ${isDark ? "bg-white text-black shadow-white/10" : "bg-slate-900 text-white shadow-slate-900/20"}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />
            <span className="relative z-10 group-hover:text-white transition-colors duration-300">{user ? "Start Project" : "Join Maker's Lab"}</span>
            <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
          </Link>
          <Link to="/gallery" className={`flex items-center gap-2 px-8 py-4 rounded-full border font-bold uppercase tracking-[0.2em] text-[11px] transition-all duration-300 active:scale-95 ${isDark ? "border-white/20 text-white hover:border-white/50 hover:bg-white/5" : "border-slate-300 text-slate-700 hover:border-slate-900 hover:bg-slate-50"}`}>
            View Archive <ArrowUpRight className="h-4 w-4" />
          </Link>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} className={`w-5 h-8 rounded-full border-2 flex items-start justify-center pt-1.5 ${isDark ? "border-white/20" : "border-slate-300"}`}>
            <div className={`w-1 h-2 rounded-full ${isDark ? "bg-white/40" : "bg-slate-400"}`} />
          </motion.div>
        </motion.div>
      </section>

      {/* MARQUEE */}
      <section className={`relative z-10 py-5 border-y overflow-hidden transition-colors duration-500 ${isDark ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-slate-100/40"}`}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(12)].map((_, i) => (
            <span key={i} className={`mx-10 font-display text-sm uppercase tracking-[0.3em] ${isDark ? "text-white/15" : "text-slate-900/10"}`}>
              Websites &nbsp;·&nbsp; Web Apps &nbsp;·&nbsp; Digital Experiences &nbsp;·&nbsp; Innovation &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </section>

      {/* SERVICES */}
      <section className="relative z-10 py-24 sm:py-36 px-4">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16 sm:mb-20">
            <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">What We Build</p>
            <h2 className={`font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-tighter leading-[0.9] ${isDark ? "text-white" : "text-slate-900"}`}>
              Our <span className="text-transparent italic" style={{ WebkitTextStroke: isDark ? "1px rgba(255,255,255,0.4)" : "1px rgba(15,23,42,0.35)" }}>Craft</span>
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {([
              { icon: Globe, number: "01", title: "Bespoke Websites", desc: "Digital experiences that tell your brand's story with uncompromising precision and elite motion design.", accent: "from-indigo-500/20 to-indigo-500/0", iconColor: "text-indigo-400", iconBg: isDark ? "bg-indigo-500/10 border-indigo-500/20" : "bg-indigo-50 border-indigo-100" },
              { icon: Zap, number: "02", title: "High-End Web Apps", desc: "Scalable, high-performance applications built with cutting-edge tech stacks and fluid UX.", accent: "from-purple-500/20 to-purple-500/0", iconColor: "text-purple-400", iconBg: isDark ? "bg-purple-500/10 border-purple-500/20" : "bg-purple-50 border-purple-100" },
              { icon: Shield, number: "03", title: "Beyond Limits", desc: "From immersive 3D environments to custom digital tools — we build beyond the traditional browser.", accent: "from-blue-500/20 to-blue-500/0", iconColor: "text-blue-400", iconBg: isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-100" },
            ] as const).map((s, i) => (
              <FadeUp key={i} delay={i * 0.12}>
                <div className={`group relative h-full p-8 sm:p-10 rounded-3xl border overflow-hidden transition-all duration-500 hover:-translate-y-1 ${isDark ? "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/60"}`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${s.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <span className={`absolute top-6 right-8 font-display text-6xl font-bold leading-none select-none ${isDark ? "text-white/5" : "text-slate-900/5"}`}>{s.number}</span>
                  <div className={`relative z-10 inline-flex p-3 rounded-2xl border mb-8 transition-all duration-500 group-hover:scale-110 ${s.iconBg}`}>
                    <s.icon className={`h-6 w-6 ${s.iconColor}`} />
                  </div>
                  <h3 className={`relative z-10 font-heading text-xl sm:text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-slate-900"}`}>{s.title}</h3>
                  <p className={`relative z-10 text-sm sm:text-base leading-relaxed font-light ${isDark ? "text-white/50" : "text-slate-500"}`}>{s.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS */}
      <section className={`relative z-10 py-24 sm:py-36 px-4 border-t transition-colors duration-500 ${isDark ? "border-white/5" : "border-slate-200"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14 sm:mb-20">
            <FadeUp>
              <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-3">The Portfolio</p>
              <h2 className={`font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-tighter leading-[0.9] ${isDark ? "text-white" : "text-slate-900"}`}>
                Selected<br />
                <span className="text-transparent italic" style={{ WebkitTextStroke: isDark ? "1px rgba(255,255,255,0.4)" : "1px rgba(15,23,42,0.35)" }}>Creations</span>
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <Link to="/gallery" className={`group inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-300 ${isDark ? "text-white/50 hover:text-white" : "text-slate-500 hover:text-slate-900"}`}>
                <span>Full Archive</span>
                <span className={`h-px w-10 transition-all duration-300 group-hover:w-16 ${isDark ? "bg-white/30 group-hover:bg-white" : "bg-slate-400 group-hover:bg-slate-900"}`} />
                <ArrowRight className="h-4 w-4" />
              </Link>
            </FadeUp>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className={`aspect-[4/3] rounded-3xl animate-pulse ${isDark ? "bg-white/5" : "bg-slate-200"}`} />
              ))}
            </div>
          ) : featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project, i) => {
                const coverImage = project.files?.find((f) => f.mimeType?.startsWith("image/"));
                const imageUrl = mediaSrc(coverImage?.path, `https://picsum.photos/seed/${project.id}/800/600`);
                return (
                  <FadeUp key={project.id} delay={i * 0.1}>
                    <div className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${isDark ? "border-white/[0.08] hover:border-white/20" : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50"}`}>
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={imageUrl} alt={project.title} loading={i === 0 ? "eager" : "lazy"} decoding="async" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      </div>
                      <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? "from-black/80 via-black/20 to-transparent" : "from-white/90 via-white/20 to-transparent"}`} />
                      <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-indigo-400 mb-2 block">{project.category}</span>
                        <h3 className={`font-display text-2xl sm:text-3xl uppercase tracking-tight leading-none ${isDark ? "text-white" : "text-slate-900"}`}>{project.title}</h3>
                        {project.repoUrl && (
                          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-colors opacity-0 group-hover:opacity-100">
                            View Project <ArrowUpRight className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </FadeUp>
                );
              })}
            </div>
          ) : (
            <div className={`py-24 text-center rounded-3xl border border-dashed ${isDark ? "border-white/10" : "border-slate-200"}`}>
              <p className={`text-xs uppercase tracking-widest ${isDark ? "text-white/30" : "text-slate-400"}`}>No featured projects yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* STATS */}
      <section className={`relative z-10 py-20 sm:py-28 px-4 border-t transition-colors duration-500 ${isDark ? "border-white/5 bg-white/[0.015]" : "border-slate-200 bg-slate-50/60"}`}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          {[
            { value: "1.2k", label: "Deployments" },
            { value: "500+", label: "Partners" },
            { value: "99%", label: "Retention" },
            { value: "24", label: "Accolades" },
          ].map((stat, i) => (
            <FadeUp key={i} delay={i * 0.08} className="text-center">
              <div className={`font-display text-5xl sm:text-6xl md:text-7xl mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>{stat.value}</div>
              <div className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.35em] ${isDark ? "text-white/30" : "text-slate-400"}`}>{stat.label}</div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className={`relative z-10 py-24 sm:py-36 px-4 border-t overflow-hidden transition-colors duration-500 ${isDark ? "border-white/5" : "border-slate-200"}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="text-center mb-16 sm:mb-20">
            <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">Client Stories</p>
            <h2 className={`font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-tighter leading-[0.9] ${isDark ? "text-white" : "text-slate-900"}`}>
              Trusted by <span className="text-transparent italic" style={{ WebkitTextStroke: isDark ? "1px rgba(255,255,255,0.4)" : "1px rgba(15,23,42,0.35)" }}>Visionaries</span>
            </h2>
          </FadeUp>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {([
              { quote: "Maker's Lab transformed our vision into a digital masterpiece. Their attention to detail and elite motion design is unparalleled.", author: "Julian Sterling", role: "CEO, Nexus AI", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" },
              { quote: "The most professional and creative team we've ever worked with. They don't just build apps; they build experiences.", author: "Aria Chen", role: "Founder, Quantum Labs", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200" },
              { quote: "Uncompromising precision and elite execution. Maker's Lab is the gold standard for high-end web development.", author: "Dorian Thorne", role: "Design Director, Stellar", img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200" },
            ] as const).map((t, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className={`group relative h-full p-7 sm:p-9 rounded-3xl border transition-all duration-500 hover:-translate-y-1 ${isDark ? "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]" : "bg-white border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl hover:shadow-slate-200/50"}`}>
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, s) => (
                      <Star key={s} className="h-3.5 w-3.5 fill-indigo-500 text-indigo-500" />
                    ))}
                  </div>
                  <Quote className={`h-7 w-7 mb-4 opacity-15 ${isDark ? "text-white" : "text-slate-900"}`} />
                  <p className={`text-base sm:text-lg font-light leading-relaxed italic mb-8 ${isDark ? "text-white/70" : "text-slate-600"}`}>{t.quote}</p>
                  <div className="flex items-center gap-4">
                    <img src={t.img} alt={t.author} loading="lazy" decoding="async" referrerPolicy="no-referrer" className={`h-11 w-11 rounded-full object-cover border-2 transition-all duration-500 group-hover:border-indigo-500 ${isDark ? "border-white/20" : "border-slate-200"}`} />
                    <div>
                      <div className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}>{t.author}</div>
                      <div className={`text-[10px] uppercase tracking-[0.2em] ${isDark ? "text-white/35" : "text-slate-400"}`}>{t.role}</div>
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={`relative z-10 py-24 sm:py-36 px-4 border-t overflow-hidden transition-colors duration-500 ${isDark ? "border-white/5" : "border-slate-200"}`}>
        <div className="absolute inset-0 pointer-events-none">
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full blur-[120px] ${isDark ? "bg-indigo-600/15" : "bg-indigo-400/10"}`} />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <FadeUp>
            <h2 className={`font-display text-6xl sm:text-8xl md:text-[10vw] uppercase tracking-tighter leading-[0.85] mb-8 ${isDark ? "text-white" : "text-slate-900"}`}>
              Start Your<br />
              <span className="text-transparent italic" style={{ WebkitTextStroke: isDark ? "1.5px rgba(255,255,255,0.35)" : "1.5px rgba(15,23,42,0.3)" }}>Legacy</span>
            </h2>
            <p className={`text-lg sm:text-xl font-light max-w-xl mx-auto mb-12 ${isDark ? "text-white/50" : "text-slate-500"}`}>
              Ready to build something that matters? Let's turn your vision into a digital masterpiece.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to={user ? "/submit-project" : "/register"} className={`group relative flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] overflow-hidden shadow-2xl transition-all duration-300 active:scale-95 ${isDark ? "bg-white text-black" : "bg-slate-900 text-white"}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">{user ? "Submit Project" : "Get Started"}</span>
                <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
              </Link>
              <Link to="/gallery" className={`flex items-center gap-2 px-10 py-5 rounded-full border font-bold uppercase tracking-[0.2em] text-[11px] transition-all duration-300 active:scale-95 ${isDark ? "border-white/20 text-white hover:border-white/50 hover:bg-white/5" : "border-slate-300 text-slate-700 hover:border-slate-900 hover:bg-slate-50"}`}>
                View Gallery
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

    </div>
  );
};
