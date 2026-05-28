import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Globe, Users, Rocket, ArrowRight, Sparkles, Code2, Megaphone, MapPin } from "lucide-react";
import PageHero from "../components/PageHero";
import { useTheme } from "../contexts/ThemeContext";
import InteractiveImage from "../components/InteractiveImage";

const team = [
  {
    name: "Bright Eduful",
    role: "Founder & Lead Engineer",
    image: "/team/bright-eduful.png",
    tag: "Product · Architecture · Delivery",
    bio: "Bright founded Maker's Lab with a singular conviction: that software should be as refined as it is functional. He leads product strategy and end-to-end engineering — from system architecture to final deployment — ensuring every deliverable meets an uncompromising standard of quality.",
    icon: Rocket,
    location: "Accra, Ghana",
  },
  {
    name: "Abena Antwiwaa Quarshie",
    role: "Head of Marketing & Growth",
    image: "/team/abena-antwiwaa-quarshie-v2.png?v=2026-04-12-4",
    fallbackImage: "/team/abena-antwiwaa-quarshie.png?v=2026-04-12-4",
    tag: "Brand · Campaigns · Growth",
    bio: "Abena translates Maker's Lab's technical excellence into compelling narratives that reach the right audiences. She leads brand strategy, campaign execution, and growth initiatives — ensuring the studio's work is seen by the clients who deserve it most.",
    icon: Megaphone,
    location: "Accra, Ghana",
  },
  {
    name: "Ralph Andy Menz",
    role: "Senior Software Developer",
    image: "/team/ralph-andy-menz.png",
    tag: "Engineering · Integrations · Performance",
    bio: "Ralph brings rigorous engineering discipline to every feature he ships. Specialising in scalable integrations and clean system design, he ensures that what gets built today remains maintainable, performant, and extensible for years to come.",
    icon: Code2,
    location: "Accra, Ghana",
  },
];

export const About: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  // Track which team member's image is "active" (colored) on mobile
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <div className="page-shell">
      <PageHero
        title={`The People Behind <br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${isDark ? "white" : "#0f172a"}'>Maker's Lab</span>`}
        subtitle="A focused, senior team that blends engineering rigour with brand craft. We don't outsource. We don't over-hire. We deliver."
        details="Meet the architects, engineers, and strategists who collaborate directly with you from initial vision through final deployment. Your success is our standard."
        category="The Studio"
      />

      {/* ── TEAM ─────────────────────────────────────────────────── */}
      <section className={`relative z-10 border-b px-4 py-20 sm:py-28 transition-colors duration-700 ${isDark ? "border-white/[0.06]" : "border-slate-200/80"}`}>
        <div className="max-w-7xl mx-auto">

          {/* Section header */}
          <div className="mb-16 sm:mb-20 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2">
                <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.35em] ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>Core Team</span>
                <span className={`h-px w-8 ${isDark ? "bg-indigo-500/40" : "bg-indigo-300"}`} />
                <Sparkles className={`h-3.5 w-3.5 ${isDark ? "text-indigo-400" : "text-indigo-500"}`} />
              </div>
              <h2 className={`font-display text-[clamp(2.25rem,5vw,4.5rem)] uppercase leading-[0.92] tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>
                Execution,{" "}
                <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent italic font-serif normal-case tracking-normal text-[clamp(2rem,4.5vw,4rem)]">
                  by design
                </span>
              </h2>
            </div>
            <p className={`max-w-sm font-heading text-base font-light leading-relaxed ${isDark ? "text-white/75" : "text-slate-500"}`}>
              Every engagement receives direct attention from the people who actually design, build, and ship your product.
            </p>
          </div>

          {/* Team cards */}
          <div className="grid grid-cols-1 gap-8 sm:gap-10 lg:grid-cols-3">
            {team.map((member, i) => (
              <motion.article
                key={member.name}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.12, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex flex-col"
              >
                <div className="relative overflow-hidden rounded-3xl">
                  {/* Glow border */}
                  <div className={`absolute -inset-px rounded-3xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm ${isDark ? "from-indigo-500/40 via-violet-500/20 to-transparent" : "from-indigo-400/50 via-violet-400/25 to-transparent"}`} aria-hidden />
                  <div className={`relative aspect-[3/4] w-full overflow-hidden rounded-3xl ${isDark ? "bg-white/[0.04] ring-1 ring-white/[0.08]" : "bg-white ring-1 ring-slate-200/90 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.18)]"}`}>
                    {/* Overlay */}
                    <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <InteractiveImage
                      src={member.image}
                      fallbackSrc={member.fallbackImage}
                      alt={member.name}
                      active={activeIndex === i}
                      onActivate={() => setActiveIndex(prev => prev === i ? null : i)}
                      className="absolute inset-0 rounded-3xl"
                    />
                    {/* Index badge */}
                    <div className={`absolute left-4 top-4 z-[2] flex h-8 w-8 items-center justify-center rounded-full font-mono text-[10px] font-bold backdrop-blur-md pointer-events-none ${isDark ? "border border-white/15 bg-black/40 text-white/80" : "border border-white/60 bg-white/75 text-slate-800 shadow-sm"}`}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    {/* Role badge on photo */}
                    <div className="absolute bottom-4 left-4 right-4 z-[2] pointer-events-none">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.2em] backdrop-blur-md ${isDark ? "bg-black/50 border border-white/10 text-indigo-300" : "bg-white/80 border border-white/60 text-indigo-600"}`}>
                        <member.icon className="h-3 w-3" />
                        {member.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Info card — overlaps photo */}
                <div className="relative z-[2] -mt-6 mx-3 sm:mx-4 rounded-2xl p-6 sm:p-7 border border-outline-variant bg-background/90 backdrop-blur-xl transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-[0_0_40px_rgba(99,102,241,0.08)]">
                  <h3 className="font-headline-md text-headline-md uppercase tracking-tight text-on-surface">{member.name}</h3>
                  <p className="mt-1 font-label-sm text-label-sm uppercase tracking-[0.25em] text-primary">{member.tag}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-on-surface-variant/80">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="font-label-sm text-label-sm uppercase tracking-[0.2em]">{member.location}</span>
                  </div>
                  <div className="mt-4 border-t border-outline-variant pt-4">
                    <p className="text-body-md text-on-surface-variant/80 leading-relaxed">{member.bio}</p>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ── MISSION ──────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 py-20 sm:py-28">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="space-y-8 lg:col-span-7">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="space-y-4">
              <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.35em] ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>Our Mission</span>
              <h2 className={`font-display text-[clamp(2rem,4.5vw,3.75rem)] uppercase leading-[0.95] tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>
                Software as{" "}
                <span className="font-serif italic normal-case text-indigo-500 text-[clamp(1.75rem,4vw,3.5rem)]">experience</span>
              </h2>
            </motion.div>
            <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }} className={`max-w-xl font-heading text-base font-light leading-relaxed md:text-lg ${isDark ? "text-white/78" : "text-slate-600"}`}>
              Maker's Lab was built on the belief that great software is never accidental. Led by Bright Eduful, every engagement is a genuine partnership — one where strategy, design, and engineering move in lockstep from the first conversation to the final deployment.
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 }} className={`max-w-xl font-heading text-base font-light leading-relaxed md:text-lg ${isDark ? "text-white/78" : "text-slate-600"}`}>
              We don't operate a ticket queue. We don't hand work off to junior contractors. When you engage Maker's Lab, you work directly with the people who will architect, build, and ship your product.
            </motion.p>
            <div className="flex flex-wrap gap-3 pt-2">
              {[
                { k: "Stack", v: "Modern · Typed · Observable" },
                { k: "Delivery", v: "Design Systems → Production" },
                { k: "Approach", v: "Partnership, not outsourcing" },
              ].map((chip) => (
                <div key={chip.k} className="rounded-full border border-outline-variant px-6 py-2.5 backdrop-blur-md bg-surface-container-low text-on-surface">
                  <p className="font-label-sm text-label-sm uppercase tracking-[0.2em] text-primary">{chip.k}</p>
                  <p className="mt-0.5 text-label-sm font-label-sm">{chip.v}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="relative lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl sm:aspect-square ring-1 ring-outline-variant shadow-lg">
              <div className="absolute inset-0 z-[1] bg-gradient-to-tr opacity-80 mix-blend-soft-light from-primary/20 via-transparent to-secondary/15" />
              <img src="/team/bright-eduful.png" alt="Bright Eduful — Founder & Lead Engineer" loading="lazy" decoding="async" fetchPriority="low" className="h-full w-full object-cover object-top" sizes="(max-width: 1024px) 100vw, 40vw" />
            </div>
            <div className="absolute -bottom-4 -right-4 hidden rounded-2xl border border-outline-variant px-4 py-3 backdrop-blur-xl sm:flex sm:items-center sm:gap-3 bg-background/90 text-on-surface">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface">Accepting partners</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-outline-variant px-4 py-20 sm:py-28 bg-surface-container-lowest/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <span className="text-label-sm font-label-sm text-primary uppercase tracking-[0.35em]">How We Work</span>
            <h2 className="mt-3 font-headline-lg text-headline-lg uppercase text-on-surface">Our Principles</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { title: "Precision Over Speed", desc: "We take the time to understand the problem before writing a single line of code. Rushed work creates technical debt. Deliberate work creates lasting value.", icon: Rocket },
              { title: "Global Perspective", desc: "Remote-first by design, we bring the discipline of a product studio to every engagement — regardless of timezone, industry, or scale.", icon: Globe },
              { title: "Senior Accountability", desc: "There are no hand-offs to junior teams here. The people you meet are the people who build. That accountability is non-negotiable.", icon: Users },
            ].map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-2xl border border-outline-variant p-8 md:p-9 bg-surface-container-low/40 hover:border-primary/30 transition-all duration-500">
                <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-105">
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="font-headline-md text-headline-md uppercase text-on-surface">{v.title}</h3>
                <p className="mt-4 text-body-md text-on-surface-variant/80 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-24 text-center sm:py-32">
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" aria-hidden />
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className={`font-display text-[clamp(2.5rem,8vw,6rem)] uppercase leading-[0.9] tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>
            Ready to{" "}
            <span className="bg-gradient-to-r from-indigo-500 via-violet-500 to-cyan-500 bg-clip-text text-transparent">collaborate?</span>
          </h2>
          <p className={`font-heading text-base font-light leading-relaxed max-w-xl mx-auto ${isDark ? "text-white/78" : "text-slate-500"}`}>
            Whether you have a fully-formed brief or just an idea worth exploring, we'd like to hear from you. Every great product starts with a conversation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link to="/contact" className="inline-flex items-center gap-3 bg-primary text-on-primary px-10 py-4 rounded-full font-label-sm uppercase tracking-[0.3em] hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/10">
              Start a Conversation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className="rounded-full border border-outline-variant bg-surface-container-low px-10 py-4 text-label-sm font-label-sm uppercase tracking-[0.28em] backdrop-blur-md hover:border-on-surface/20 transition-all duration-300 active:scale-95 text-on-surface">
              Join Maker's Lab
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};