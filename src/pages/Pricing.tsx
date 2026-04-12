import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Layers, Sparkles, Star } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { useAdaptiveMotion } from "../hooks/useAdaptiveMotion";
import { PRICING_PACKAGES, USER_SEGMENT_SOLUTIONS } from "../config/pricing";

const FadeUp: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = "",
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

const formatGhs = (value: number) => `GH₵ ${value.toLocaleString("en-GH")}`;

export const Pricing = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { shouldReduceMotion } = useAdaptiveMotion();
  const isDark = theme === "dark";
  const softLiftClass = shouldReduceMotion ? "" : "hover:-translate-y-0.5";
  const softTransitionClass = shouldReduceMotion ? "transition-colors duration-200" : "transition-all duration-500";
  const pricingCards = useMemo(
    () =>
      PRICING_PACKAGES.map((pkg) => ({
        ...pkg,
        formattedPrice: formatGhs(pkg.priceGhs),
        formattedStudentPrice: pkg.studentPriceGhs ? formatGhs(pkg.studentPriceGhs) : null,
      })),
    []
  );

  return (
    <div className="relative">
      <section className="relative z-10 pt-40 pb-20 sm:pt-44 sm:pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div
            className={`absolute inset-0 ${
              isDark
                ? "bg-[radial-gradient(ellipse_65%_52%_at_50%_40%,rgba(99,102,241,0.18),transparent_70%)]"
                : "bg-[radial-gradient(ellipse_65%_52%_at_50%_40%,rgba(99,102,241,0.14),transparent_70%)]"
            }`}
          />
        </div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <FadeUp>
            <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">Simple Pricing</p>
            <h1
              className={`font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-tighter leading-[0.9] ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Pick The <span className="text-transparent italic" style={{ WebkitTextStroke: isDark ? "1px rgba(255,255,255,0.4)" : "1px rgba(15,23,42,0.35)" }}>Right Package</span>
            </h1>
            <p className={`max-w-3xl mx-auto mt-8 text-base sm:text-lg font-light leading-relaxed ${isDark ? "text-white/65" : "text-slate-600"}`}>
              Start with Standard, grow into Premium, or scale with Executive. Every package is priced in Ghana Cedi and tailored for practical outcomes.
            </p>
          </FadeUp>

          <FadeUp delay={shouldReduceMotion ? 0 : 0.08} className="mt-10">
            <div className={`mx-auto max-w-5xl rounded-3xl border px-5 py-4 sm:px-7 sm:py-6 grid grid-cols-1 md:grid-cols-3 gap-4 ${isDark ? "border-white/10 bg-white/[0.03]" : shouldReduceMotion ? "border-slate-200 bg-white shadow-sm shadow-slate-200/30" : "border-slate-200 bg-white shadow-lg shadow-slate-200/40"}`}>
              <div className="text-left">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">1. Choose your level</p>
                <p className={`text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>Select Standard, Premium, or Executive based on project depth.</p>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">2. Submit your brief</p>
                <p className={`text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>We align timeline, scope, and delivery plan with your selected package.</p>
              </div>
              <div className="text-left">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-1">3. Start execution</p>
                <p className={`text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>Your build starts with clear milestones and measurable deliverables.</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className={`relative z-10 py-20 sm:py-24 px-4 border-t transition-colors duration-500 ${isDark ? "border-white/5" : "border-slate-200"}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-12 sm:mb-14">
            <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">User Categories</p>
            <h2 className={`font-display text-4xl sm:text-6xl uppercase tracking-tighter leading-[0.95] ${isDark ? "text-white" : "text-slate-900"}`}>Who It Is For</h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {USER_SEGMENT_SOLUTIONS.map((segment, i) => (
              <FadeUp key={segment.segment} delay={shouldReduceMotion ? 0 : i * 0.08}>
                <article
                  className={`group relative h-full p-7 sm:p-8 rounded-3xl border overflow-hidden ${softTransitionClass} ${softLiftClass} ${
                    isDark
                      ? "bg-white/[0.03] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]"
                      : shouldReduceMotion
                      ? "bg-white border-slate-200 hover:border-indigo-200/50 shadow-sm shadow-slate-200/25"
                      : "bg-white border-slate-200 hover:border-indigo-200/70 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-indigo-100/50"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex items-center justify-between gap-4 mb-5">
                    <h3 className={`font-heading text-xl sm:text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{segment.segment}</h3>
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                  </div>
                  <p className={`relative z-10 text-sm sm:text-base leading-relaxed mb-6 ${isDark ? "text-white/60" : "text-slate-600"}`}>{segment.summary}</p>
                  <ul className="relative z-10 space-y-3">
                    {segment.products.map((product) => (
                      <li key={product} className={`flex items-start gap-2.5 text-sm ${isDark ? "text-white/75" : "text-slate-700"}`}>
                        <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span>{product}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section className={`relative z-10 py-20 sm:py-28 px-4 border-t transition-colors duration-500 ${isDark ? "border-white/5 bg-white/[0.015]" : "border-slate-200 bg-slate-50/60"}`}>
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-12 sm:mb-16 text-center">
            <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.5em] mb-4">Package Pricing</p>
            <h2 className={`font-display text-5xl sm:text-7xl md:text-8xl uppercase tracking-tighter leading-[0.9] ${isDark ? "text-white" : "text-slate-900"}`}>
              Clear <span className="text-transparent italic" style={{ WebkitTextStroke: isDark ? "1px rgba(255,255,255,0.4)" : "1px rgba(15,23,42,0.35)" }}>Packages</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {pricingCards.map((pkg, i) => (
              <FadeUp key={pkg.tier} delay={shouldReduceMotion ? 0 : i * 0.1}>
                <article
                  className={`relative h-full rounded-3xl border p-8 sm:p-9 ${softTransitionClass} ${softLiftClass} overflow-hidden ${
                    pkg.highlight
                      ? isDark
                        ? "bg-gradient-to-b from-indigo-500/15 to-white/[0.04] border-indigo-400/40 shadow-xl shadow-indigo-900/20"
                        : shouldReduceMotion
                        ? "bg-gradient-to-b from-indigo-50 to-white border-indigo-200 shadow-md shadow-indigo-100/50"
                        : "bg-gradient-to-b from-indigo-50 to-white border-indigo-200 shadow-xl shadow-indigo-100/70"
                      : isDark
                      ? "bg-white/[0.03] border-white/[0.1]"
                      : shouldReduceMotion
                      ? "bg-white border-slate-200 shadow-sm shadow-slate-200/25"
                      : "bg-white border-slate-200 shadow-lg shadow-slate-200/40"
                  }`}
                >
                  {pkg.highlight && (
                    <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-300">
                      <Star className="h-3 w-3 fill-indigo-300" />
                      Recommended
                    </span>
                  )}
                  <div className={`mb-5 pb-5 border-b ${isDark ? "border-white/10" : "border-slate-200"}`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-400 mb-2">{pkg.tier} Package</p>
                    <p className={`font-display text-5xl sm:text-6xl leading-none mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>{pkg.formattedPrice}</p>
                    {pkg.studentPriceGhs && (
                      <span className={`inline-flex rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] border ${isDark ? "bg-indigo-500/10 text-indigo-300 border-indigo-400/30" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                        Students from {pkg.formattedStudentPrice}
                      </span>
                    )}
                  </div>
                  {pkg.onboardingLabel && (
                    <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-2 ${isDark ? "text-white/35" : "text-slate-400"}`}>{pkg.onboardingLabel}</p>
                  )}
                  <p className={`text-sm leading-relaxed mb-2 ${isDark ? "text-white/65" : "text-slate-600"}`}>{pkg.summary}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-6 ${isDark ? "text-white/45" : "text-slate-500"}`}>Best for: {pkg.bestFor}</p>

                  <ul className="space-y-3 mb-7">
                    {pkg.deliverables.map((deliverable) => (
                      <li key={deliverable} className={`flex items-start gap-2.5 text-sm ${isDark ? "text-white/75" : "text-slate-700"}`}>
                        <Layers className="h-4.5 w-4.5 text-indigo-400 mt-0.5 shrink-0" />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>

                  <div className={`space-y-2 pt-5 border-t ${isDark ? "border-white/10" : "border-slate-200"}`}>
                    <p className={`text-[11px] uppercase tracking-widest ${isDark ? "text-white/45" : "text-slate-500"}`}>Turnaround: <span className={`${isDark ? "text-white/75" : "text-slate-700"}`}>{pkg.turnaround}</span></p>
                    <p className={`text-[11px] uppercase tracking-widest ${isDark ? "text-white/45" : "text-slate-500"}`}>Support: <span className={`${isDark ? "text-white/75" : "text-slate-700"}`}>{pkg.support}</span></p>
                  </div>
                </article>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={shouldReduceMotion ? 0 : 0.1} className="mt-10 sm:mt-12">
            <div className={`rounded-3xl border p-6 sm:p-8 ${isDark ? "border-white/10 bg-white/[0.03]" : shouldReduceMotion ? "border-slate-200 bg-white shadow-sm shadow-slate-200/30" : "border-slate-200 bg-white shadow-lg shadow-slate-200/40"}`}>
              <p className="text-indigo-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">How To Choose</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <div>
                  <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Standard</p>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-white/65" : "text-slate-600"}`}>Best for first launch websites, student portfolios, and simple landing pages.</p>
                </div>
                <div>
                  <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Premium</p>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-white/65" : "text-slate-600"}`}>Choose this for business growth with stronger funnel, content depth, and integrations.</p>
                </div>
                <div>
                  <p className={`text-sm font-bold uppercase tracking-wider mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Executive</p>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-white/65" : "text-slate-600"}`}>Ideal for product teams that need advanced architecture, polish, and strategic delivery.</p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className={`relative z-10 py-20 sm:py-28 px-4 border-t transition-colors duration-500 ${isDark ? "border-white/5" : "border-slate-200"}`}>
        <div className="max-w-4xl mx-auto text-center">
          <FadeUp>
            <h2 className={`font-display text-5xl sm:text-7xl uppercase tracking-tighter leading-[0.9] mb-6 ${isDark ? "text-white" : "text-slate-900"}`}>
              Ready to Build?
            </h2>
            <p className={`text-base sm:text-lg font-light leading-relaxed mb-10 ${isDark ? "text-white/60" : "text-slate-600"}`}>
              Start with Standard, move to Premium, or go Executive from day one. More package customizations can be added as your roadmap evolves.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? "/submit-project" : "/register"}
                className={`group relative flex items-center gap-3 px-9 py-4 rounded-full font-bold uppercase tracking-[0.2em] text-[11px] overflow-hidden transition-all duration-300 active:scale-95 ${
                  isDark ? "bg-white text-black" : "bg-slate-900 text-white"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">{user ? "Submit Project" : "Get Started"}</span>
                <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
              </Link>
              <Link
                to="/contact"
                className={`px-9 py-4 rounded-full border font-bold uppercase tracking-[0.2em] text-[11px] transition-all duration-300 ${
                  isDark ? "border-white/20 text-white hover:border-white/50 hover:bg-white/5" : "border-slate-300 text-slate-700 hover:border-slate-900 hover:bg-slate-50"
                }`}
              >
                Discuss Custom Scope
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </div>
  );
};
