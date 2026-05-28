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
        title={`Digital<br /><span class="text-gradient">Masterpieces</span>`}
        subtitle="A curated showcase of our most ambitious projects, technical breakthroughs, and creative experiments."
        details="From full-stack web applications to mobile solutions, discover how we transform ideas into industry-leading digital products that drive real business impact."
        category="The Exhibition"
      />

      <div className="relative z-10 pb-24 px-4 sm:px-12 space-y-32">

        {/* Featured Spotlight */}
        {spotlightProject && activeCategory === "ALL" && (
          <section className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative aspect-[21/9] w-full overflow-hidden rounded-[3rem] border border-outline-variant/10 bg-surface-container-low/30 shadow-2xl transition-all duration-1000 group cursor-pointer"
              onClick={() => setSelectedProject(spotlightProject)}
            >
              {/* Spotlight Background */}
              <div className="absolute inset-0">
                <img
                  src={resolveProjectShowcaseImage(spotlightProject)}
                  alt={spotlightProject.title}
                  className="w-full h-full object-cover transition-transform duration-[3s] group-hover:scale-105 opacity-40 group-hover:opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              </div>

              {/* Spotlight Content */}
              <div className="absolute inset-0 p-12 md:p-20 flex flex-col justify-center max-w-4xl space-y-6">
                <div className="flex items-center gap-4">
                  <span className="px-6 py-2.5 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-[0.4em] shadow-lg shadow-primary/20">
                    Featured Spotlight
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-on-surface-variant">
                    {spotlightProject.category.toUpperCase()}
                  </span>
                </div>
                
                <h2 className="font-headline-xl text-headline-xl text-on-surface uppercase tracking-tighter leading-[0.9]">
                  {spotlightProject.title}
                </h2>
                
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed line-clamp-2 max-w-2xl">
                  {stripMarkdown(spotlightProject.description)}
                </p>

                <div className="flex items-center gap-12 pt-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl border border-outline-variant/10 bg-foreground/5 flex items-center justify-center font-bold text-xl text-primary">
                      {(spotlightProject.user?.name || "?").charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold uppercase tracking-[0.3em] text-on-surface">{spotlightProject.user?.name ?? "Creator"}</span>
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant opacity-60">Lead Architect</span>
                    </div>
                  </div>
                  <div className="h-14 w-[1px] bg-outline-variant/20" />
                  <div className="flex items-center gap-4 text-primary group-hover:translate-x-2 transition-transform duration-500">
                    <span className="text-[12px] font-bold uppercase tracking-[0.4em]">Explore Archive</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </section>
        )}

        {/* Category Filter */}
        <section className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4 mb-20">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-8 py-3 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-500 border relative overflow-hidden group ${
                  activeCategory === cat
                  ? "bg-primary text-on-primary border-primary shadow-xl shadow-primary/20"
                  : "bg-foreground/5 text-on-surface-variant border-outline-variant/10 hover:border-outline-variant/30 hover:text-on-surface"
                }`}
              >
                <span className="relative z-10">{cat.replace("_", " ")}</span>
              </button>
            ))}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className="group glass-card rounded-[2.5rem] overflow-hidden transition-all duration-1000 relative h-[520px] cursor-pointer"
                    onClick={() => setSelectedProject(project)}
                  >
                    <img
                      src={resolveProjectShowcaseImage(project)}
                      alt={project.title}
                      className="absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2000ms] ease-out opacity-40 group-hover:opacity-75"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-12 w-full">
                      <span className="font-label-sm text-label-sm text-primary mb-4 block tracking-[0.2em] uppercase">
                        {project.category}
                      </span>
                      <h3 className="font-headline-lg text-headline-lg text-on-surface uppercase tracking-tight leading-none mb-6">
                        {project.title}
                      </h3>
                      <div className="flex justify-between items-end">
                        <p className="font-body-md text-on-surface-variant opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100 line-clamp-2 max-w-lg">
                          {stripMarkdown(project.description)}
                        </p>
                        <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500 group-hover:rotate-45 flex-shrink-0">
                          <span className="material-symbols-outlined text-on-surface group-hover:text-on-primary">arrow_outward</span>
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
              <div className="inline-flex p-6 rounded-full border border-outline-variant/10 bg-foreground/5">
                <Search className="h-8 w-8 text-on-surface-variant/30" />
              </div>
              <p className="font-headline-md text-headline-md text-on-surface-variant/65">No projects found in this category yet.</p>
            </div>
          )}
        </section>

        {/* Testimonials - Immersive */}
        <section className="relative py-32 border-t border-outline-variant/10">
          <div className="relative max-w-7xl mx-auto px-4 space-y-24">
            <div className="text-center space-y-4">
              <div className="text-primary text-[11px] font-bold uppercase tracking-[0.5em]">
                The Testimonials
              </div>
              <h2 className="font-headline-lg text-headline-lg uppercase tracking-tighter text-on-surface">
                Client <span className="text-gradient">Voices</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.8 }}
                  className="glass-card p-10 rounded-[2.5rem] border border-outline-variant/10 flex flex-col justify-between hover:border-primary/20 transition-all duration-500"
                >
                  <div>
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, s) => (
                        <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed italic mb-8">
                      "{t.text}"
                    </p>
                  </div>
                  <div className="flex items-center gap-4 border-t border-outline-variant/10 pt-6">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {(t.user?.name || "?").charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface uppercase">{t.user?.name ?? "Client"}</div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mt-1">{t.project?.title ?? "Project"}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section - Bold */}
        <section className="text-center space-y-16 py-32 px-4 border-t border-outline-variant/10">
          <div className="space-y-6">
            <h2 className="font-headline-lg text-headline-lg uppercase tracking-tighter text-on-surface">
              Start Your <span className="text-gradient">Legacy</span>
            </h2>
            <p className="font-body-lg text-body-lg max-w-2xl mx-auto text-on-surface-variant opacity-70">
              Ready to build something that matters? Let's turn your vision into a digital masterpiece.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="px-12 py-5 font-bold uppercase tracking-[0.4em] text-[11px] bg-primary text-on-primary rounded-full hover:brightness-110 shadow-xl shadow-primary/20"
            >
              {user ? "Submit Project" : "Initiate Contact"}
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to={user ? "/dashboard" : "/login"}
                replace
                onClick={(e) => {
                  e.preventDefault();
                  smartNavigate(user ? "/dashboard" : "/login", { asSectionSwitch: true });
                }}
                className="inline-block px-12 py-5 border border-outline-variant/10 rounded-full font-bold uppercase tracking-[0.4em] text-[11px] text-on-surface hover:bg-foreground/5 transition-all"
              >
                {user ? "Access Terminal" : "Sign In"}
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Project Details Modal */}
        <AnimatePresence>
          {selectedProject && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/90 backdrop-blur-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] border border-outline-variant/10 shadow-2xl bg-surface/98 backdrop-blur-3xl p-3"
              >
                {/* Close Button */}
                <button 
                  onClick={closeSelectedProject}
                  className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full z-20 bg-foreground/5 text-on-surface hover:bg-foreground/10"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Image Section */}
                  <div className="relative aspect-square lg:aspect-auto bg-surface overflow-hidden rounded-[2.5rem] m-2">
                    <img
                      src={resolveProjectShowcaseImage(selectedProject)}
                      alt={selectedProject.title}
                      className="w-full h-full object-cover opacity-80"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setLightboxOpen(true)}
                      className="absolute top-8 left-8 z-20 px-5 py-2 rounded-full bg-background/80 text-on-surface border border-outline-variant/10 backdrop-blur-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-background transition-colors"
                    >
                      Open Lightbox
                    </button>
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                    <div className="absolute bottom-12 left-12 right-12 space-y-4">
                      <div className="flex items-center space-x-4">
                        <span className="px-4 py-1 rounded-full bg-primary text-on-primary text-[10px] font-bold uppercase tracking-widest">
                          {selectedProject.category}
                        </span>
                        {selectedProject.featured && (
                          <span className="px-4 py-1 rounded-full bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-widest flex items-center">
                            <Star className="h-3 w-3 mr-2 fill-current" />
                            Featured
                          </span>
                        )}
                      </div>
                      <h2 className="text-4xl md:text-5xl font-headline-lg text-on-surface uppercase tracking-tighter leading-none">
                        {selectedProject.title}
                      </h2>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-12 md:p-16 space-y-12 flex flex-col justify-between">
                    <div className="space-y-8">
                      <div className="flex items-center space-x-6">
                        <div className="h-16 w-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl">
                          {(selectedProject.user?.name || "?").charAt(0)}
                        </div>
                        <div>
                          <div className="text-[12px] font-bold uppercase tracking-[0.3em] text-on-surface">
                            {selectedProject.user?.name ?? "Creator"}
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary mt-2">
                            Project Architect
                          </div>
                        </div>
                      </div>

                      <div className="prose prose-lg max-w-none text-on-surface-variant font-body-md">
                        <LazyMarkdown>{selectedProject.description}</LazyMarkdown>
                      </div>
                    </div>

                    <div className="pt-12 border-t border-outline-variant/10 flex flex-col sm:flex-row gap-6">
                      {selectedProject.repoUrl && (
                        <motion.a
                          href={selectedProject.repoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-grow px-10 py-5 text-center font-bold uppercase tracking-[0.3em] text-[10px] bg-primary text-on-primary rounded-full hover:brightness-110"
                        >
                          View Repository
                        </motion.a>
                      )}
                      <motion.button
                        onClick={closeSelectedProject}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-grow px-10 py-5 border border-outline-variant/10 rounded-full text-center font-bold uppercase tracking-[0.3em] text-[10px] text-on-surface hover:bg-foreground/5"
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
