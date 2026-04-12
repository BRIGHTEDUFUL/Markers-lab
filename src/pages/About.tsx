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
                <div className={`relative z-[2] -mt-6 mx-3 rounded-2xl border p-6 shadow-xl backdrop-blur-2xl sm:mx-4 sm:p-7 transition-all duration-500 group-hover:shadow-indigo-500/10 ${isDark ? "border-white/[0.1] bg-[#0a0a0f]/80 shadow-black/60" : "border-slate-200/90 bg-white/90 shadow-slate-200/50"}`}>
                  <h3 className={`font-display text-xl uppercase tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>{member.name}</h3>
                  <p className={`mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.25em] ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{member.tag}</p>
                  <div className={`mt-1 flex items-center gap-1.5 ${isDark ? "text-white/60" : "text-slate-400"}`}>
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em]">{member.location}</span>
                  </div>
                  <div className={`mt-4 border-t pt-4 ${isDark ? "border-white/[0.08]" : "border-slate-200/80"}`}>
                    <p className={`text-sm font-light leading-relaxed ${isDark ? "text-white/78" : "text-slate-600"}`}>{member.bio}</p>
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
                <div key={chip.k} className={`rounded-full border px-4 py-2.5 backdrop-blur-md ${isDark ? "border-white/[0.14] bg-white/[0.06] text-white/90" : "border-slate-200/90 bg-white/60 text-slate-800"}`}>
                  <p className={`font-mono text-[9px] font-bold uppercase tracking-[0.2em] ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{chip.k}</p>
                  <p className="mt-0.5 text-xs font-light">{chip.v}</p>
                </div>
              ))}
            </div>
          </div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }} className="relative lg:col-span-5">
            <div className={`relative aspect-[4/5] overflow-hidden rounded-3xl sm:aspect-square ${isDark ? "ring-1 ring-white/[0.1] shadow-[0_40px_120px_-40px_rgba(99,102,241,0.25)]" : "ring-1 ring-slate-200/90 shadow-[0_40px_100px_-40px_rgba(79,70,229,0.3)]"}`}>
              <div className={`absolute inset-0 z-[1] bg-gradient-to-tr opacity-80 mix-blend-soft-light ${isDark ? "from-violet-600/25 via-transparent to-indigo-600/20" : "from-indigo-500/20 via-transparent to-cyan-500/15"}`} />
              <img src="/team/bright-eduful.png" alt="Bright Eduful — Founder & Lead Engineer" loading="lazy" decoding="async" fetchPriority="low" className="h-full w-full object-cover object-top" sizes="(max-width: 1024px) 100vw, 40vw" />
            </div>
            <div className={`absolute -bottom-4 -right-4 hidden rounded-2xl border px-4 py-3 backdrop-blur-xl sm:flex sm:items-center sm:gap-3 ${isDark ? "border-white/10 bg-black/50" : "border-slate-200/90 bg-white/90"}`}>
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
              <span className={`font-mono text-[10px] uppercase tracking-widest ${isDark ? "text-white/85" : "text-slate-600"}`}>Accepting partners</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────────────── */}
      <section className={`relative z-10 border-y px-4 py-20 sm:py-28 transition-colors duration-700 ${isDark ? "border-white/[0.08] bg-slate-950/70" : "border-slate-200/80 bg-white/40"}`}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 sm:mb-16">
            <span className={`font-mono text-[10px] font-bold uppercase tracking-[0.35em] ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>How We Work</span>
            <h2 className={`mt-3 font-display text-[clamp(2rem,4vw,3.5rem)] uppercase leading-[0.92] tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>Our Principles</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              { title: "Precision Over Speed", desc: "We take the time to understand the problem before writing a single line of code. Rushed work creates technical debt. Deliberate work creates lasting value.", icon: Rocket },
              { title: "Global Perspective", desc: "Remote-first by design, we bring the discipline of a product studio to every engagement — regardless of timezone, industry, or scale.", icon: Globe },
              { title: "Senior Accountability", desc: "There are no hand-offs to junior teams here. The people you meet are the people who build. That accountability is non-negotiable.", icon: Users },
            ].map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative overflow-hidden rounded-2xl border p-8 transition-all duration-500 md:p-9 ${isDark ? "border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent hover:border-indigo-500/30 hover:shadow-[0_24px_80px_-30px_rgba(99,102,241,0.15)]" : "border-slate-200/90 bg-gradient-to-b from-white/90 to-slate-50/50 hover:border-indigo-300/60 hover:shadow-lg hover:shadow-indigo-100/50"}`}>
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-500 group-hover:scale-105 ${isDark ? "from-indigo-500/25 to-violet-600/10 text-indigo-300 shadow-indigo-900/40" : "from-indigo-500/15 to-violet-500/10 text-indigo-600 shadow-indigo-500/10"}`}>
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className={`font-display text-lg uppercase tracking-tight md:text-xl ${isDark ? "text-white" : "text-slate-900"}`}>{v.title}</h3>
                <p className={`mt-4 font-heading text-sm font-light leading-relaxed md:text-base ${isDark ? "text-white/75" : "text-slate-600"}`}>{v.desc}</p>
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
            <Link to="/contact" className={`inline-flex items-center gap-3 rounded-full px-10 py-4 text-[11px] font-bold uppercase tracking-[0.3em] shadow-lg transition-all duration-300 active:scale-95 ${isDark ? "bg-white text-slate-950 shadow-white/10 hover:bg-indigo-500 hover:text-white hover:shadow-indigo-500/25" : "bg-slate-900 text-white shadow-slate-900/25 hover:bg-indigo-600 hover:shadow-indigo-500/30"}`}>
              Start a Conversation <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/register" className={`rounded-full border px-10 py-4 text-[11px] font-bold uppercase tracking-[0.28em] backdrop-blur-md transition-all duration-300 active:scale-95 ${isDark ? "border-white/20 bg-white/[0.04] text-white hover:border-white/40 hover:bg-white/[0.08]" : "border-slate-300/90 bg-white/50 text-slate-900 hover:border-indigo-400/60 hover:bg-white/80"}`}>
              Join Maker's Lab
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};