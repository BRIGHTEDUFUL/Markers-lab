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
            <p className="text-primary text-label-sm font-label-sm uppercase tracking-[0.5em] mb-4">Simple Pricing</p>
            <h1 className="font-headline-xl text-headline-xl text-[clamp(2.5rem,6vw,84px)] leading-[0.9] uppercase tracking-tighter text-on-surface">
              Pick The <span className="text-gradient">Right Package</span>
            </h1>
            <p className="max-w-3xl mx-auto mt-8 text-body-lg text-on-surface-variant/80 leading-relaxed">
              Start with Standard, grow into Premium, or scale with Executive. Every package is priced in Ghana Cedi and tailored for practical outcomes.
            </p>
          </FadeUp>

          <FadeUp delay={shouldReduceMotion ? 0 : 0.08} className="mt-10">
            <div className="mx-auto max-w-5xl rounded-3xl border px-5 py-4 sm:px-7 sm:py-6 grid grid-cols-1 md:grid-cols-3 gap-4 border-outline-variant bg-surface-container-low/40">
              <div className="text-left">
                <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] text-primary mb-1">1. Choose your level</p>
                <p className="text-body-md text-on-surface-variant/85">Select Standard, Premium, or Executive based on project depth.</p>
              </div>
              <div className="text-left">
                <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] text-primary mb-1">2. Submit your brief</p>
                <p className="text-body-md text-on-surface-variant/85">We align timeline, scope, and delivery plan with your selected package.</p>
              </div>
              <div className="text-left">
                <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] text-primary mb-1">3. Start execution</p>
                <p className="text-body-md text-on-surface-variant/85">Your build starts with clear milestones and measurable deliverables.</p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="relative z-10 py-20 sm:py-24 px-4 border-t border-outline-variant">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-12 sm:mb-14">
            <p className="text-primary text-label-sm font-label-sm uppercase tracking-[0.5em] mb-4">User Categories</p>
            <h2 className="font-headline-lg text-headline-lg uppercase tracking-tighter text-on-surface">Who It Is For</h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {USER_SEGMENT_SOLUTIONS.map((segment, i) => (
              <FadeUp key={segment.segment} delay={shouldReduceMotion ? 0 : i * 0.08}>
                <article
                  className="group relative h-full p-7 sm:p-8 rounded-3xl border border-outline-variant overflow-hidden bg-surface-container-low/40 hover:border-primary/30 transition-all duration-500 hover:-translate-y-1"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative z-10 flex items-center justify-between gap-4 mb-5">
                    <h3 className="font-headline-md text-headline-md uppercase text-on-surface">{segment.segment}</h3>
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <p className="relative z-10 text-body-md text-on-surface-variant/80 leading-relaxed mb-6">{segment.summary}</p>
                  <ul className="relative z-10 space-y-3">
                    {segment.products.map((product) => (
                      <li key={product} className="flex items-start gap-2.5 text-body-md text-on-surface-variant">
                        <CheckCircle2 className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
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

      <section className="relative z-10 py-20 sm:py-28 px-4 border-t border-outline-variant bg-surface-container-lowest/50">
        <div className="max-w-7xl mx-auto">
          <FadeUp className="mb-12 sm:mb-16 text-center">
            <p className="text-primary text-label-sm font-label-sm uppercase tracking-[0.5em] mb-4">Package Pricing</p>
            <h2 className="font-headline-xl text-headline-xl uppercase tracking-tighter leading-[0.9] text-on-surface">
              Clear <span className="text-gradient">Packages</span>
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {pricingCards.map((pkg, i) => (
              <FadeUp key={pkg.tier} delay={shouldReduceMotion ? 0 : i * 0.1}>
                <article
                  className={`relative h-full rounded-3xl border p-8 sm:p-9 transition-all duration-500 hover:-translate-y-1 overflow-hidden ${
                    pkg.highlight
                      ? "bg-gradient-to-b from-primary/10 to-surface-container-lowest border-primary/40 shadow-xl shadow-primary/10"
                      : "bg-surface-container-low/40 border-outline-variant"
                  }`}
                >
                  {pkg.highlight && (
                    <span className="absolute top-5 right-5 inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-label-sm font-label-sm text-primary">
                      <Star className="h-3 w-3 fill-primary" />
                      Recommended
                    </span>
                  )}
                  <div className="mb-5 pb-5 border-b border-outline-variant">
                    <p className="text-label-sm font-label-sm uppercase tracking-[0.25em] text-primary mb-2">{pkg.tier} Package</p>
                    <p className="font-headline-lg text-headline-lg text-on-surface leading-none mb-2">{pkg.formattedPrice}</p>
                    {pkg.studentPriceGhs && (
                      <span className="inline-flex rounded-full px-3 py-1 text-label-sm font-label-sm uppercase tracking-[0.2em] border border-outline-variant bg-surface-container text-on-surface-variant">
                        Students from {pkg.formattedStudentPrice}
                      </span>
                    )}
                  </div>
                  {pkg.onboardingLabel && (
                    <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] mb-2 text-on-surface-variant/60">{pkg.onboardingLabel}</p>
                  )}
                  <p className="text-body-md text-on-surface-variant/80 leading-relaxed mb-2">{pkg.summary}</p>
                  <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] mb-6 text-on-surface-variant/70">Best for: {pkg.bestFor}</p>

                  <ul className="space-y-3 mb-7">
                    {pkg.deliverables.map((deliverable) => (
                      <li key={deliverable} className="flex items-start gap-2.5 text-body-md text-on-surface-variant">
                        <Layers className="h-4.5 w-4.5 text-primary mt-0.5 shrink-0" />
                        <span>{deliverable}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-2 pt-5 border-t border-outline-variant">
                    <p className="text-label-sm font-label-sm uppercase tracking-widest text-on-surface-variant/60">Turnaround: <span className="text-on-surface font-semibold">{pkg.turnaround}</span></p>
                    <p className="text-label-sm font-label-sm uppercase tracking-widest text-on-surface-variant/60">Support: <span className="text-on-surface font-semibold">{pkg.support}</span></p>
                  </div>
                </article>
              </FadeUp>
            ))}
          </div>

          <FadeUp delay={shouldReduceMotion ? 0 : 0.1} className="mt-10 sm:mt-12">
            <div className="rounded-3xl border border-outline-variant p-6 sm:p-8 bg-surface-container-low/40">
              <p className="text-primary text-label-sm font-label-sm uppercase tracking-[0.4em] mb-4">How To Choose</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
                <div>
                  <p className="text-label-sm font-label-sm uppercase tracking-wider mb-2 text-on-surface">Standard</p>
                  <p className="text-body-md text-on-surface-variant/80 leading-relaxed">Best for first launch websites, student portfolios, and simple landing pages.</p>
                </div>
                <div>
                  <p className="text-label-sm font-label-sm uppercase tracking-wider mb-2 text-on-surface">Premium</p>
                  <p className="text-body-md text-on-surface-variant/80 leading-relaxed">Choose this for business growth with stronger funnel, content depth, and integrations.</p>
                </div>
                <div>
                  <p className="text-label-sm font-label-sm uppercase tracking-wider mb-2 text-on-surface">Executive</p>
                  <p className="text-body-md text-on-surface-variant/80 leading-relaxed">Ideal for product teams that need advanced architecture, polish, and strategic delivery.</p>
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="relative z-10 py-20 sm:py-28 px-4 border-t border-outline-variant">
        <div className="max-w-4xl mx-auto text-center">
          <FadeUp>
            <h2 className="font-headline-lg text-headline-lg uppercase tracking-tighter leading-[0.9] mb-6 text-on-surface">
              Ready to Build?
            </h2>
            <p className="text-body-lg text-on-surface-variant/80 leading-relaxed mb-10">
              Start with Standard, move to Premium, or go Executive from day one. More package customizations can be added as your roadmap evolves.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to={user ? "/submit-project" : "/register"}
                className="group relative flex items-center gap-3 px-9 py-4 rounded-full font-label-sm text-label-sm uppercase tracking-[0.2em] overflow-hidden transition-all duration-300 active:scale-95 bg-primary text-on-primary hover:brightness-110 shadow-lg shadow-primary/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary translate-y-full group-hover:translate-y-0 transition-transform duration-500 rounded-full" />
                <span className="relative z-10 group-hover:text-white transition-colors duration-300">{user ? "Submit Project" : "Get Started"}</span>
                <ArrowRight className="relative z-10 h-4 w-4 group-hover:translate-x-1 group-hover:text-white transition-all duration-300" />
              </Link>
              <Link
                to="/contact"
                className="px-9 py-4 rounded-full border border-outline-variant font-label-sm text-label-sm uppercase tracking-[0.2em] transition-all duration-300 bg-surface-container-low text-on-surface hover:border-on-surface/20"
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
