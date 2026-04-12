import { Category, Project } from "../types";
import { mediaSrc } from "./media-url";

const SHOWCASE_STATUSES: Project["status"][] = ["APPROVED", "IN_PROGRESS", "COMPLETED"];

const categoryImageMap: Record<Category, string[]> = {
  Website: [
    "https://images.pexels.com/photos/5077048/pexels-photo-5077048.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "E-commerce": [
    "https://images.pexels.com/photos/5699467/pexels-photo-5699467.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  Portfolio: [
    "https://images.pexels.com/photos/326518/pexels-photo-326518.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Web Application": [
    "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Mobile App": [
    "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Desktop Software": [
    "https://images.pexels.com/photos/546819/pexels-photo-546819.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "AI / Machine Learning": [
    "https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Blockchain / Web3": [
    "https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  "Cloud Infrastructure": [
    "https://images.pexels.com/photos/325229/pexels-photo-325229.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  Cybersecurity: [
    "https://images.pexels.com/photos/5380664/pexels-photo-5380664.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
  Other: [
    "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1600",
  ],
};

const curatedShowcaseProjects: Project[] = [
  {
    id: "curated-edu-campus-web",
    title: "EduCampus Student Portal",
    description:
      "A complete university digital portal for admissions, class registration, lecture resources, and secure payments. Built for high traffic, low-latency access, and clean student UX.",
    category: "Web Application",
    tags: ["education", "portal", "payments", "dashboard"],
    budget: "GH₵ 10,000 - GH₵ 25,000",
    timeline: "3-6 months",
    status: "COMPLETED",
    featured: true,
    userId: "curated-client-1",
    user: {
      id: "curated-client-1",
      name: "Campus Product Team",
      email: "showcase@makerslab.local",
      role: "USER",
    },
    createdAt: "2026-01-14T09:00:00.000Z",
    updatedAt: "2026-03-20T15:30:00.000Z",
  },
  {
    id: "curated-retail-commerce-suite",
    title: "Retail Commerce Suite",
    description:
      "An end-to-end e-commerce platform with inventory sync, checkout optimization, delivery tracking, and sales analytics for scaling retail operations.",
    category: "E-commerce",
    tags: ["retail", "checkout", "inventory", "analytics"],
    budget: "GH₵ 25,000+",
    timeline: "3-6 months",
    status: "COMPLETED",
    featured: true,
    userId: "curated-client-2",
    user: {
      id: "curated-client-2",
      name: "Market Operations Lead",
      email: "showcase@makerslab.local",
      role: "USER",
    },
    createdAt: "2025-11-02T11:00:00.000Z",
    updatedAt: "2026-02-10T14:00:00.000Z",
  },
  {
    id: "curated-health-mobile-app",
    title: "CareLink Mobile Experience",
    description:
      "A healthcare mobile app focused on appointment booking, digital records, and secure practitioner messaging with accessibility-first interface patterns.",
    category: "Mobile App",
    tags: ["healthcare", "mobile", "appointments", "accessibility"],
    budget: "GH₵ 10,000 - GH₵ 25,000",
    timeline: "1-3 months",
    status: "IN_PROGRESS",
    featured: true,
    userId: "curated-client-3",
    user: {
      id: "curated-client-3",
      name: "Digital Health Team",
      email: "showcase@makerslab.local",
      role: "USER",
    },
    createdAt: "2026-02-01T08:30:00.000Z",
    updatedAt: "2026-04-05T13:45:00.000Z",
  },
  {
    id: "curated-finsec-platform",
    title: "FinSec Compliance Console",
    description:
      "A cybersecurity and compliance dashboard for transaction monitoring, role-based audit trails, and threat signal triage for regulated fintech teams.",
    category: "Cybersecurity",
    tags: ["fintech", "compliance", "audit", "security"],
    budget: "GH₵ 25,000+",
    timeline: "3-6 months",
    status: "APPROVED",
    featured: false,
    userId: "curated-client-4",
    user: {
      id: "curated-client-4",
      name: "Risk & Compliance Unit",
      email: "showcase@makerslab.local",
      role: "USER",
    },
    createdAt: "2026-01-28T10:10:00.000Z",
    updatedAt: "2026-03-17T09:30:00.000Z",
  },
  {
    id: "curated-ai-support-platform",
    title: "AI Support Operations Hub",
    description:
      "An AI-assisted support platform with intent routing, response suggestions, and service metrics for enterprise customer success teams.",
    category: "AI / Machine Learning",
    tags: ["ai", "support", "automation", "insights"],
    budget: "GH₵ 10,000 - GH₵ 25,000",
    timeline: "1-3 months",
    status: "COMPLETED",
    featured: false,
    userId: "curated-client-5",
    user: {
      id: "curated-client-5",
      name: "Service Innovation Team",
      email: "showcase@makerslab.local",
      role: "USER",
    },
    createdAt: "2025-12-09T16:15:00.000Z",
    updatedAt: "2026-03-08T12:20:00.000Z",
  },
  {
    id: "curated-startup-brand-site",
    title: "LaunchPad Venture Website",
    description:
      "A premium startup website with conversion-focused landing flows, investor narrative sections, and modular CMS-ready content architecture.",
    category: "Website",
    tags: ["startup", "branding", "landing", "content"],
    budget: "GH₵ 5,000 - GH₵ 10,000",
    timeline: "1-3 months",
    status: "COMPLETED",
    featured: false,
    userId: "curated-client-6",
    user: {
      id: "curated-client-6",
      name: "Founders Studio",
      email: "showcase@makerslab.local",
      role: "USER",
    },
    createdAt: "2025-10-21T07:50:00.000Z",
    updatedAt: "2026-01-11T11:05:00.000Z",
  },
];

const statusWeight: Record<Project["status"], number> = {
  COMPLETED: 4,
  IN_PROGRESS: 3,
  APPROVED: 2,
  IN_REVIEW: 1,
  PENDING: 0,
  REJECTED: -1,
};

function sortProjects(a: Project, b: Project): number {
  const featureDelta = Number(b.featured) - Number(a.featured);
  if (featureDelta !== 0) return featureDelta;

  const statusDelta = (statusWeight[b.status] || 0) - (statusWeight[a.status] || 0);
  if (statusDelta !== 0) return statusDelta;

  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function uploadedImagePath(project: Project): string | undefined {
  return project.files?.find((f) => f.mimeType?.startsWith("image/"))?.path;
}

function categoryImage(category: Category, projectId: string): string {
  const list = categoryImageMap[category] || categoryImageMap.Other;
  const index = Math.abs(projectId.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % list.length;
  return list[index];
}

function hasMeaningfulContent(project: Project): boolean {
  return project.title.trim().length > 4 && project.description.trim().length > 40;
}

export function isShowcaseReadyProject(project: Project): boolean {
  return SHOWCASE_STATUSES.includes(project.status) && hasMeaningfulContent(project);
}

export function curateShowcaseProjects(projects: Project[], minItems: number = 8): Project[] {
  const backendShowcase = projects
    .filter(isShowcaseReadyProject)
    .sort(sortProjects);

  if (backendShowcase.length >= minItems) {
    return backendShowcase;
  }

  const existingIds = new Set(backendShowcase.map((p) => p.id));
  const fallback = curatedShowcaseProjects.filter((p) => !existingIds.has(p.id));
  const merged = [...backendShowcase, ...fallback].sort(sortProjects);
  return merged.slice(0, Math.max(minItems, backendShowcase.length));
}

export function resolveProjectShowcaseImage(project: Project): string {
  const uploaded = uploadedImagePath(project);
  if (uploaded) return mediaSrc(uploaded, categoryImage(project.category, project.id));
  return categoryImage(project.category, project.id);
}

export function pickFeaturedShowcase(projects: Project[], count: number = 3): Project[] {
  const curated = curateShowcaseProjects(projects, count);
  const featuredFirst = curated.filter((p) => p.featured);
  const pool = featuredFirst.length ? featuredFirst : curated;
  return pool.slice(0, count);
}
