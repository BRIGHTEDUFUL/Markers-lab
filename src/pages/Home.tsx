import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ArrowRight, ArrowUpRight, Zap, Shield, Globe, Star, Quote } from "lucide-react";
import { motion } from "motion/react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { fetchFeaturedGallery } from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";
import { pickFeaturedShowcase, resolveProjectShowcaseImage } from "../lib/gallery-showcase";
import { SHOWCASE_CARD_DURATION, SHOWCASE_CARD_STAGGER, SHOWCASE_EASE } from "../lib/showcase-motion";
import { mediaSrc } from "../lib/media-url";
import { Project } from "../types";
import StarField from "../components/StarField";
import HeroRingBackdrop from "../components/HeroRingBackdrop";
import { useAdaptiveMotion } from "../hooks/useAdaptiveMotion";
import { useSmartNavigate } from "../hooks/useSmartNavigate";

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children, delay = 0, className = "",
}) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-60px" }}
    transition={{ duration: SHOWCASE_CARD_DURATION, delay, ease: SHOWCASE_EASE }}
    className={className}
  >
    {children}
  </motion.div>
);

const stripMarkdown = (text: string) => {
  return text
    .replace(/[#*`_~]/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/\n/g, " ")
    .trim();
};

export const Home = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { shouldReduceMotion } = useAdaptiveMotion();
  const smartNavigate = useSmartNavigate();
  const isDark = theme === "dark";
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const portfolioProjects = pickFeaturedShowcase(featuredProjects, 4);
  const lightboxSlides = useMemo(() => {
    if (!selectedProject) return [] as Array<{ src: string }>;
    const imageFiles = (selectedProject.files || []).filter((f) => f.mimeType?.startsWith("image/"));
    if (!imageFiles.length) {
      return [{ src: resolveProjectShowcaseImage(selectedProject) }];
    }
    return imageFiles.map((f) => ({ src: mediaSrc(f.path, resolveProjectShowcaseImage(selectedProject)) }));
  }, [selectedProject]);

  useEffect(() => {
    fetchFeaturedGallery()
      .then((d) => setFeaturedProjects(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const GRID_LAYOUTS = [
    { colSpan: "md:col-span-8", height: "h-[640px]", imgOpacity: "opacity-40 group-hover:opacity-70", textCol: "max-w-xl", tagColor: "text-primary" },
    { colSpan: "md:col-span-4", height: "h-[640px]", imgOpacity: "opacity-30 group-hover:opacity-60", textCol: "", tagColor: "text-secondary" },
    { colSpan: "md:col-span-5", height: "h-[440px]", imgOpacity: "opacity-30 group-hover:opacity-50", textCol: "", tagColor: "text-on-surface-variant" },
    { colSpan: "md:col-span-7", height: "h-[440px]", imgOpacity: "opacity-40 group-hover:opacity-60", textCol: "text-right max-w-sm ml-auto", tagColor: "text-tertiary" }
  ];

  return (
    <div className="relative w-full overflow-hidden">
      
      {/* HERO SECTION */}
      <section className="relative min-h-screen min-h-[100dvh] flex flex-col justify-center items-center text-center mb-16 sm:mb-24 md:mb-32 pt-24 sm:pt-28 md:pt-36 px-5 sm:px-8 md:px-16 overflow-visible max-w-[1440px] mx-auto">
        {/* Visual Backdrop Rings and Stars */}
        <HeroRingBackdrop theme={theme} variant="page" className="absolute inset-0 z-0" />
        <div className="absolute inset-0 z-0 pointer-events-none">
          <StarField count={shouldReduceMotion ? 18 : 44} theme={theme} salt={1000} />
          <div className={`absolute inset-0 mask-radial opacity-[0.08] ${isDark ? "bg-grid-white" : "bg-grid-dark"}`} />
        </div>

        {/* Decorative Bento Floating Widgets — Desktop-only, hidden on mobile/tablet */}
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 hidden xl:block animate-float pointer-events-none z-10">
          <div className="glass-card p-8 rounded-[40px] w-72 space-y-8 shadow-2xl border border-outline-variant/10">
            <div className="flex justify-between items-center">
              <span className="font-label-sm text-[11px] tracking-widest text-primary font-bold">PROJECT_SYNC</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(73,75,214,0.5)]"></span>
            </div>
            <div className="space-y-4">
              <div className="h-[2px] w-full bg-foreground/5 rounded-full overflow-hidden">
                <div className="h-full w-4/5 bg-primary rounded-full shadow-[0_0_15px_rgba(73,75,214,0.5)]"></div>
              </div>
              <div className="flex justify-between text-[10px] font-label-sm opacity-40 tracking-widest">
                <span>LATENCY</span>
                <span>0.002MS</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-foreground/5 h-14 rounded-2xl border border-outline-variant/5"></div>
              <div className="bg-foreground/5 h-14 rounded-2xl border border-outline-variant/5"></div>
            </div>
          </div>
        </div>

        <div className="absolute -left-8 bottom-24 hidden xl:block animate-float pointer-events-none z-10" style={{ animationDelay: "-4s" }}>
          <div className="glass-card p-7 rounded-[32px] w-64 space-y-5 border border-outline-variant/10 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center border border-outline-variant/10">
                <span className="material-symbols-outlined text-primary scale-75">auto_awesome_motion</span>
              </div>
              <div className="space-y-1.5">
                <div className="w-24 h-2 bg-foreground/15 rounded-full"></div>
                <div className="w-16 h-2 bg-foreground/5 rounded-full"></div>
              </div>
            </div>
            <div className="text-on-surface-variant font-label-sm text-[10px] tracking-widest opacity-40 px-1 uppercase">
              Status: Beyond Operational
            </div>
          </div>
        </div>

        {/* Hero Text Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-3 sm:gap-4 w-full max-w-5xl mx-auto">
          <span className="font-label-sm text-[10px] sm:text-label-sm text-primary tracking-[0.25em] sm:tracking-[0.3em] uppercase opacity-80 mb-2 sm:mb-4 block">
            Established 2024
          </span>
          <h1 className="font-headline-xl text-[clamp(36px,9vw,110px)] leading-[0.88] uppercase tracking-tighter font-black text-on-surface text-center w-full">
            <span className="block text-on-surface">Websites,</span>
            <span className={`block ${isDark ? "text-outline" : "text-on-surface"}`}>Web Apps</span>
            <span className={`block ${isDark ? "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-black" : "text-primary italic font-light"}`}>
              &amp; Beyond
            </span>
          </h1>
          <p className="max-w-xs sm:max-w-md md:max-w-2xl mx-auto font-body-lg text-base sm:text-lg md:text-body-lg text-on-surface-variant mt-6 sm:mt-10 leading-relaxed font-light opacity-80 tracking-wide">
            Engineering cinematic digital landscapes for the next generation of founders. Where technical precision meets high-end studio aesthetics.
          </p>
        </div>
        
        {/* CTA Buttons — stacked on mobile, side-by-side on sm+ */}
        <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center relative z-10 w-full max-w-sm sm:max-w-md mx-auto px-4">
          <button
            onClick={() => smartNavigate(user ? "/submit-project" : "/register")}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-primary text-on-primary rounded-full font-label-sm text-[11px] font-bold tracking-widest uppercase shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all text-center"
          >
            START BUILD
          </button>
          <button
            onClick={() => smartNavigate("/gallery")}
            className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 border border-outline-variant/30 glass-card text-on-surface rounded-full font-label-sm text-[11px] font-bold tracking-widest uppercase hover:bg-foreground/5 transition-all hover:scale-105 active:scale-95 text-center"
          >
            VIEW ARCHIVE
          </button>
        </div>

        {/* Scroll Indicator — hidden on mobile */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-3 opacity-30 pointer-events-none">
          <span className="font-label-sm text-[9px] tracking-[0.6em] uppercase">Scroll</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent"></div>
        </div>
      </section>

      <div className="relative z-10 max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 overflow-hidden">

      {/* MARQUEE */}
      <section className="relative z-10 py-6 sm:py-8 border-y border-outline-variant/15 overflow-hidden mb-16 sm:mb-24 md:mb-32 bg-foreground/[0.01]">
        <div className={`flex whitespace-nowrap ${shouldReduceMotion ? "" : "animate-marquee"}`}>
          {[...Array(12)].map((_, i) => (
            <span key={i} className="mx-6 sm:mx-10 font-headline-md text-[14px] sm:text-headline-md uppercase tracking-[0.2em] sm:tracking-[0.3em] text-on-surface-variant opacity-15">
              Websites &nbsp;·&nbsp; Web Apps &nbsp;·&nbsp; Digital Experiences &nbsp;·&nbsp; Innovation &nbsp;·&nbsp;
            </span>
          ))}
        </div>
      </section>

      {/* PROJECT GRID */}
      <section className="mb-16 sm:mb-24 md:mb-32">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            <div className="md:col-span-8 h-[320px] sm:h-[480px] md:h-[640px] rounded-[1.5rem] sm:rounded-[2.5rem] bg-foreground/5 animate-pulse" />
            <div className="md:col-span-4 h-[320px] sm:h-[480px] md:h-[640px] rounded-[1.5rem] sm:rounded-[2.5rem] bg-foreground/5 animate-pulse" />
          </div>
        ) : portfolioProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
            {portfolioProjects.map((project, idx) => {
              const layout = GRID_LAYOUTS[idx] || GRID_LAYOUTS[0];
              const isRightAlign = layout.textCol.includes("text-right");
              const mobileHeight = idx === 0 ? "h-[340px] sm:h-[480px]" : "h-[280px] sm:h-[380px]";
              return (
                <div
                  key={project.id}
                  className={`${layout.colSpan} group`}
                  onClick={() => {
                    setSelectedProject(project);
                    setLightboxOpen(true);
                  }}
                >
                  <div className={`glass-card rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden transition-all duration-1000 relative ${mobileHeight} md:${layout.height} cursor-pointer`}>
                    <img
                      alt={project.title}
                      className={`absolute inset-0 w-full h-full object-cover scale-110 group-hover:scale-100 transition-transform duration-[2000ms] ease-out ${layout.imgOpacity}`}
                      src={resolveProjectShowcaseImage(project)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/25 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 p-6 sm:p-10 md:p-12 w-full">
                      <div className={`flex justify-between items-end`}>
                        <div className={layout.textCol}>
                          <span className={`font-label-sm text-[10px] sm:text-label-sm ${layout.tagColor} mb-2 sm:mb-4 block tracking-[0.15em] sm:tracking-[0.2em] uppercase`}>
                            {project.category}
                          </span>
                          <h3 className="font-headline-lg text-[20px] sm:text-[28px] md:text-headline-lg text-on-surface uppercase tracking-tight leading-none mb-3 sm:mb-6">
                            {project.title}
                          </h3>
                          <p className="font-body-md text-on-surface-variant opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-100 line-clamp-2 hidden sm:block">
                            {stripMarkdown(project.description)}
                          </p>
                        </div>
                        {!isRightAlign && (
                          <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all duration-500 group-hover:rotate-45 flex-shrink-0">
                            <span className="material-symbols-outlined text-on-surface group-hover:text-on-primary text-[18px] sm:text-[24px]">arrow_outward</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 sm:py-24 text-center glass-card rounded-[1.5rem] sm:rounded-[2.5rem]">
            <p className="font-label-sm text-on-surface-variant uppercase tracking-widest">No featured works found.</p>
          </div>
        )}
      </section>

      {/* METRICS DISPLAY */}
      <section className="mb-16 sm:mb-24 md:mb-32 border-y border-outline-variant/10 py-10 sm:py-16 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-10 md:gap-12 text-center md:text-left">
        <div className="flex flex-col gap-3">
          <span className="font-label-sm text-on-surface-variant tracking-[0.3em] uppercase text-[10px]">Strategic Units</span>
          <span className="font-headline-md text-headline-md text-primary tracking-tighter uppercase">14 ACTIVE LABS</span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-label-sm text-on-surface-variant tracking-[0.3em] uppercase text-[10px]">Infrastructure Reliability</span>
          <span className="font-headline-md text-headline-md text-on-surface tracking-tighter uppercase">99.999% UP</span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-label-sm text-on-surface-variant tracking-[0.3em] uppercase text-[10px]">Global Throughput</span>
          <span className="font-headline-md text-headline-md text-on-surface tracking-tighter uppercase">8.4 PB / DAY</span>
        </div>
        <div className="flex flex-col gap-3">
          <span className="font-label-sm text-on-surface-variant tracking-[0.3em] uppercase text-[10px]">Operational Protocol</span>
          <span className="font-headline-md text-headline-md text-secondary tracking-tighter uppercase">BEYOND_V4.0</span>
        </div>
      </section>

      {/* SERVICES / CRAFT */}
      <section className="mb-16 sm:mb-24 md:mb-32">
        <div className="text-center mb-10 sm:mb-16 md:mb-20">
          <span className="font-label-sm text-label-sm text-primary tracking-[0.4em] uppercase opacity-80">Our Offerings</span>
          <h2 className="font-headline-lg text-[clamp(24px,6vw,48px)] leading-tight text-on-surface uppercase mt-2">TECHNICAL SERVICES</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {([
            { number: "01", category: "Architecture", title: "Technical Infrastructure", desc: "We engineer high-performance backends that scale with your ambition. From decentralized protocols to low-latency cloud systems, our architectures are built to endure." },
            { number: "02", category: "Experience", title: "Cinematic UI Design", desc: "Interfaces that feel like a film. We prioritize motion, depth, and atmospheric lighting to create digital experiences that resonate emotionally and command attention." },
            { number: "03", category: "Growth", title: "Strategic Launch", desc: "We don't just build; we deploy with intent. Our methodology includes market positioning, narrative crafting, and community engineering for orbit entry." },
          ]).map((s, i) => (
            <div key={i} className="group bg-surface-container-low/30 backdrop-blur-sm p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] border border-outline-variant/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
              <span className="text-[64px] font-headline-xl text-primary/10 select-none block leading-none mb-6">{s.number}</span>
              <div className="mb-2 text-primary font-label-sm text-label-sm tracking-[0.2em] uppercase">{s.category}</div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4">{s.title}</h3>
              <p className="font-body-md text-on-surface-variant leading-relaxed opacity-70">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="mb-16 sm:mb-24 md:mb-32">
        <div className="text-center mb-10 sm:mb-16 md:mb-20">
          <span className="font-label-sm text-label-sm text-primary tracking-[0.4em] uppercase opacity-80">Client Stories</span>
          <h2 className="font-headline-lg text-[clamp(24px,6vw,48px)] leading-tight text-on-surface uppercase mt-2">TRUSTED BY VISIONARIES</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {[
            { quote: "Bright's architectural vision transformed a complex project into an elegant, scalable system. His attention to detail and commitment to execution excellence is what sets Maker's Lab apart.", author: "Bright Eduful", role: "Founder & Lead Engineer", img: "/team/bright-eduful.png" },
            { quote: "Abena's strategic approach to growth marketing helped us reach the right audience at the right time. Her campaigns are data-driven yet creative — exactly what we needed.", author: "Abena Antwiwaa Quarshie", role: "Head of Marketing & Growth", img: "/team/abena-antwiwaa-quarshie.png" },
            { quote: "Ralph's engineering discipline ensured our systems remained performant and maintainable through every iteration. His integrations were flawless and his code was pristine.", author: "Ralph Andy Menz", role: "Senior Software Developer", img: "/team/ralph-andy-menz.png" },
          ].map((t, i) => (
            <div key={i} className="glass-card p-10 rounded-[2.5rem] border border-outline-variant/10 flex flex-col justify-between hover:border-primary/20 transition-all duration-500">
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-primary text-primary" />
                ))}
              </div>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed italic mb-8">"{t.quote}"</p>
              <div className="flex items-center gap-4 border-t border-outline-variant/10 pt-6">
                <img src={t.img} alt={t.author} className="h-12 w-12 rounded-full object-cover border border-outline-variant/10" />
                <div>
                  <div className="text-sm font-bold text-on-surface uppercase">{t.author}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="mb-16 sm:mb-24 md:mb-32 text-center relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] md:rounded-[3.5rem] py-20 sm:py-28 md:py-40 px-5 sm:px-8 glass-card">
        <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 md:gap-10">
          <h2 className="font-headline-lg text-[clamp(22px,5vw,48px)] leading-[1.1] max-w-3xl uppercase tracking-tight">
            Engineering the <span className="text-primary italic font-light">Future Presence.</span><br/>
            Start Your Manifestation.
          </h2>
          <button
            onClick={() => smartNavigate(user ? "/submit-project" : "/register")}
            className="group flex items-center gap-4 sm:gap-6 bg-primary text-on-primary px-8 sm:px-12 py-4 sm:py-5 rounded-full font-headline-md text-base sm:text-headline-md transition-all hover:scale-105 shadow-2xl shadow-primary/20"
          >
            INITIATE PROTOCOL
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-2">arrow_forward</span>
          </button>
        </div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_50%,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent pointer-events-none"></div>
      </section>

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
      </div> {/* Closing responsive container */}
    </div>
  );
};

