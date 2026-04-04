import React from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Globe, Users, Rocket, ArrowRight, Sparkles } from "lucide-react";
import PageHero from "../components/PageHero";
import { useTheme } from "../contexts/ThemeContext";

const team = [
  {
    name: "Bright Eduful",
    role: "Founder & Developer",
    image: "/team/bright-eduful.png",
    bio: "Founder of Maker’s Lab. Owns product direction and end-to-end engineering—shipping polished, production-ready experiences from architecture to deployment.",
  },
  {
    name: "Ralph Andy Menz",
    role: "Software Developer",
    image: "/team/ralph-andy-menz.png",
    bio: "Builds scalable features and integrations with a focus on clarity, performance, and long-term maintainability.",
  },
  {
    name: "Abene",
    role: "Marketing & Advertising",
    image: "/team/abene.png",
    bio: "Drives brand, campaigns, and messaging—connecting Maker’s Lab with the audiences who need elite digital execution.",
  },
];

export const About: React.FC = () => {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="page-shell">
      {/* Ambient mesh — sits above global hero, below content */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-90"
        aria-hidden
      >
        <div
          className={`absolute -left-1/4 top-0 h-[min(80vh,900px)] w-[min(80vw,900px)] rounded-full blur-[120px] ${
            isLight ? "bg-indigo-400/25" : "bg-violet-600/20"
          }`}
        />
        <div
          className={`absolute -right-1/4 bottom-[10%] h-[min(70vh,700px)] w-[min(70vw,700px)] rounded-full blur-[100px] ${
            isLight ? "bg-cyan-400/20" : "bg-indigo-500/15"
          }`}
        />
        <div
          className={`absolute left-1/2 top-1/3 h-px w-[min(100%,72rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-current to-transparent opacity-[0.07] ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        />
      </div>

      <div className="relative z-[2]">
        <PageHero
          title={`People behind <br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${isLight ? "#0f172a" : "white"}'>Maker’s Lab</span>`}
          subtitle="A lean, senior team blending engineering discipline with brand craft—built around Bright’s vision and backed by Ralph and Abene."
          category="The Studio"
        />

        <div className="relative z-10">
          {/* Team */}
          <section
            className={`relative border-b px-4 py-20 sm:py-28 md:py-32 transition-colors duration-700 ${
              isLight ? "border-slate-200/80" : "border-white/[0.06]"
            }`}
          >
            <div
              className={`pointer-events-none absolute inset-0 opacity-[0.35] mask-radial ${isLight ? "bg-grid-slate-900" : "bg-grid-white"}`}
              aria-hidden
            />

            <div className="relative mx-auto max-w-7xl">
              <div className="mb-14 flex flex-col justify-between gap-8 md:mb-20 md:flex-row md:items-end md:gap-12">
                <div className="max-w-2xl space-y-5">
                  <div className="inline-flex items-center gap-2">
                    <span
                      className={`font-mono text-[10px] font-medium uppercase tracking-[0.35em] ${
                        isLight ? "text-indigo-600" : "text-indigo-400"
                      }`}
                    >
                      Core team
                    </span>
                    <span className={`h-px w-8 ${isLight ? "bg-indigo-300/80" : "bg-indigo-500/40"}`} />
                    <Sparkles className={`h-3.5 w-3.5 ${isLight ? "text-indigo-500" : "text-indigo-400"}`} />
                  </div>
                  <h2
                    className={`font-display text-[clamp(2.25rem,5vw,4.5rem)] uppercase leading-[0.92] tracking-tighter ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    Execution,{" "}
                    <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 bg-clip-text font-serif text-4xl italic normal-case tracking-normal text-transparent sm:text-5xl md:text-6xl dark:from-indigo-400 dark:via-violet-400 dark:to-cyan-400">
                      by design
                    </span>
                  </h2>
                </div>
                <p
                  className={`max-w-md font-heading text-base font-light leading-relaxed md:text-lg ${
                    isLight ? "text-slate-600" : "text-white/50"
                  }`}
                >
                  Real faces, real roles. A tight crew so every engagement gets direct attention from people who ship.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-10 sm:gap-12 lg:grid-cols-3 lg:gap-8 xl:gap-10">
                {team.map((member, i) => (
                  <motion.article
                    key={member.name}
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative flex flex-col"
                  >
                    <div className="relative">
                      <div
                        className={`absolute -inset-px rounded-[1.75rem] bg-gradient-to-br opacity-60 blur-sm transition-opacity duration-500 group-hover:opacity-100 sm:rounded-[2rem] ${
                          isLight
                            ? "from-indigo-400/40 via-violet-400/20 to-transparent"
                            : "from-indigo-500/30 via-violet-500/20 to-transparent"
                        }`}
                        aria-hidden
                      />
                      <div
                        className={`relative aspect-[3/4] w-full overflow-hidden rounded-[1.75rem] sm:rounded-[2rem] ${
                          isLight
                            ? "bg-white shadow-[0_24px_80px_-24px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/90"
                            : "bg-white/[0.04] shadow-[0_32px_100px_-32px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.08]"
                        }`}
                      >
                        <div
                          className={`pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/50 via-transparent to-white/5 opacity-80 mix-blend-overlay dark:from-black/70 dark:to-transparent dark:mix-blend-normal`}
                        />
                        <img
                          src={member.image}
                          alt={member.name}
                          className="h-full w-full object-cover object-top transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                        <div
                          className={`absolute left-4 top-4 z-[2] flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11px] font-semibold backdrop-blur-md ${
                            isLight
                              ? "border border-white/60 bg-white/75 text-slate-800 shadow-sm"
                              : "border border-white/15 bg-black/40 text-white/90"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </div>
                      </div>

                      <div
                        className={`relative z-[2] -mt-14 mx-3 rounded-2xl border p-6 shadow-2xl backdrop-blur-2xl sm:-mt-16 sm:mx-4 sm:rounded-[1.35rem] sm:p-7 ${
                          isLight
                            ? "border-slate-200/90 bg-white/85 shadow-slate-900/10"
                            : "border-white/[0.1] bg-[#0a0a0f]/75 shadow-black/60"
                        }`}
                      >
                        <h3
                          className={`font-display text-lg uppercase tracking-tight sm:text-xl ${isLight ? "text-slate-900" : "text-white"}`}
                        >
                          {member.name}
                        </h3>
                        <p
                          className={`mt-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] ${
                            isLight ? "text-indigo-600" : "text-indigo-400"
                          }`}
                        >
                          {member.role}
                        </p>
                        <p
                          className={`mt-4 border-t pt-4 text-sm font-light leading-relaxed ${
                            isLight ? "border-slate-200/80 text-slate-600" : "border-white/[0.08] text-white/45"
                          }`}
                        >
                          {member.bio}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          {/* Mission */}
          <section className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 md:py-32">
            <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-16">
              <div className="space-y-8 lg:col-span-7">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <span
                    className={`font-mono text-[10px] font-medium uppercase tracking-[0.35em] ${
                      isLight ? "text-indigo-600" : "text-indigo-400"
                    }`}
                  >
                    Mission
                  </span>
                  <h2
                    className={`font-display text-[clamp(2rem,4.5vw,3.75rem)] uppercase leading-[0.95] tracking-tighter ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    Software as{" "}
                    <span className="font-serif text-3xl italic normal-case text-indigo-600 sm:text-4xl md:text-5xl dark:text-indigo-400">
                      experience
                    </span>
                  </h2>
                </motion.div>
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 }}
                  className={`max-w-xl font-heading text-base font-light leading-relaxed md:text-lg ${
                    isLight ? "text-slate-600" : "text-white/55"
                  }`}
                >
                  Maker’s Lab merges serious engineering with refined design. Led by Bright Eduful, every engagement is a partnership—not a ticket queue.
                </motion.p>

                <div className="flex flex-wrap gap-3 pt-2">
                  {[
                    { k: "Stack", v: "Modern · typed · observable" },
                    { k: "Delivery", v: "Design systems → prod" },
                  ].map((chip) => (
                    <div
                      key={chip.k}
                      className={`rounded-full border px-4 py-2.5 backdrop-blur-md ${
                        isLight
                          ? "border-slate-200/90 bg-white/60 text-slate-800"
                          : "border-white/[0.1] bg-white/[0.04] text-white/80"
                      }`}
                    >
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500 dark:text-indigo-400">
                        {chip.k}
                      </p>
                      <p className="mt-0.5 text-xs font-light">{chip.v}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 sm:max-w-lg">
                  {[
                    { t: "Build", s: "Products & platforms" },
                    { t: "Grow", s: "Brand & reach" },
                  ].map((item) => (
                    <div
                      key={item.t}
                      className={`rounded-2xl border p-5 transition-colors duration-300 ${
                        isLight
                          ? "border-slate-200/90 bg-gradient-to-br from-white to-slate-50/80 hover:border-indigo-200/80"
                          : "border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent hover:border-indigo-500/25"
                      }`}
                    >
                      <h4 className={`font-display text-2xl uppercase ${isLight ? "text-slate-900" : "text-white"}`}>
                        {item.t}
                      </h4>
                      <p className="mt-2 font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-indigo-500 dark:text-indigo-400">
                        {item.s}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                className="relative lg:col-span-5"
              >
                <div
                  className={`relative aspect-[4/5] overflow-hidden rounded-[1.75rem] sm:aspect-square sm:rounded-[2rem] ${
                    isLight
                      ? "shadow-[0_40px_100px_-40px_rgba(79,70,229,0.35)] ring-1 ring-slate-200/90"
                      : "shadow-[0_40px_120px_-40px_rgba(99,102,241,0.25)] ring-1 ring-white/[0.1]"
                  }`}
                >
                  <div
                    className={`absolute inset-0 z-[1] bg-gradient-to-tr opacity-90 mix-blend-soft-light ${
                      isLight ? "from-indigo-500/20 via-transparent to-cyan-500/15" : "from-violet-600/25 via-transparent to-indigo-600/20"
                    }`}
                  />
                  <img
                    src="/team/bright-eduful.png"
                    alt="Bright Eduful, Founder & Developer"
                    className="h-full w-full object-cover object-top"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                </div>
                <div
                  className={`absolute -bottom-4 -right-4 hidden rounded-2xl border px-4 py-3 backdrop-blur-xl sm:flex sm:items-center sm:gap-3 ${
                    isLight ? "border-slate-200/90 bg-white/90" : "border-white/10 bg-black/50"
                  }`}
                >
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.6)]" />
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${isLight ? "text-slate-600" : "text-white/60"}`}>
                    Accepting partners
                  </span>
                </div>
              </motion.div>
            </div>
          </section>

          {/* Values */}
          <section
            className={`relative border-y px-4 py-20 sm:py-28 ${
              isLight ? "border-slate-200/80 bg-white/35" : "border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-5">
              {[
                {
                  title: "Innovation first",
                  desc: "Right tools, clear patterns, measurable outcomes—not hype for its own sake.",
                  icon: Rocket,
                },
                {
                  title: "Global mindset",
                  desc: "Remote-first collaboration with the discipline of a product studio.",
                  icon: Globe,
                },
                {
                  title: "Small team, high bar",
                  desc: "Direct access to the people who design, build, and ship your work.",
                  icon: Users,
                },
              ].map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className={`group relative overflow-hidden rounded-2xl border p-8 transition-all duration-500 md:p-9 ${
                    isLight
                      ? "border-slate-200/90 bg-gradient-to-b from-white/90 to-slate-50/50 hover:border-indigo-300/60 hover:shadow-[0_24px_60px_-24px_rgba(99,102,241,0.2)]"
                      : "border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent hover:border-indigo-500/30 hover:shadow-[0_24px_80px_-30px_rgba(99,102,241,0.15)]"
                  }`}
                >
                  <div
                    className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br shadow-lg transition-transform duration-500 group-hover:scale-105 ${
                      isLight
                        ? "from-indigo-500/15 to-violet-500/10 text-indigo-600 shadow-indigo-500/10"
                        : "from-indigo-500/25 to-violet-600/10 text-indigo-300 shadow-indigo-900/40"
                    }`}
                  >
                    <value.icon className="h-7 w-7" />
                  </div>
                  <h3 className={`font-display text-lg uppercase tracking-tight md:text-xl ${isLight ? "text-slate-900" : "text-white"}`}>
                    {value.title}
                  </h3>
                  <p className={`mt-4 font-heading text-sm font-light leading-relaxed md:text-base ${isLight ? "text-slate-600" : "text-white/45"}`}>
                    {value.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="relative px-4 py-20 text-center sm:space-y-12 sm:py-28 md:py-32">
            <div
              className={`pointer-events-none absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-indigo-500/25 to-transparent dark:via-indigo-400/20`}
              aria-hidden
            />
            <h2
              className={`relative font-display text-[clamp(2.5rem,8vw,6.5rem)] uppercase leading-[0.9] tracking-tighter ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              Ready to{" "}
              <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 bg-clip-text text-transparent dark:from-indigo-400 dark:via-fuchsia-400 dark:to-cyan-400">
                collaborate?
              </span>
            </h2>
            <div className="relative mt-10 flex flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row sm:gap-5">
              <Link
                to="/contact"
                className={`inline-flex items-center gap-3 rounded-full px-10 py-4 text-[10px] font-bold uppercase tracking-[0.32em] shadow-lg transition-all duration-300 sm:px-12 sm:py-5 sm:text-[11px] ${
                  isLight
                    ? "bg-slate-900 text-white shadow-slate-900/25 hover:bg-gradient-to-r hover:from-indigo-600 hover:to-violet-600 hover:shadow-indigo-500/30"
                    : "bg-white text-slate-950 shadow-white/10 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-violet-600 hover:text-white hover:shadow-indigo-500/25"
                }`}
              >
                Initiate contact
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/register"
                className={`rounded-full border px-9 py-4 text-[10px] font-bold uppercase tracking-[0.28em] backdrop-blur-md transition-all duration-300 sm:px-11 sm:py-5 sm:text-[11px] ${
                  isLight
                    ? "border-slate-300/90 bg-white/50 text-slate-900 hover:border-indigo-400/60 hover:bg-white/80"
                    : "border-white/20 bg-white/[0.04] text-white hover:border-white/40 hover:bg-white/[0.08]"
                }`}
              >
                Join Maker’s Lab
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
