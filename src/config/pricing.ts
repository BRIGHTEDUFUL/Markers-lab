import { PricingPackage, SegmentProductAlignment } from "../types";

export const USER_SEGMENT_SOLUTIONS: SegmentProductAlignment[] = [
  {
    segment: "Students",
    summary: "Affordable launch support for portfolios, school projects, and internship visibility.",
    products: ["Portfolio Website", "CV/Resume Site", "Capstone Showcase", "Contact Form"],
  },
  {
    segment: "Freelancers",
    summary: "Build a service brand that attracts leads and turns visits into client calls.",
    products: ["Service Website", "Lead Capture Funnel", "Client Intake Form", "Payment Setup"],
  },
  {
    segment: "Entrepreneurs",
    summary: "Create a polished digital foundation for product launches and market growth.",
    products: ["Business Website", "Sales Funnel", "CRM Integration", "Brand Story Experience"],
  },
  {
    segment: "Startups",
    summary: "Ship MVPs quickly with structure that can grow with your team.",
    products: ["MVP Web App", "Auth + Roles", "Analytics Dashboard", "Growth Landing Page"],
  },
  {
    segment: "Small Businesses",
    summary: "Digitize daily operations and make customer interactions easier.",
    products: ["Company Website", "Online Ordering", "Appointment Booking", "WhatsApp Integration"],
  },
  {
    segment: "Creators",
    summary: "Convert audience attention into digital products and recurring revenue.",
    products: ["Creator Hub", "Digital Product Store", "Newsletter Stack", "Membership Access"],
  },
];

export const PRICING_PACKAGES: PricingPackage[] = [
  {
    tier: "Standard",
    priceGhs: 350,
    studentPriceGhs: 199,
    onboardingLabel: "Best entry point",
    bestFor: "Students and early solo builders",
    summary: "Clear starter package for getting online quickly with the essentials.",
    deliverables: [
      "1 focused landing page",
      "Mobile and desktop responsive design",
      "Basic inquiry/contact form",
      "Core SEO and performance setup",
    ],
    turnaround: "4-7 working days",
    support: "7-day post-launch support",
  },
  {
    tier: "Premium",
    priceGhs: 1200,
    onboardingLabel: "Most selected",
    bestFor: "Freelancers and growing businesses",
    summary: "Balanced package for stronger brand presence, conversion flow, and integrations.",
    deliverables: [
      "Up to 5 pages or screens",
      "Brand-aligned modern UI system",
      "Lead funnel with analytics",
      "Email, form, or payment integration",
    ],
    turnaround: "8-14 working days",
    support: "14-day priority support",
    highlight: true,
  },
  {
    tier: "Executive",
    priceGhs: 3200,
    onboardingLabel: "For scaling teams",
    bestFor: "Entrepreneurs, startups, and teams scaling",
    summary: "Strategic package for product-heavy builds that need depth, speed, and polish.",
    deliverables: [
      "Custom product architecture",
      "Advanced interaction and conversion design",
      "Performance tuning and QA hardening",
      "Handoff docs and growth roadmap",
    ],
    turnaround: "2-5 weeks",
    support: "30-day dedicated support",
  },
];
