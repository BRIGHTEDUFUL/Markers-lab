export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarUrl?: string;
  createdAt?: string;
  _count?: {
    projects: number;
  };
}

export type Category = 
  | "Website"
  | "E-commerce"
  | "Portfolio"
  | "Web Application"
  | "Mobile App"
  | "Desktop Software"
  | "AI / Machine Learning"
  | "Blockchain / Web3"
  | "Cloud Infrastructure"
  | "Cybersecurity"
  | "Other";

export type Timeline = 
  | "Less than 1 month"
  | "1-3 months"
  | "3-6 months"
  | "6+ months"
  | "Flexible";

export type BudgetRange =
  | "Under $5,000"
  | "$5,000 - $10,000"
  | "$10,000 - $25,000"
  | "$25,000 - $50,000"
  | "$50,000+"
  | "GH₵ 300 - GH₵ 1,000"
  | "GH₵ 1,000 - GH₵ 5,000"
  | "GH₵ 5,000 - GH₵ 10,000"
  | "GH₵ 10,000 - GH₵ 25,000"
  | "GH₵ 25,000+";

export type UserSegment =
  | "Students"
  | "Freelancers"
  | "Entrepreneurs"
  | "Startups"
  | "Small Businesses"
  | "Creators";

export type PricingTier = "Standard" | "Premium" | "Executive";

export interface SegmentProductAlignment {
  segment: UserSegment;
  summary: string;
  products: string[];
}

export interface PricingPackage {
  tier: PricingTier;
  priceGhs: number;
  studentPriceGhs?: number;
  onboardingLabel?: string;
  bestFor: string;
  summary: string;
  deliverables: string[];
  turnaround: string;
  support: string;
  highlight?: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: Category;
  tags: string[];
  budget: BudgetRange;
  timeline: Timeline;
  packageTier?: PricingTier;
  status: "PENDING" | "IN_REVIEW" | "APPROVED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED";
  repoUrl?: string;
  featured: boolean;
  userId: string;
  user?: User;
  files?: File[];
  adminNotes?: AdminNote[];
  testimonial?: Testimonial;
  createdAt: string;
  updatedAt: string;
}

export interface File {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  path: string;
  type: string;
  projectId?: string;
  createdAt: string;
}

export interface Testimonial {
  id: string;
  rating: number;
  text: string;
  isApproved: boolean;
  userId: string;
  projectId: string;
  user?: User;
  project?: Project;
  createdAt: string;
}

export interface AdminNote {
  id: string;
  note: string;
  projectId: string;
  adminId: string;
  createdAt: string;
  admin?: User;
}

export interface Analytics {
  totalProjects: number;
  totalUsers: number;
  statusCounts: { status: string; _count: number }[];
  categoryCounts: { category: string; _count: number }[];
}

export interface SubmissionNotification {
  id: string;
  projectId: string;
  userId: string;
  officialEmail: string;
  deliveryStatus: "QUEUED" | "SENT" | "FAILED";
  deliveryError?: string;
  dispatchedAt?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  payload?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  user?: User;
}

export interface LoginAttempt {
  id: string;
  email: string;
  user_id?: string;
  success: boolean;
  failed_reason?: string;
  ip_address: string;
  user_agent: string;
  device_fingerprint?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: string;
  error_message?: string;
  created_at: string;
}

export interface SecurityStats {
  loginAttempts: LoginAttempt[];
  auditLogs: AuditLog[];
  bruteForceAttempts: Array<{
    ip: string;
    count: number;
    lastAttempt: string;
  }>;
  failedLoginsByEmail: Array<{
    email: string;
    count: number;
    lastAttempt: string;
  }>;
}
