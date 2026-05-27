import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchFeaturedGallery, fetchApprovedTestimonials } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { curateShowcaseProjects, resolveProjectShowcaseImage } from "../lib/gallery-showcase";
import { mediaSrc } from "../lib/media-url";
import { Star, Quote, Rocket, ExternalLink, ArrowRight, CheckCircle, Users, Briefcase, Award, Search } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import PageHero from "../components/PageHero";
import LazyMarkdown from "../components/LazyMarkdown";
import { useTheme } from "../contexts/ThemeContext";
import { Project, Testimonial } from "../types";
import { useSmartNavigate } from "../hooks/useSmartNavigate";
import { useOverlayBackHandler } from "../hooks/useOverlayBackHandler";
import { SHOWCASE_CARD_DURATION, SHOWCASE_CARD_STAGGER, SHOWCASE_EASE } from "../lib/showcase-motion";

const stripMarkdown = (text: string) => {
  return text
    .replace(/[#*`_~]/g, '') // Basic markdown chars
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/\n/g, ' ') // Newlines
    .trim();
};

const TiltCard: React.FC<{ children: React.ReactNode; className: string; onClick?: () => void }> = ({ children, className, onClick }) => {
  return (
    <div
      className={`${className} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
};

export const PublicGallery: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const smartNavigate = useSmartNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");

  const categories = ["ALL", "Website", "E-commerce", "Portfolio", "Web Application", "Mobile App", "Desktop Software", "AI / Machine Learning", "Blockchain / Web3", "Cloud Infrastructure", "Cybersecurity", "Other"];

  const handleCTA = () => {
    if (user) {
      smartNavigate("/submit-project", { asSectionSwitch: true });
    } else {
      smartNavigate("/register", { asSectionSwitch: true });
    }
  };

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const { closeWithBack: closeSelectedProject } = useOverlayBackHandler(
    !!selectedProject,
    () => setSelectedProject(null),
    "gallery-project-modal"
  );

  const lightboxSlides = useMemo(() => {
    if (!selectedProject) return [] as Array<{ src: string }>;
    const imageFiles = (selectedProject.files || []).filter((f) => f.mimeType?.startsWith("image/"));
    if (!imageFiles.length) {
      return [{ src: resolveProjectShowcaseImage(selectedProject) }];
    }
    return imageFiles.map((file) => ({ src: mediaSrc(file.path, resolveProjectShowcaseImage(selectedProject)) }));
  }, [selectedProject]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [p, t] = await Promise.all([fetchFeaturedGallery(), fetchApprovedTestimonials()]);
        setProjects(Array.isArray(p) ? p : []);
        setTestimonials(Array.isArray(t) ? t : []);
      } catch (err) {
        console.error("Failed to fetch public data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showcaseProjects = useMemo(() => curateShowcaseProjects(projects, 8), [projects]);
  const featuredProjects = showcaseProjects.filter((p) => p.featured);
  const spotlightProject = featuredProjects[0] || showcaseProjects[0];

  const filteredProjects = activeCategory === "ALL"
    ? showcaseProjects
    : showcaseProjects.filter((p) => p.category === activeCategory);

  if (loading) return (
    <div className="page-shell-flex h-screen">
      <div className="relative">
        <div className="animate-spin h-16 w-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <Rocket className="h-6 w-6 text-indigo-500 animate-pulse" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <PageHero 
        title={`Digital<br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${theme === 'light' ? '#0f172a' : 'white'}'>Masterpieces</span>`}
        subtitle="A curated showcase of our most ambitious projects, technical breakthroughs, and creative experiments."
        details="From full-stack web applications to mobile solutions, discover how we transform ideas into industry-leading digital products that drive real business impact."
        category="The Exhibition"
      />

      <div className="relative z-10 pb-24 px-4 space-y-32">

        {/* Featured Spotlight */}
        {spotlightProject && activeCategory === "ALL" && (
          <section className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`relative aspect-[21/9] w-full overflow-hidden rounded-[3rem] border transition-all duration-700 group cursor-pointer ${theme === 'light' ? 'bg-white border-slate-200 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)]' : 'bg-slate-950/70 border-white/12 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)]'}`}
              onClick={() => setSelectedProject(spotlightProject)}
            >
              {/* Spotlight Background */}
              <div className="absolute inset-0">
                <img
                  src={resolveProjectShowcaseImage(spotlightProject)}
                  alt={spotlightProject.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  className={`w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-110 ${theme === 'light' ? 'opacity-90' : 'opacity-60'}`}
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'light' ? 'bg-gradient-to-r from-white via-white/60 to-transparent' : 'bg-gradient-to-r from-[#050505] via-[#050505]/60 to-transparent'}`} />
                <div className={`absolute inset-0 transition-colors duration-700 ${theme === 'light' ? 'bg-gradient-to-t from-white via-transparent to-transparent' : 'bg-gradient-to-t from-[#050505] via-transparent to-transparent'}`} />
                <div className="absolute inset-0 bg-indigo-500/5 mix-blend-overlay group-hover:bg-indigo-500/10 transition-colors duration-700" />
              </div>

              {/* Spotlight Content */}
              <div className="absolute inset-0 p-12 md:p-24 flex flex-col justify-center max-w-4xl space-y-10">
                <div className="flex items-center space-x-6">
                  <motion.span 
                    initial={{ x: -20, opacity: 0 }}
                    whileInView={{ x: 0, opacity: 1 }}
                    className="px-6 py-2.5 bg-indigo-500 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.4em] shadow-[0_0_40px_rgba(99,102,241,0.6)]"
                  >
                    Featured Spotlight
                  </motion.span>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.4em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/75'}`}>
                    {spotlightProject.category.replace("_", " ")}
                  </span>
                </div>
                
                <h2 className={`font-display text-7xl md:text-[10vw] uppercase tracking-tighter leading-[0.85] transition-all duration-700 group-hover:tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                  {spotlightProject.title}
                </h2>
                
                <div className={`font-sans text-xl md:text-2xl font-light leading-relaxed line-clamp-2 max-w-2xl transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-gray-400'}`}>
                  {stripMarkdown(spotlightProject.description)}
                </div>

                <div className="flex items-center space-x-12 pt-10">
                  <div className="flex items-center space-x-5">
                    <div className={`h-16 w-16 rounded-3xl border flex items-center justify-center font-bold text-xl transition-all duration-500 group-hover:rotate-6 ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-900' : 'bg-white/10 border-white/10 text-white'}`}>
                      {(spotlightProject.user?.name || "?").charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-[12px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{spotlightProject.user?.name ?? "Creator"}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-300'}`}>Lead Architect</span>
                    </div>
                  </div>
                  <div className={`h-16 w-[1px] transition-colors duration-500 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
                  <motion.div 
                    whileHover={{ x: 10 }}
                    className={`flex items-center space-x-6 transition-all duration-500 ${theme === 'light' ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-400'}`}
                  >
                    <span className="text-[12px] font-bold uppercase tracking-[0.4em]">Explore Archive</span>
                    <ArrowRight className="h-6 w-6" />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Category Filter */}
        <section className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-6 mb-20">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 border relative overflow-hidden group ${
                  activeCategory === cat
                  ? theme === 'light' ? "bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-200" : "bg-white text-black border-white shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                  : theme === 'light' ? "bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-900" : "bg-slate-950/70 text-white/82 border-white/15 hover:border-white/35 hover:text-white"
                }`}
              >
                <span className="relative z-10">{cat.replace("_", " ")}</span>
                {activeCategory === cat && (
                  <motion.div 
                    layoutId="activeFilter"
                    className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
            {filteredProjects.map((project, i) => {
              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 60 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * SHOWCASE_CARD_STAGGER, duration: SHOWCASE_CARD_DURATION, ease: SHOWCASE_EASE }}
                >
                  <TiltCard
                    className={`group showcase-interactive relative overflow-hidden border rounded-[3rem] p-5 cursor-pointer transition-all duration-700 hover:-translate-y-1 ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/40 hover:shadow-xl hover:shadow-indigo-100/60' : 'bg-slate-950/70 border-white/10 hover:border-white/22'}`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className={`aspect-[16/10] relative overflow-hidden rounded-[2.5rem] ${theme === 'light' ? 'bg-slate-100' : 'bg-[#0a0a0a]'}`}>
                      {/* High-end Image Display */}
                      <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110">
                        <img
                          src={resolveProjectShowcaseImage(project)}
                          alt={project.title}
                          loading="lazy"
                          decoding="async"
                          fetchPriority="low"
                          className={`w-full h-full object-cover transition-opacity duration-1000 ${theme === 'light' ? 'opacity-90 group-hover:opacity-100' : 'opacity-70 group-hover:opacity-95'}`}
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t transition-colors duration-700 ${theme === 'light' ? 'from-white via-white/10 to-transparent opacity-90' : 'from-[#050505] via-transparent to-transparent opacity-90'}`} />
                        <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      </div>
                      
                      <div className="absolute top-8 left-8 flex items-center space-x-4">
                        <span className={`px-5 py-2 backdrop-blur-2xl border rounded-full text-[10px] font-bold uppercase tracking-[0.3em] transition-all duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-200 text-slate-900' : 'bg-black/60 border-white/10 text-white'}`}>
                          {project.category}
                        </span>
                        {project.featured && (
                          <span className="px-5 py-2 bg-indigo-500 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                            Featured
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-8 right-8 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-700">
                        <div className={`flex items-center space-x-6 px-8 py-4 rounded-full font-bold text-[11px] uppercase tracking-[0.3em] transition-all duration-500 shadow-2xl ${theme === 'light' ? 'bg-slate-900 text-white' : 'bg-white text-black'}`}>
                          <span>View Archive</span>
                          <ArrowRight className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="p-10 space-y-8">
                      <div className="space-y-6">
                        <div className="flex justify-between items-start">
                          <h3 className={`font-display text-5xl uppercase tracking-tighter group-hover:text-indigo-500 transition-all duration-500 leading-none ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {project.title}
                          </h3>
                          {project.repoUrl && (
                            <motion.a
                              href={project.repoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              whileHover={{ rotate: 45 }}
                              onClick={(e) => e.stopPropagation()}
                              className={`p-4 rounded-2xl border transition-all duration-500 ${theme === 'light' ? 'bg-slate-50 text-slate-900 border-slate-200' : 'bg-white/5 text-white border-white/10'}`}
                              title="Open repository"
                            >
                              <ExternalLink className="h-5 w-5" />
                            </motion.a>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {(project.tags || []).map((tag: string) => (
                            <span key={tag} className={`text-[10px] font-bold uppercase tracking-[0.2em] border px-3 py-1 rounded-lg transition-all duration-500 ${theme === 'light' ? 'text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:bg-indigo-100' : 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10'}`}>
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <p className={`font-sans text-lg font-light leading-relaxed line-clamp-3 transition-colors duration-500 ${theme === 'light' ? 'text-slate-600' : 'text-gray-300'}`}>
                        {stripMarkdown(project.description)}
                      </p>

                      <div className={`pt-10 flex items-center justify-between border-t transition-colors duration-700 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                        <div className="flex items-center space-x-4">
                          <div className={`h-14 w-14 rounded-2xl border flex items-center justify-center text-lg font-bold group-hover:bg-indigo-500 group-hover:border-indigo-500 group-hover:text-white transition-all duration-700 ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-white/5 border-white/10 text-white'}`}>
                            {(project.user?.name || "?").charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-[11px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.user?.name ?? "Creator"}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-300'}`}>Lead Architect</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-10">
                          <div className="flex flex-col items-end">
                            <span className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-300'}`}>Estimated Budget</span>
                            <span className={`text-sm font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.budget}</span>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-gray-300'}`}>Target Timeline</span>
                            <span className={`text-sm font-bold transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.timeline}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-32 space-y-6">
              <div className={`inline-flex p-6 rounded-full border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <Search className={`h-8 w-8 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
              </div>
              <p className={`font-heading text-xl transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/75'}`}>No projects found in this category yet.</p>
            </div>
          )}
        </section>

        {/* Testimonials - Immersive */}
        <section className="relative py-48">
          <div className={`absolute inset-0 mask-radial pointer-events-none transition-colors duration-700 ${theme === 'light' ? 'bg-indigo-600/5' : 'bg-indigo-600/5'}`} />
          <div className="relative max-w-7xl mx-auto px-4 space-y-32">
            <div className="text-center space-y-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="text-indigo-500 text-[11px] font-bold uppercase tracking-[0.5em]"
              >
                The Testimonials
              </motion.div>
              <h2 className={`font-display text-7xl md:text-9xl uppercase tracking-tighter transition-colors duration-700 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                Client <span className={`italic text-transparent transition-all duration-700`} style={{ WebkitTextStroke: theme === 'light' ? "1px #0f172a" : "1px white" }}>Voices</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.8 }}
                  className={`group backdrop-blur-3xl border p-14 rounded-[3rem] space-y-12 hover:border-indigo-500/40 transition-all duration-700 relative overflow-hidden ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/40' : 'bg-white/2 border-white/5'}`}
                >
                  <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
                  </div>

                  <div className="flex space-x-1.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < t.rating ? "text-indigo-500 fill-current" : theme === 'light' ? "text-slate-200" : "text-white/10"}`} />
                    ))}
                  </div>
                  <div className="relative">
                    <Quote className={`absolute -top-12 -left-12 h-24 w-24 transition-all duration-700 ${theme === 'light' ? 'text-slate-100 group-hover:text-indigo-500/10' : 'text-white/5 group-hover:text-indigo-500/10'}`} />
                    <p className={`font-serif text-3xl italic leading-relaxed relative z-10 transition-colors duration-700 ${theme === 'light' ? 'text-slate-700' : 'text-gray-300'}`}>
                      "{t.text}"
                    </p>
                  </div>
                  <div className={`flex items-center space-x-5 pt-12 border-t transition-colors duration-700 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                    <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-2xl transition-transform duration-500 group-hover:scale-110">
                      {(t.user?.name || "?").charAt(0)}
                    </div>
                    <div>
                      <div className={`text-[12px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.user?.name ?? "Client"}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500 mt-2">{t.project?.title ?? "Project"}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Bold */}
        <section className={`text-center space-y-24 py-48 px-4 border-t transition-colors duration-700 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
          <div className="space-y-10">
            <h2 className={`font-display text-8xl md:text-[14vw] uppercase tracking-tighter leading-[0.8] transition-all duration-700 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Start Your<br />
              <span className={`text-transparent italic transition-all duration-700`} style={{ WebkitTextStroke: theme === 'light' ? "1px #0f172a" : "1px white" }}>Legacy</span>
            </h2>
            <p className={`font-heading text-2xl max-w-2xl mx-auto transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-gray-500'}`}>
              Ready to build something that matters? Let's turn your vision into a digital masterpiece.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-12">
            <motion.button 
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className={`px-20 py-10 font-bold uppercase tracking-[0.4em] text-[11px] transition-all duration-700 shadow-2xl ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'}`}
            >
              {user ? "Submit Project" : "Initiate Contact"}
            </motion.button>
            <motion.div whileHover={{ scale: 1.05, y: -5 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={user ? "/dashboard" : "/login"}
                replace
                onClick={(e) => {
                  e.preventDefault();
                  smartNavigate(user ? "/dashboard" : "/login", { asSectionSwitch: true });
                }}
                className={`inline-block px-20 py-10 border font-bold uppercase tracking-[0.4em] text-[11px] transition-all duration-700 ${theme === 'light' ? 'border-slate-200 text-slate-900 hover:bg-slate-900 hover:text-white' : 'border-white/20 text-white hover:bg-white hover:text-black'}`}
              >
                {user ? "Access Terminal" : "Sign In"}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Project Details Modal */}
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] border shadow-2xl ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'
                }`}
              >
                {/* Close Button */}
                <button 
                  onClick={closeSelectedProject}
                  className={`absolute top-8 right-8 p-4 rounded-full z-20 transition-all ${
                    theme === 'light' ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' : 'bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  <Rocket className="h-6 w-6 rotate-45" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Image Section */}
                  <div className="relative aspect-square lg:aspect-auto bg-slate-900 overflow-hidden">
                    <img
                      src={resolveProjectShowcaseImage(selectedProject)}
                      alt={selectedProject.title}
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="absolute top-8 left-8 z-20 px-5 py-2 rounded-full bg-black/50 text-white border border-white/20 backdrop-blur-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black/70 transition-colors"
                    >
                      Open Lightbox
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-12 left-12 right-12 space-y-4">
                      <div className="flex items-center space-x-4">
                        <span className="px-4 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-widest">
                          {selectedProject.category}
                        </span>
                        {selectedProject.featured && (
                          <span className="px-4 py-1 rounded-full bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest flex items-center">
                            <Star className="h-3 w-3 mr-2 fill-current" />
                            Featured
                          </span>
                        )}
                      </div>
                      <h2 className="text-4xl md:text-6xl font-display text-white uppercase tracking-tighter leading-none">
                        {selectedProject.title}
                      </h2>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-12 md:p-20 space-y-12">
                    <div className="space-y-8">
                      <div className="flex items-center space-x-6">
                        <div className="h-16 w-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-2xl">
                          {(selectedProject.user?.name || "?").charAt(0)}
                        </div>
                        <div>
                          <div className={`text-[12px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {selectedProject.user?.name ?? "Creator"}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-500 mt-2">
                            Project Architect
                          </div>
                        </div>
                      </div>

                      <div className={`prose prose-lg max-w-none font-serif italic ${
                        theme === 'light' ? 'text-slate-600 prose-slate' : 'text-gray-400 prose-invert'
                      }`}>
                        <LazyMarkdown>{selectedProject.description}</LazyMarkdown>
                      </div>
                    </div>

                    <div className="pt-12 border-t border-white/5 flex flex-col sm:flex-row gap-6">
                      {selectedProject.repoUrl && (
                        <motion.a
                          href={selectedProject.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex-1 px-10 py-6 text-center font-bold uppercase tracking-[0.3em] text-[10px] transition-all ${
                            theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'
                          }`}
                        >
                          View Repository
                        </motion.a>
                      )}
                      <motion.button
                        onClick={closeSelectedProject}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 px-10 py-6 border text-center font-bold uppercase tracking-[0.3em] text-[10px] transition-all ${
                          theme === 'light' ? 'border-slate-200 text-slate-900 hover:bg-slate-50' : 'border-white/10 text-white hover:bg-white/5'
                        }`}
                      >
                        Close Gallery
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={lightboxSlides}
          carousel={{ finite: true }}
          controller={{ closeOnBackdropClick: true }}
          render={{
            buttonPrev: lightboxSlides.length > 1 ? undefined : () => null,
            buttonNext: lightboxSlides.length > 1 ? undefined : () => null,
          }}
        />
      </div>
    </div>
  );
};
