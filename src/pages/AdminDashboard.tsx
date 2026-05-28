import React, { lazy, Suspense, useDeferredValue, useMemo, useState, useEffect, useRef } from "react";
import {
  fetchAdminProjects,
  fetchAdminAnalytics,
  fetchAdminUsers,
  fetchAdminTestimonials,
  fetchAdminSubmissionNotifications,
  adminUpdateProject,
  adminDeleteProject,
  adminBulkUpdateProjects,
  adminBulkDeleteProjects,
  adminAcknowledgeSubmissionNotification,
  adminRetrySubmissionNotificationEmail,
  adminSetUserRole,
  adminDeleteUserProfile,
  adminSetTestimonialApproved,
  adminDeleteTestimonial,
  adminDeleteProjectFile,
  adminDeleteAdminNote,
  adminUpdateUserProfile,
  adminReassignProject,
} from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { 
  Search, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle, 
  Clock, AlertCircle, Download, ExternalLink, Star, MessageSquare, 
  Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, User as UserIcon, Calendar, Tag, 
  DollarSign, Clock as ClockIcon, FileText, BarChart3, Users, Briefcase, Image, Rocket, Shield, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import PageHero from "../components/PageHero";
import LazyMarkdown from "../components/LazyMarkdown";
import { getRecentRoutePerf } from "../lib/route-performance";
import { Project, User, Analytics, Testimonial, SubmissionNotification } from "../types";
import { resolveProjectShowcaseImage } from "../lib/gallery-showcase";
import { SHOWCASE_CARD_DURATION, SHOWCASE_CARD_STAGGER, SHOWCASE_EASE } from "../lib/showcase-motion";

const SecurityMonitoring = lazy(() =>
  import("../components/SecurityMonitoring").then((m) => ({ default: m.SecurityMonitoring }))
);
const AdminOverviewCharts = lazy(() => import("../components/charts/AdminOverviewCharts"));

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const DELIVERY_COLORS: Record<SubmissionNotification["deliveryStatus"], string> = {
  QUEUED: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  SENT: "bg-green-500/10 text-green-500 border-green-500/20",
  FAILED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const CATEGORIES = ["Website", "E-commerce", "Portfolio", "Web Application", "Mobile App", "Desktop Software", "AI / Machine Learning", "Blockchain / Web3", "Cloud Infrastructure", "Cybersecurity", "Other"];
const STATUSES = ["PENDING", "IN_REVIEW", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED"];

type GodModeRow = {
  id: string;
  primary: string;
  secondary: string;
  status: string;
  timestamp: string;
  sortTs: number;
  entityType: "PROJECT" | "USER" | "TESTIMONIAL";
  entityId: string;
};

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [submissionNotifications, setSubmissionNotifications] = useState<SubmissionNotification[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [testimonialSearch, setTestimonialSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [featuredFilter, setFeaturedFilter] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNote, setAdminNote] = useState("");
  const [view, setView] = useState<"OVERVIEW" | "SUBMISSIONS" | "GALLERY" | "USERS" | "TESTIMONIALS" | "SECURITY" | "GODMODE">("OVERVIEW");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [userBeingEdited, setUserBeingEdited] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [reassignUserId, setReassignUserId] = useState("");
  const [godModeEnabled, setGodModeEnabled] = useState(false);
  const [godModePhrase, setGodModePhrase] = useState("");
  const [godModeBusy, setGodModeBusy] = useState(false);
  const [godModeModule, setGodModeModule] = useState<"PROJECTS" | "USERS" | "SUBMISSIONS" | "TASKS" | "ACTIVITY">("PROJECTS");
  const [godModeSearch, setGodModeSearch] = useState("");
  const [godModePage, setGodModePage] = useState(1);
  const [godModePageSize, setGodModePageSize] = useState(8);
  const [selectedGodRows, setSelectedGodRows] = useState<string[]>([]);
  const [godModeSort, setGodModeSort] = useState<{ key: "primary" | "status" | "timestamp"; direction: "asc" | "desc" }>({
    key: "timestamp",
    direction: "desc",
  });
  const [godPreset, setGodPreset] = useState("Custom");
  const [godCommandQuery, setGodCommandQuery] = useState("");
  const [perfRefreshTick, setPerfRefreshTick] = useState(0);
  const godCommandInputRef = useRef<HTMLInputElement | null>(null);

  const fetchData = async (): Promise<Project[] | undefined> => {
    try {
      const [p, a, u, t, notifications] = await Promise.all([
        fetchAdminProjects(),
        fetchAdminAnalytics(),
        fetchAdminUsers(),
        fetchAdminTestimonials(),
        fetchAdminSubmissionNotifications(100),
      ]);
      setProjects(Array.isArray(p) ? p : []);
      setAnalytics(a || null);
      setUsers(Array.isArray(u) ? u : []);
      setTestimonials(Array.isArray(t) ? t : []);
      setSubmissionNotifications(Array.isArray(notifications) ? notifications : []);
      return p;
    } catch (err) {
      console.error("Failed to fetch admin data");
    } finally {
      setLoading(false);
    }
    return undefined;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedProject?.userId) setReassignUserId(selectedProject.userId);
  }, [selectedProject?.id, selectedProject?.userId]);

  const handleUpdateStatus = async (projectId: string, status: string, closeModal = true) => {
    setIsUpdating(true);
    try {
      await adminUpdateProject(projectId, { status, adminNote }, user?.id);
      setAdminNote("");
      const list = await fetchData();
      const updatedProject = list?.find((p) => p.id === projectId);
      if (closeModal) setSelectedProject(null);
      else if (updatedProject) setSelectedProject(updatedProject);
    } catch (err) {
      console.error("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFeatured = async (projectId: string, featured: boolean) => {
    try {
      await adminUpdateProject(projectId, { featured }, user?.id);
      const list = await fetchData();
      const updatedProject = list?.find((p) => p.id === projectId);
      if (selectedProject?.id === projectId && updatedProject) setSelectedProject(updatedProject);
    } catch (err) {
      console.error("Failed to toggle featured");
    }
  };

  const handleDeleteProject = (projectId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "DELETE PROJECT?",
      message: "ARE YOU SURE YOU WANT TO DELETE THIS PROJECT? THIS ACTION CANNOT BE UNDONE.",
      onConfirm: async () => {
        try {
          await adminDeleteProject(projectId);
          setProjects((prev) => prev.filter((p) => p.id !== projectId));
          fetchData();
        } catch (err) {
          console.error("Failed to delete project");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    if (userId === user?.id && role !== "ADMIN") {
      toast.error("YOU CANNOT DEMOTE YOURSELF. ANOTHER ADMIN MUST CHANGE YOUR ROLE.");
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: "CHANGE USER ROLE?",
      message: `ARE YOU SURE YOU WANT TO CHANGE THIS USER'S ROLE TO ${role}?`,
      onConfirm: async () => {
        try {
          await adminSetUserRole(userId, role as "USER" | "ADMIN");
          setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: role as User["role"] } : u)));
          toast.success(`USER ROLE UPDATED TO ${role}`);
        } catch (err) {
          console.error("Failed to update user role");
          toast.error("FAILED TO UPDATE USER ROLE");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteUser = (userId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "DELETE USER?",
      message: "ARE YOU SURE YOU WANT TO DELETE THIS USER? ALL THEIR PROJECTS WILL BE REMOVED.",
      onConfirm: async () => {
        try {
          await adminDeleteUserProfile(userId);
          setUsers((prev) => prev.filter((u) => u.id !== userId));
          toast.success("USER DELETED SUCCESSFULLY");
          fetchData();
        } catch (err) {
          console.error("Failed to delete user");
          toast.error("FAILED TO DELETE USER");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedProjects.length === 0) return;
    const n = selectedProjects.length;
    setIsUpdating(true);
    try {
      await adminBulkUpdateProjects(selectedProjects, { status: bulkStatus });
      setProjects((prev) =>
        prev.map((p) => (selectedProjects.includes(p.id) ? { ...p, status: bulkStatus as Project["status"] } : p))
      );
      setSelectedProjects([]);
      setBulkStatus("");
      toast.success(`UPDATED ${n} PROJECTS TO ${bulkStatus}`);
      fetchData();
    } catch (err) {
      console.error("Failed to update projects in bulk");
      toast.error("FAILED TO UPDATE PROJECTS");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedProjects.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: `DELETE ${selectedProjects.length} PROJECTS?`,
      message: "ARE YOU SURE YOU WANT TO DELETE THESE PROJECTS? THIS ACTION CANNOT BE UNDONE.",
      onConfirm: async () => {
        const n = selectedProjects.length;
        const ids = [...selectedProjects];
        try {
          await adminBulkDeleteProjects(ids);
          setProjects((prev) => prev.filter((p) => !ids.includes(p.id)));
          setSelectedProjects([]);
          toast.success(`DELETED ${n} PROJECTS`);
          fetchData();
        } catch (err) {
          console.error("Failed to delete projects in bulk");
          toast.error("FAILED TO DELETE PROJECTS");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleUpdateTestimonialStatus = async (testimonialId: string, isApproved: boolean) => {
    try {
      await adminSetTestimonialApproved(testimonialId, isApproved);
      setTestimonials((prev) => prev.map((t) => (t.id === testimonialId ? { ...t, isApproved } : t)));
      toast.success(isApproved ? "TESTIMONIAL APPROVED" : "TESTIMONIAL UNAPPROVED");
    } catch (err) {
      console.error("Failed to update testimonial status");
      toast.error("FAILED TO UPDATE TESTIMONIAL");
    }
  };

  const refreshSelectedProject = async (projectId: string) => {
    const list = await fetchData();
    const updated = list?.find((p) => p.id === projectId);
    if (updated) setSelectedProject(updated);
  };

  const handleAdminDeleteFile = (fileId: string, projectId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "DELETE FILE?",
      message: "Remove this attachment from storage and the database?",
      onConfirm: async () => {
        try {
          await adminDeleteProjectFile(fileId);
          await refreshSelectedProject(projectId);
          toast.success("FILE REMOVED");
        } catch {
          toast.error("FAILED TO DELETE FILE");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDeleteAdminNote = (noteId: string, projectId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "DELETE NOTE?",
      message: "Remove this internal note permanently?",
      onConfirm: async () => {
        try {
          await adminDeleteAdminNote(noteId);
          await refreshSelectedProject(projectId);
          toast.success("NOTE DELETED");
        } catch {
          toast.error("FAILED TO DELETE NOTE");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleReassignProject = async () => {
    if (!selectedProject || !reassignUserId) return;
    try {
      await adminReassignProject(selectedProject.id, reassignUserId);
      await refreshSelectedProject(selectedProject.id);
      toast.success("PROJECT REASSIGNED");
    } catch {
      toast.error("FAILED TO REASSIGN");
    }
  };

  const openUserEdit = (u: User) => {
    setUserBeingEdited(u);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
  };

  const saveUserEdit = async () => {
    if (!userBeingEdited) return;
    try {
      await adminUpdateUserProfile(userBeingEdited.id, {
        display_name: editUserName,
        email: editUserEmail || null,
      });
      toast.success("USER PROFILE UPDATED");
      setUserBeingEdited(null);
      fetchData();
    } catch {
      toast.error("FAILED TO UPDATE USER");
    }
  };

  const handleDeleteTestimonial = (testimonialId: string) => {
    setConfirmModal({
      isOpen: true,
      title: "DELETE TESTIMONIAL?",
      message: "ARE YOU SURE YOU WANT TO DELETE THIS TESTIMONIAL?",
      onConfirm: async () => {
        try {
          await adminDeleteTestimonial(testimonialId);
          setTestimonials((prev) => prev.filter((t) => t.id !== testimonialId));
          toast.success("TESTIMONIAL DELETED");
        } catch (err) {
          console.error("Failed to delete testimonial");
          toast.error("FAILED TO DELETE TESTIMONIAL");
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleExportData = () => {
    const data = projects.map(p => ({
      Title: p.title,
      User: p.user?.name ?? "",
      Email: p.user?.email ?? "",
      Status: p.status,
      Category: p.category,
      Budget: p.budget,
      Timeline: p.timeline,
      Created: format(new Date(p.createdAt), "yyyy-MM-dd HH:mm:ss")
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `makerslab_projects_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortConfig?.key !== field) return <ChevronDown className={`ml-2 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />;
    return sortConfig.direction === 'asc' ? <ChevronUp className="ml-2 h-3 w-3 text-indigo-500" /> : <ChevronDown className="ml-2 h-3 w-3 text-indigo-500" />;
  };

  const deferredProjectSearch = useDeferredValue(search);
  const deferredUserSearch = useDeferredValue(userSearch);
  const deferredTestimonialSearch = useDeferredValue(testimonialSearch);

  const normalizedProjectSearch = deferredProjectSearch.trim().toLowerCase();
  const normalizedUserSearch = deferredUserSearch.trim().toLowerCase();
  const normalizedTestimonialSearch = deferredTestimonialSearch.trim().toLowerCase();
  const isOverviewView = view === "OVERVIEW";
  const isUsersView = view === "USERS";
  const isTestimonialsView = view === "TESTIMONIALS";
  const isGodModeView = view === "GODMODE";
  const needsSubmissionRows = view === "SUBMISSIONS" || isGodModeView;

  const pendingProjectsCount = useMemo(
    () => projects.filter((p) => p.status === "PENDING").length,
    [projects]
  );

  const featuredProjects = useMemo(() => projects.filter((p) => p.featured), [projects]);

  const submissionProjects = useMemo(
    () => {
      if (!needsSubmissionRows) return [];
      return projects
        .filter((p) => p.status === "PENDING" || p.status === "IN_REVIEW")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    [needsSubmissionRows, projects]
  );

  const notificationFeed = useMemo(
    () => [...submissionNotifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [submissionNotifications]
  );

  const pendingNotifications = useMemo(
    () => notificationFeed.filter((n) => !n.acknowledged),
    [notificationFeed]
  );

  const failedDeliveryNotifications = useMemo(
    () => notificationFeed.filter((n) => n.deliveryStatus === "FAILED"),
    [notificationFeed]
  );

  const latestNotifications = useMemo(
    () => notificationFeed.slice(0, 8),
    [notificationFeed]
  );

  const handleAcknowledgeNotification = async (notificationId: string, acknowledged: boolean) => {
    try {
      await adminAcknowledgeSubmissionNotification(notificationId, acknowledged, user?.id);
      await fetchData();
      toast.success(acknowledged ? "NOTIFICATION ACKNOWLEDGED" : "NOTIFICATION REOPENED");
    } catch {
      toast.error("FAILED TO UPDATE NOTIFICATION");
    }
  };

  const handleRetryNotificationEmail = async (notificationId: string) => {
    try {
      await adminRetrySubmissionNotificationEmail(notificationId);
      await fetchData();
      toast.success("EMAIL DELIVERY RETRIED");
    } catch {
      toast.error("FAILED TO RETRY DELIVERY");
    }
  };

  const filteredAndSortedProjects = useMemo(
    () => {
      if (!isOverviewView) return [];
      return [...projects]
        .filter((p) => {
          const projectUserName = p.user?.name || "Unknown user";
          const projectUserEmail = p.user?.email || "";
          const matchesSearch =
            p.title.toLowerCase().includes(normalizedProjectSearch) ||
            projectUserName.toLowerCase().includes(normalizedProjectSearch) ||
            projectUserEmail.toLowerCase().includes(normalizedProjectSearch);
          const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
          const matchesFeatured =
            featuredFilter === "ALL" ||
            (featuredFilter === "FEATURED" && p.featured) ||
            (featuredFilter === "NOT_FEATURED" && !p.featured);
          return matchesSearch && matchesStatus && matchesFeatured;
        })
        .sort((a, b) => {
          if (!sortConfig) return 0;
          const { key, direction } = sortConfig;

          let aValue: any;
          let bValue: any;

          if (key.includes('.')) {
            const [obj, prop] = key.split('.');
            aValue = (a as any)[obj][prop];
            bValue = (b as any)[obj][prop];
          } else {
            aValue = (a as any)[key];
            bValue = (b as any)[key];
          }

          if (aValue < bValue) return direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return direction === 'asc' ? 1 : -1;
          return 0;
        });
    },
    [isOverviewView, projects, normalizedProjectSearch, statusFilter, featuredFilter, sortConfig]
  );

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);

  const paginatedProjects = useMemo(
    () =>
      filteredAndSortedProjects.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [filteredAndSortedProjects, currentPage, itemsPerPage]
  );

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
    const result: Array<number | "ellipsis"> = [];

    for (let i = 0; i < sorted.length; i++) {
      const page = sorted[i];
      const prev = sorted[i - 1];
      if (prev && page - prev > 1) result.push("ellipsis");
      result.push(page);
    }

    return result;
  }, [currentPage, totalPages]);

  const filteredUsers = useMemo(
    () => {
      if (!isUsersView) return [];
      return users.filter((u) => {
        const matchesSearch =
          u.name.toLowerCase().includes(normalizedUserSearch) ||
          u.email.toLowerCase().includes(normalizedUserSearch);
        const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
        return matchesSearch && matchesRole;
      });
    },
    [isUsersView, users, normalizedUserSearch, userRoleFilter]
  );

  const filteredTestimonials = useMemo(
    () => {
      if (!isTestimonialsView) return [];
      return testimonials.filter((t) => {
        const testimonialUser = (t.user?.name || "").toLowerCase();
        const testimonialProject = (t.project?.title || "").toLowerCase();
        return (
          testimonialUser.includes(normalizedTestimonialSearch) ||
          testimonialProject.includes(normalizedTestimonialSearch)
        );
      });
    },
    [isTestimonialsView, testimonials, normalizedTestimonialSearch]
  );

  const godModeUnlockPhrase = "UNLOCK GOD MODE";
  const approvalCandidateIds = useMemo(
    () => (isGodModeView ? submissionProjects.map((p) => p.id) : []),
    [isGodModeView, submissionProjects]
  );
  const approvedNotFeaturedIds = useMemo(
    () => (isGodModeView ? projects.filter((p) => p.status === "APPROVED" && !p.featured).map((p) => p.id) : []),
    [isGodModeView, projects]
  );
  const featuredProjectIds = useMemo(
    () => (isGodModeView ? featuredProjects.map((p) => p.id) : []),
    [isGodModeView, featuredProjects]
  );
  const promoteCandidateIds = useMemo(
    () => (isGodModeView ? users.filter((u) => u.role !== "ADMIN").map((u) => u.id) : []),
    [isGodModeView, users]
  );
  const demoteCandidateIds = useMemo(
    () => (isGodModeView ? users.filter((u) => u.role === "ADMIN" && u.id !== user?.id).map((u) => u.id) : []),
    [isGodModeView, users, user?.id]
  );

  const requireGodMode = () => {
    if (!godModeEnabled) {
      toast.error("ENABLE GOD MODE FIRST");
      return false;
    }
    return true;
  };

  const handleUnlockGodMode = () => {
    if (godModePhrase.trim().toUpperCase() !== godModeUnlockPhrase) {
      toast.error("INVALID GOD MODE PHRASE");
      return;
    }
    setGodModeEnabled(true);
    toast.success("GOD MODE ENABLED");
  };

  const handleApproveAllPending = () => {
    if (!requireGodMode()) return;
    if (!approvalCandidateIds.length) {
      toast.info("NO SUBMISSIONS TO APPROVE");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `APPROVE ${approvalCandidateIds.length} SUBMISSIONS?`,
      message: "THIS WILL MARK ALL PENDING/IN-REVIEW PROJECTS AS APPROVED.",
      onConfirm: async () => {
        setGodModeBusy(true);
        try {
          await adminBulkUpdateProjects(approvalCandidateIds, { status: "APPROVED" });
          await fetchData();
          toast.success(`APPROVED ${approvalCandidateIds.length} PROJECTS`);
        } catch {
          toast.error("FAILED TO APPLY MASS APPROVAL");
        } finally {
          setGodModeBusy(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleFeatureAllApproved = () => {
    if (!requireGodMode()) return;
    if (!approvedNotFeaturedIds.length) {
      toast.info("NO APPROVED PROJECTS TO FEATURE");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `FEATURE ${approvedNotFeaturedIds.length} APPROVED PROJECTS?`,
      message: "THIS WILL SET FEATURED=TRUE FOR ALL APPROVED PROJECTS NOT YET FEATURED.",
      onConfirm: async () => {
        setGodModeBusy(true);
        try {
          await adminBulkUpdateProjects(approvedNotFeaturedIds, { featured: true });
          await fetchData();
          toast.success(`FEATURED ${approvedNotFeaturedIds.length} PROJECTS`);
        } catch {
          toast.error("FAILED TO APPLY MASS FEATURE");
        } finally {
          setGodModeBusy(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleUnfeatureAll = () => {
    if (!requireGodMode()) return;
    if (!featuredProjectIds.length) {
      toast.info("NO FEATURED PROJECTS TO UNFEATURE");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `UNFEATURE ${featuredProjectIds.length} PROJECTS?`,
      message: "THIS WILL REMOVE ALL PROJECTS FROM THE GALLERY FEATURED STRIP.",
      onConfirm: async () => {
        setGodModeBusy(true);
        try {
          await adminBulkUpdateProjects(featuredProjectIds, { featured: false });
          await fetchData();
          toast.success(`UNFEATURED ${featuredProjectIds.length} PROJECTS`);
        } catch {
          toast.error("FAILED TO UNFEATURE PROJECTS");
        } finally {
          setGodModeBusy(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handlePromoteAllUsers = () => {
    if (!requireGodMode()) return;
    if (!promoteCandidateIds.length) {
      toast.info("ALL USERS ARE ALREADY ADMINS");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `PROMOTE ${promoteCandidateIds.length} USERS TO ADMIN?`,
      message: "THIS IS A HIGH-RISK ACTION. EVERY STANDARD USER WILL GAIN ADMIN PRIVILEGES.",
      onConfirm: async () => {
        setGodModeBusy(true);
        try {
          await Promise.all(promoteCandidateIds.map((id) => adminSetUserRole(id, "ADMIN")));
          await fetchData();
          toast.success(`PROMOTED ${promoteCandidateIds.length} USERS`);
        } catch {
          toast.error("FAILED TO PROMOTE USERS");
        } finally {
          setGodModeBusy(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDemoteAllAdmins = () => {
    if (!requireGodMode()) return;
    if (!demoteCandidateIds.length) {
      toast.info("NO OTHER ADMINS TO DEMOTE");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `DEMOTE ${demoteCandidateIds.length} ADMINS TO USER?`,
      message: "THIS EXCLUDES YOUR OWN ACCOUNT TO PREVENT LOCKOUT.",
      onConfirm: async () => {
        setGodModeBusy(true);
        try {
          await Promise.all(demoteCandidateIds.map((id) => adminSetUserRole(id, "USER")));
          await fetchData();
          toast.success(`DEMOTED ${demoteCandidateIds.length} ADMINS`);
        } catch {
          toast.error("FAILED TO DEMOTE ADMINS");
        } finally {
          setGodModeBusy(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleDownloadGodSnapshot = () => {
    if (!requireGodMode()) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      analytics,
      projects,
      users,
      testimonials,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `makerslab_godmode_snapshot_${format(new Date(), "yyyyMMdd_HHmmss")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGodModeRefresh = async () => {
    setGodModeBusy(true);
    try {
      await fetchData();
      toast.success("GOD MODE DATA REFRESHED");
    } catch {
      toast.error("FAILED TO REFRESH GOD MODE DATA");
    } finally {
      setGodModeBusy(false);
    }
  };

  const applyGodModePreset = (preset: "Queue" | "Users" | "Tasks" | "Activity" | "Approved") => {
    if (preset === "Queue") {
      setGodModeModule("SUBMISSIONS");
      setGodModeSearch("");
      setGodModeSort({ key: "timestamp", direction: "desc" });
    } else if (preset === "Users") {
      setGodModeModule("USERS");
      setGodModeSearch("");
      setGodModeSort({ key: "timestamp", direction: "desc" });
    } else if (preset === "Tasks") {
      setGodModeModule("TASKS");
      setGodModeSearch("IN_PROGRESS");
      setGodModeSort({ key: "timestamp", direction: "desc" });
    } else if (preset === "Activity") {
      setGodModeModule("ACTIVITY");
      setGodModeSearch("TESTIMONIAL");
      setGodModeSort({ key: "timestamp", direction: "desc" });
    } else {
      setGodModeModule("PROJECTS");
      setGodModeSearch("APPROVED");
      setGodModeSort({ key: "primary", direction: "asc" });
    }
    setGodPreset(preset);
    setGodModePage(1);
  };

  const toggleGodModeSort = (key: "primary" | "status" | "timestamp") => {
    setGodModeSort((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: key === "timestamp" ? "desc" : "asc" };
    });
  };

  const normalizedGodModeSearch = godModeSearch.trim().toLowerCase();
  const fallbackTimestampIso = useMemo(() => new Date().toISOString(), []);

  const godModeSubmissionRows = useMemo(
    () =>
      isGodModeView
        ? submissionProjects.map((p) => ({
        id: p.id,
        primary: p.title,
        secondary: p.user?.name || "Unknown user",
        status: p.status,
        timestamp: p.createdAt,
        sortTs: new Date(p.createdAt).getTime(),
      }))
        : [],
    [isGodModeView, submissionProjects]
  );

  const godModeTaskRows = useMemo(
    () =>
      isGodModeView
        ? projects
        .filter((p) => p.status === "PENDING" || p.status === "IN_REVIEW" || p.status === "IN_PROGRESS")
        .map((p) => ({
          id: p.id,
          primary: p.title,
          secondary: `${p.user?.name || "Unknown user"} • ${p.category}`,
          status: p.status,
          timestamp: p.updatedAt || p.createdAt,
          sortTs: new Date(p.updatedAt || p.createdAt).getTime(),
        }))
        : [],
    [isGodModeView, projects]
  );

  const godModeActivityRows = useMemo(() => {
    if (!isGodModeView) return [];
    const projectEvents = projects.map((p) => ({
      id: `project-${p.id}`,
      type: "PROJECT",
      primary: p.title,
      secondary: `${p.user?.name || "Unknown user"} • ${p.status}`,
      timestamp: p.updatedAt || p.createdAt,
      sortTs: new Date(p.updatedAt || p.createdAt).getTime(),
      entityType: "PROJECT" as const,
      entityId: p.id,
    }));
    const userEvents = users.map((u) => ({
      id: `user-${u.id}`,
      type: "USER",
      primary: u.name,
      secondary: `${u.email} • ${u.role}`,
      timestamp: u.createdAt || fallbackTimestampIso,
      sortTs: new Date(u.createdAt || fallbackTimestampIso).getTime(),
      entityType: "USER" as const,
      entityId: u.id,
    }));
    const testimonialEvents = testimonials.map((t) => ({
      id: `testimonial-${t.id}`,
      type: "TESTIMONIAL",
      primary: t.project?.title || "Testimonial",
      secondary: `${t.user?.name || "Unknown user"} • ${t.isApproved ? "APPROVED" : "PENDING"}`,
      timestamp: t.createdAt,
      sortTs: new Date(t.createdAt).getTime(),
      entityType: "TESTIMONIAL" as const,
      entityId: t.id,
    }));

    return [...projectEvents, ...userEvents, ...testimonialEvents].sort((a, b) => b.sortTs - a.sortTs);
  }, [fallbackTimestampIso, isGodModeView, projects, users, testimonials]);

  const godModeRows = useMemo<GodModeRow[]>(() => {
    if (!isGodModeView) return [];
    const list =
      godModeModule === "PROJECTS"
        ? projects.map((p) => ({
            id: p.id,
            primary: p.title,
            secondary: `${p.user?.name || "Unknown user"} • ${p.category}`,
            status: p.status,
            timestamp: p.createdAt,
            sortTs: new Date(p.createdAt).getTime(),
            entityType: "PROJECT" as const,
            entityId: p.id,
          }))
        : godModeModule === "USERS"
        ? users.map((u) => ({
            id: u.id,
            primary: u.name,
            secondary: `${u.email} • ${u.role}`,
            status: `${u._count?.projects || 0} PROJECTS`,
            timestamp: u.createdAt || fallbackTimestampIso,
            sortTs: new Date(u.createdAt || fallbackTimestampIso).getTime(),
            entityType: "USER" as const,
            entityId: u.id,
          }))
        : godModeModule === "SUBMISSIONS"
        ? godModeSubmissionRows.map((row) => ({ ...row, entityType: "PROJECT" as const, entityId: row.id }))
        : godModeModule === "TASKS"
        ? godModeTaskRows.map((row) => ({ ...row, entityType: "PROJECT" as const, entityId: row.id }))
        : godModeActivityRows.map((row) => ({
            id: row.id,
            primary: `${row.type}: ${row.primary}`,
            secondary: row.secondary,
            status: row.type,
            timestamp: row.timestamp,
            sortTs: row.sortTs,
            entityType: row.entityType,
            entityId: row.entityId,
          }));

    const filtered = list.filter((row) => {
      if (!normalizedGodModeSearch) return true;
      return (
        row.primary.toLowerCase().includes(normalizedGodModeSearch) ||
        row.secondary.toLowerCase().includes(normalizedGodModeSearch) ||
        row.status.toLowerCase().includes(normalizedGodModeSearch)
      );
    });

    return filtered.sort((a, b) => {
      const dir = godModeSort.direction === "asc" ? 1 : -1;
      if (godModeSort.key === "timestamp") {
        return (a.sortTs - b.sortTs) * dir;
      }
      if (godModeSort.key === "status") {
        return a.status.localeCompare(b.status) * dir;
      }
      return a.primary.localeCompare(b.primary) * dir;
    });
  }, [fallbackTimestampIso, godModeActivityRows, godModeModule, godModeSort, godModeSubmissionRows, godModeTaskRows, isGodModeView, normalizedGodModeSearch, projects, users]);

  const godModeTotalPages = Math.max(1, Math.ceil(godModeRows.length / godModePageSize));
  const godModePaginatedRows = useMemo(
    () => godModeRows.slice((godModePage - 1) * godModePageSize, godModePage * godModePageSize),
    [godModePage, godModePageSize, godModeRows]
  );
  const canSelectGodRows = godModeModule !== "ACTIVITY";
  const selectedGodRowSet = useMemo(() => new Set(selectedGodRows), [selectedGodRows]);
  const selectedGodEntities = useMemo(
    () => godModeRows.filter((row) => selectedGodRowSet.has(row.id)),
    [godModeRows, selectedGodRowSet]
  );
  const selectedGodProjectIds = useMemo(
    () => [...new Set(selectedGodEntities.filter((row) => row.entityType === "PROJECT").map((row) => row.entityId))],
    [selectedGodEntities]
  );
  const selectedGodUserIds = useMemo(
    () => [...new Set(selectedGodEntities.filter((row) => row.entityType === "USER").map((row) => row.entityId))],
    [selectedGodEntities]
  );
  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);

  const handleOpenGodModeRow = (row: GodModeRow) => {
    if (row.entityType === "PROJECT") {
      const target = projectsById.get(row.entityId);
      if (target) {
        setSelectedProject(target);
        return;
      }
    }
    if (row.entityType === "USER") {
      const target = usersById.get(row.entityId);
      if (target) {
        openUserEdit(target);
        setView("USERS");
        return;
      }
    }
    if (row.entityType === "TESTIMONIAL") {
      setView("TESTIMONIALS");
      setTestimonialSearch(row.primary);
      return;
    }
    toast.error("ITEM NO LONGER AVAILABLE");
  };

  const handleGodModeBulkApprove = () => {
    if (!requireGodMode()) return;
    if (!selectedGodProjectIds.length) {
      toast.info("NO PROJECTS SELECTED");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `APPROVE ${selectedGodProjectIds.length} PROJECTS?`,
      message: "THIS WILL MARK ALL SELECTED PROJECTS AS APPROVED.",
      onConfirm: async () => {
        setGodModeBusy(true);
        try {
          await adminBulkUpdateProjects(selectedGodProjectIds, { status: "APPROVED" });
          await fetchData();
          setSelectedGodRows([]);
          toast.success(`APPROVED ${selectedGodProjectIds.length} PROJECTS`);
        } catch {
          toast.error("FAILED TO APPROVE SELECTED PROJECTS");
        } finally {
          setGodModeBusy(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleGodModeBulkDeleteProjects = () => {
    if (!requireGodMode()) return;
    if (!selectedGodProjectIds.length) {
      toast.info("NO PROJECTS SELECTED");
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: `DELETE ${selectedGodProjectIds.length} PROJECTS?`,
      message: "THIS ACTION CANNOT BE UNDONE.",
      onConfirm: async () => {
        setGodModeBusy(true);
        try {
          await adminBulkDeleteProjects(selectedGodProjectIds);
          await fetchData();
          setSelectedGodRows([]);
          toast.success(`DELETED ${selectedGodProjectIds.length} PROJECTS`);
        } catch {
          toast.error("FAILED TO DELETE SELECTED PROJECTS");
        } finally {
          setGodModeBusy(false);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleGodModeBulkPromoteUsers = async () => {
    if (!requireGodMode()) return;
    if (!selectedGodUserIds.length) {
      toast.info("NO USERS SELECTED");
      return;
    }
    setGodModeBusy(true);
    try {
      await Promise.all(selectedGodUserIds.map((id) => adminSetUserRole(id, "ADMIN")));
      await fetchData();
      setSelectedGodRows([]);
      toast.success(`PROMOTED ${selectedGodUserIds.length} USERS`);
    } catch {
      toast.error("FAILED TO PROMOTE SELECTED USERS");
    } finally {
      setGodModeBusy(false);
    }
  };

  const handleGodModeBulkDemoteUsers = async () => {
    if (!requireGodMode()) return;
    const ids = selectedGodUserIds.filter((id) => id !== user?.id);
    if (!ids.length) {
      toast.info("NO VALID USERS TO DEMOTE");
      return;
    }
    setGodModeBusy(true);
    try {
      await Promise.all(ids.map((id) => adminSetUserRole(id, "USER")));
      await fetchData();
      setSelectedGodRows([]);
      toast.success(`DEMOTED ${ids.length} USERS`);
    } catch {
      toast.error("FAILED TO DEMOTE SELECTED USERS");
    } finally {
      setGodModeBusy(false);
    }
  };

  const godModeCommands = useMemo(
    () => [
      { label: "Refresh all data", run: handleGodModeRefresh },
      { label: "Jump to security", run: () => setView("SECURITY") },
      { label: "Jump to submissions", run: () => setView("SUBMISSIONS") },
      { label: "Apply preset queue", run: () => applyGodModePreset("Queue") },
      { label: "Apply preset tasks", run: () => applyGodModePreset("Tasks") },
      { label: "Approve entire queue", run: handleApproveAllPending },
      { label: "Feature approved projects", run: handleFeatureAllApproved },
      { label: "Unfeature all projects", run: handleUnfeatureAll },
      { label: "Export god snapshot", run: handleDownloadGodSnapshot },
    ],
    [handleApproveAllPending, handleDownloadGodSnapshot, handleFeatureAllApproved, handleGodModeRefresh, handleUnfeatureAll]
  );

  const filteredGodCommands = useMemo(
    () =>
      godModeCommands.filter((cmd) =>
        cmd.label.toLowerCase().includes(godCommandQuery.trim().toLowerCase())
      ),
    [godCommandQuery, godModeCommands]
  );

  useEffect(() => {
    setGodModePage(1);
  }, [godModeModule, normalizedGodModeSearch, godModePageSize]);

  useEffect(() => {
    setSelectedGodRows([]);
  }, [godModeModule, normalizedGodModeSearch]);

  useEffect(() => {
    setGodPreset("Custom");
  }, [godModeModule, godModeSearch, godModeSort]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (view !== "GODMODE") return;
      const target = event.target as HTMLElement | null;
      const inTextField = !!target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA");
      if (!inTextField && event.key === "/") {
        event.preventDefault();
        godCommandInputRef.current?.focus();
      }
      if (event.key === "Escape" && document.activeElement === godCommandInputRef.current) {
        godCommandInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [view]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedProjectSearch, statusFilter, featuredFilter, itemsPerPage]);

  useEffect(() => {
    if (view !== "OVERVIEW") return;

    const timer = window.setInterval(() => {
      setPerfRefreshTick((prev) => prev + 1);
    }, 5000);

    return () => window.clearInterval(timer);
  }, [view]);

  const routePerfStats = useMemo(() => {
    const rows = getRecentRoutePerf().slice(-30);
    if (rows.length === 0) {
      return {
        count: 0,
        average: 0,
        p95: 0,
        lastPath: "-",
        lastMs: 0,
        slowest: [] as Array<{ path: string; durationMs: number }>,
      };
    }

    const durations = rows.map((r) => r.durationMs).sort((a, b) => a - b);
    const p95Index = Math.max(0, Math.min(durations.length - 1, Math.ceil(durations.length * 0.95) - 1));
    const average = durations.reduce((acc, ms) => acc + ms, 0) / durations.length;
    const last = rows[rows.length - 1];
    const slowest = [...rows]
      .sort((a, b) => b.durationMs - a.durationMs)
      .slice(0, 3)
      .map((r) => ({ path: r.path, durationMs: r.durationMs }));

    return {
      count: rows.length,
      average,
      p95: durations[p95Index],
      lastPath: last.path,
      lastMs: last.durationMs,
      slowest,
    };
  }, [perfRefreshTick]);

  if (loading) return (
    <div className="page-shell-flex h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );

  return (
    <div className="page-shell duration-300">
      <PageHero 
        title={`Admin <br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}'>Console</span>`}
        subtitle="Global project oversight and management terminal."
        details="Monitor all submissions, review project details, manage approvals, track delivery status, and oversee the complete project lifecycle from intake to completion."
        category="System Administration"
      />

      <div className="max-w-7xl mx-auto px-4 py-24 relative z-10 space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className={`flex items-center space-x-2 p-1.5 rounded-2xl backdrop-blur-xl border transition-all ${
            theme === 'light' ? 'bg-white/50 border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'
          }`}>
            <button 
              onClick={() => setView("OVERVIEW")}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center transition-all ${
                view === "OVERVIEW" 
                  ? theme === 'light' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-black shadow-xl" 
                  : theme === 'light' ? "text-slate-400 hover:text-slate-900 hover:bg-slate-900/5" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" /> Overview
            </button>
            <button 
              onClick={() => setView("SUBMISSIONS")}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center transition-all ${
                view === "SUBMISSIONS" 
                  ? theme === 'light' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-black shadow-xl" 
                  : theme === 'light' ? "text-slate-400 hover:text-slate-900 hover:bg-slate-900/5" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <ClockIcon className="h-4 w-4 mr-2" /> Submissions
              {pendingProjectsCount > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[8px] rounded-full">
                  {pendingProjectsCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setView("GALLERY")}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center transition-all ${
                view === "GALLERY" 
                  ? theme === 'light' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-black shadow-xl" 
                  : theme === 'light' ? "text-slate-400 hover:text-slate-900 hover:bg-slate-900/5" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Image className="h-4 w-4 mr-2" /> Gallery
            </button>
            <button 
              onClick={() => setView("USERS")}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center transition-all ${
                view === "USERS" 
                  ? theme === 'light' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-black shadow-xl" 
                  : theme === 'light' ? "text-slate-400 hover:text-slate-900 hover:bg-slate-900/5" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Users className="h-4 w-4 mr-2" /> Users
            </button>
            <button 
              onClick={() => setView("TESTIMONIALS")}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center transition-all ${
                view === "TESTIMONIALS" 
                  ? theme === 'light' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-black shadow-xl" 
                  : theme === 'light' ? "text-slate-400 hover:text-slate-900 hover:bg-slate-900/5" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" /> Testimonials
            </button>
            <button 
              onClick={() => setView("SECURITY")}
              className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center transition-all ${
                view === "SECURITY" 
                  ? theme === 'light' ? "bg-slate-900 text-white shadow-lg" : "bg-white text-black shadow-xl" 
                  : theme === 'light' ? "text-slate-400 hover:text-slate-900 hover:bg-slate-900/5" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}
            >
              <Shield className="h-4 w-4 mr-2" /> Security
            </button>
            {user?.role === "ADMIN" && (
              <button
                onClick={() => setView("GODMODE")}
                className={`px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center transition-all ${
                  view === "GODMODE"
                    ? "bg-red-600 text-white shadow-lg shadow-red-500/30"
                    : theme === 'light'
                    ? "text-red-500 hover:text-red-700 hover:bg-red-50"
                    : "text-red-300 hover:text-red-200 hover:bg-red-500/10"
                }`}
              >
                <Shield className="h-4 w-4 mr-2" /> God Mode
              </button>
            )}
          </div>
        </div>

      <AnimatePresence mode="wait">
        {view === "OVERVIEW" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Total Projects", value: analytics?.totalProjects, icon: Briefcase, color: "bg-primary/10 text-primary" },
                { label: "Total Users", value: analytics?.totalUsers, icon: Users, color: "bg-secondary/10 text-secondary" },
                { label: "Pending Review", value: analytics?.statusCounts?.find((s: any) => s.status === "PENDING")?._count || 0, icon: Clock, color: "bg-tertiary/10 text-tertiary" },
                { label: "Completed", value: analytics?.statusCounts?.find((s: any) => s.status === "COMPLETED")?._count || 0, icon: CheckCircle, color: "bg-primary/10 text-primary" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-8 rounded-[2rem] glass-card flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <span className="text-headline-md font-headline-md text-on-surface">{stat.value}</span>
                  </div>
                  <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] text-on-surface-variant/80">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-[2.5rem] p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 mb-6">
                <div>
                  <span className="inline-flex items-center px-4 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-[0.18em] border border-outline-variant bg-surface-container-low text-on-surface-variant">
                    Makers Lab
                  </span>
                  <h3 className="font-headline-md text-headline-md text-on-surface mt-2">
                    Submission Command Center
                  </h3>
                  <p className="text-body-md text-on-surface-variant/80 mt-1">
                    Branded intake, official inbox delivery, and admin actions
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-outline-variant px-4 py-3 bg-surface-container-lowest/50">
                    <p className="text-label-sm font-label-sm uppercase tracking-[0.18em] text-on-surface-variant/70">Total</p>
                    <p className="mt-1 text-headline-md font-headline-md text-on-surface">{notificationFeed.length}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant px-4 py-3 bg-surface-container-lowest/50">
                    <p className="text-label-sm font-label-sm uppercase tracking-[0.18em] text-on-surface-variant/70">Unacked</p>
                    <p className="mt-1 text-headline-md font-headline-md text-tertiary">{pendingNotifications.length}</p>
                  </div>
                  <div className="rounded-2xl border border-outline-variant px-4 py-3 bg-surface-container-lowest/50">
                    <p className="text-label-sm font-label-sm uppercase tracking-[0.18em] text-on-surface-variant/70">Failed</p>
                    <p className="mt-1 text-headline-md font-headline-md text-error">{failedDeliveryNotifications.length}</p>
                  </div>
                </div>
              </div>

              {latestNotifications.length === 0 ? (
                <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
                  No submission notifications yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {latestNotifications.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-2xl border border-outline-variant px-4 py-4 bg-surface-container-lowest/30"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                        <div className="space-y-2">
                          <p className="text-xs font-bold uppercase tracking-[0.15em] text-on-surface">
                            {note.project?.title || "Untitled project"}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-label-sm font-label-sm border uppercase tracking-widest ${DELIVERY_COLORS[note.deliveryStatus]}`}>
                              Email {note.deliveryStatus}
                            </span>
                            {!note.acknowledged && (
                              <span className="px-3 py-1 rounded-full text-label-sm font-label-sm border uppercase tracking-widest bg-tertiary/10 text-tertiary border-tertiary/20">
                                Needs Action
                              </span>
                            )}
                          </div>
                          <p className="text-label-sm font-label-sm uppercase tracking-[0.15em] text-on-surface-variant/75">
                            To: {note.officialEmail} • Client: {note.user?.name || "Unknown"} ({note.user?.email || "no-email"})
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => note.project && setSelectedProject(note.project)}
                            disabled={!note.project}
                            className="px-4 py-2 rounded-xl text-label-sm font-label-sm uppercase tracking-[0.18em] transition-all disabled:opacity-50 bg-primary text-on-primary hover:brightness-110 active:scale-95"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAcknowledgeNotification(note.id, !note.acknowledged)}
                            className="px-4 py-2 rounded-xl text-label-sm font-label-sm uppercase tracking-[0.18em] transition-all bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high"
                          >
                            {note.acknowledged ? "Reopen" : "Acknowledge"}
                          </button>
                          {note.deliveryStatus === "FAILED" && (
                            <button
                              type="button"
                              onClick={() => handleRetryNotificationEmail(note.id)}
                              className="px-4 py-2 rounded-xl text-label-sm font-label-sm uppercase tracking-[0.18em] transition-all bg-error/15 text-error border border-error/20 hover:bg-error hover:text-on-error"
                            >
                              Retry Email
                            </button>
                          )}
                        </div>
                      </div>
                      {note.deliveryError && (
                        <p className="mt-3 text-label-sm font-label-sm uppercase tracking-[0.15em] text-error">
                          Delivery error: {note.deliveryError}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card rounded-[2.5rem] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    Route Performance
                  </h3>
                  <p className="text-body-md text-on-surface-variant/80 mt-1">
                    Last 30 route transitions (client-side)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPerfRefreshTick((prev) => prev + 1)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-label-sm font-label-sm uppercase tracking-[0.2em] transition-all bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-high"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Refresh
                </button>
              </div>

              {routePerfStats.count === 0 ? (
                <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] text-on-surface-variant/60">
                  No route metrics yet. Navigate around the app to populate samples.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Samples', value: `${routePerfStats.count}` },
                      { label: 'Avg', value: `${routePerfStats.average.toFixed(1)}ms` },
                      { label: 'P95', value: `${routePerfStats.p95.toFixed(1)}ms` },
                      { label: 'Last', value: `${routePerfStats.lastMs.toFixed(1)}ms` },
                    ].map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-2xl border border-outline-variant p-4 bg-surface-container-lowest/50"
                      >
                        <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] text-on-surface-variant/70">
                          {metric.label}
                        </p>
                        <p className="mt-2 text-headline-md font-headline-md text-on-surface">
                          {metric.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-outline-variant p-4 bg-surface-container-lowest/50">
                    <p className="text-label-sm font-label-sm uppercase tracking-[0.2em] mb-3 text-on-surface-variant/70">
                      Slowest Routes
                    </p>
                    <div className="space-y-2">
                      {routePerfStats.slowest.map((row, idx) => (
                        <div key={`${row.path}-${idx}`} className="flex items-center justify-between gap-3">
                          <span className="text-label-sm font-label-sm uppercase tracking-[0.15em] truncate text-on-surface">
                            {row.path}
                          </span>
                          <span className="text-label-sm font-label-sm uppercase tracking-[0.15em] text-primary">
                            {row.durationMs.toFixed(1)}ms
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-label-sm font-label-sm uppercase tracking-[0.18em] text-on-surface-variant/60">
                      Last route: {routePerfStats.lastPath}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Charts Section */}
            <Suspense
              fallback={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="h-[380px] rounded-3xl border border-outline-variant bg-surface-container-low/20" />
                  <div className="h-[380px] rounded-3xl border border-outline-variant bg-surface-container-low/20" />
                </div>
              }
            >
              <AdminOverviewCharts analytics={analytics} theme={theme} />
            </Suspense>

            {/* Projects Table */}
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-grow">
                  <div className="relative flex-grow max-w-md w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/60" />
                    <input
                      type="text"
                      placeholder="SEARCH PROJECTS, USERS, EMAILS..."
                      className="w-full pl-12 pr-6 py-4 border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl outline-none text-label-sm font-label-sm tracking-widest"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  
                  {selectedProjects.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center space-x-4 border border-outline-variant px-6 py-2 rounded-2xl bg-surface-container-low"
                    >
                      <span className="text-label-sm font-label-sm text-primary uppercase tracking-widest">{selectedProjects.length} SELECTED</span>
                      <div className="h-4 w-px bg-outline-variant" />
                      <select
                        className="bg-transparent text-label-sm font-label-sm uppercase tracking-widest outline-none cursor-pointer text-on-surface"
                        value={bulkStatus}
                        onChange={e => setBulkStatus(e.target.value)}
                      >
                        <option value="" className="bg-background text-on-surface">BULK STATUS</option>
                        {STATUSES.map(s => <option key={s} value={s} className="bg-background text-on-surface">{s.replace("_", " ")}</option>)}
                      </select>
                      <button 
                        onClick={handleBulkStatusUpdate}
                        disabled={!bulkStatus || isUpdating}
                        className="p-2 hover:bg-primary/20 text-primary rounded-lg transition-all disabled:opacity-50"
                        title="Apply Status"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={handleBulkDelete}
                        disabled={isUpdating}
                        className="p-2 hover:bg-error/20 text-error/80 rounded-lg transition-all"
                        title="Bulk Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedProjects([])}
                        className="p-2 hover:bg-surface-container-high text-on-surface-variant rounded-lg transition-all"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleExportData}
                    className="flex items-center px-6 py-4 border border-outline-variant rounded-2xl text-label-sm font-label-sm uppercase tracking-widest transition-all bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                  >
                    <Download className="h-4 w-4 mr-3 text-primary" />
                    Export CSV
                  </button>
                  <div className="flex items-center space-x-4">
                    <Filter className={`h-4 w-4 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
                    <select
                      className={`border rounded-2xl px-6 py-4 text-[10px] font-bold uppercase tracking-widest outline-none transition-all ${
                        theme === 'light' 
                          ? 'bg-white border-slate-200 text-slate-900 focus:ring-slate-200' 
                          : 'bg-white/5 border-white/10 text-white focus:ring-white/30'
                      }`}
                      value={statusFilter}
                      onChange={e => setStatusFilter(e.target.value)}
                    >
                      <option value="ALL" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>ALL STATUSES</option>
                      {STATUSES.map(s => <option key={s} value={s} className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>{s.replace("_", " ")}</option>)}
                    </select>
                  </div>
                  <select
                    className={`border rounded-2xl px-6 py-4 text-[10px] font-bold uppercase tracking-widest outline-none transition-all ${
                      theme === 'light' 
                        ? 'bg-white border-slate-200 text-slate-900 focus:ring-slate-200' 
                        : 'bg-white/5 border-white/10 text-white focus:ring-white/30'
                    }`}
                    value={featuredFilter}
                    onChange={e => setFeaturedFilter(e.target.value)}
                  >
                    <option value="ALL" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>ALL PROJECTS</option>
                    <option value="FEATURED" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>FEATURED ONLY</option>
                    <option value="NOT_FEATURED" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>NOT FEATURED</option>
                  </select>
                </div>
              </div>

              <div className={`p-6 border-b space-y-4 ${theme === 'light' ? 'border-slate-100 bg-slate-50/80' : 'border-white/5 bg-black/20'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-500' : 'text-white/35'}`}>
                    Official Inbox Notifications
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
                    Unacknowledged: {pendingNotifications.length} • Failed Delivery: {failedDeliveryNotifications.length}
                  </p>
                </div>

                {latestNotifications.length === 0 ? (
                  <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${theme === 'light' ? 'text-slate-400' : 'text-white/30'}`}>
                    No notifications available yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                    {latestNotifications.map((note) => {
                      const tags = Array.isArray(note.payload?.tags) ? (note.payload?.tags as string[]) : [];
                      const filesCount = Number(note.payload?.filesCount || 0);
                      return (
                        <div key={note.id} className={`rounded-2xl border p-4 ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-black/30 border-white/10'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className={`text-xs font-bold uppercase tracking-[0.15em] ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                {note.project?.title || "Untitled project"}
                              </p>
                              <p className={`mt-1 text-[10px] font-bold uppercase tracking-[0.15em] ${theme === 'light' ? 'text-slate-500' : 'text-white/45'}`}>
                                {note.user?.name || "Unknown client"} • {note.user?.email || "No email"}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${DELIVERY_COLORS[note.deliveryStatus]}`}>
                              {note.deliveryStatus}
                            </span>
                          </div>

                          <div className={`mt-3 text-[9px] font-bold uppercase tracking-[0.15em] ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                            To {note.officialEmail} • Budget {String(note.payload?.budget || "-")} • Timeline {String(note.payload?.timeline || "-")} • Files {filesCount}
                          </div>

                          {tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {tags.slice(0, 5).map((tag) => (
                                <span
                                  key={`${note.id}-${tag}`}
                                  className={`px-2.5 py-1 rounded-full text-[8px] font-bold uppercase tracking-[0.12em] border ${
                                    theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-white/5 border-white/10 text-white/50'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {note.deliveryError && (
                            <p className={`mt-3 text-[9px] font-bold uppercase tracking-[0.15em] ${theme === 'light' ? 'text-red-500' : 'text-red-300'}`}>
                              {note.deliveryError}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => note.project && setSelectedProject(note.project)}
                              disabled={!note.project}
                              className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-colors disabled:opacity-50 ${
                                theme === 'light' ? 'bg-slate-900 text-white hover:bg-slate-700' : 'bg-white text-black hover:bg-white/90'
                              }`}
                            >
                              Open Submission
                            </button>
                            {note.project && note.project.status !== "IN_REVIEW" && (
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(note.projectId, "IN_REVIEW", false)}
                                className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${
                                  theme === 'light' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' : 'bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
                                }`}
                              >
                                Start Review
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeNotification(note.id, !note.acknowledged)}
                              className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${
                                theme === 'light' ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100' : 'bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25'
                              }`}
                            >
                              {note.acknowledged ? "Reopen" : "Acknowledge"}
                            </button>
                            {note.deliveryStatus === "FAILED" && (
                              <button
                                type="button"
                                onClick={() => handleRetryNotificationEmail(note.id)}
                                className={`px-3 py-2 rounded-lg text-[9px] font-bold uppercase tracking-[0.15em] transition-colors ${
                                  theme === 'light' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-500/15 text-red-300 hover:bg-red-500/25'
                                }`}
                              >
                                Retry Email
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      theme === 'light' ? 'bg-slate-50 text-slate-400' : 'bg-white/2 text-white/20'
                    }`}>
                      <th className="px-8 py-6">
                        <input 
                          type="checkbox" 
                          className={`rounded focus:ring-0 ${
                            theme === 'light' ? 'border-slate-300 bg-white text-indigo-600' : 'border-white/10 bg-white/5 text-indigo-500'
                          }`}
                          checked={selectedProjects.length === filteredAndSortedProjects.length && filteredAndSortedProjects.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProjects(filteredAndSortedProjects.map(p => p.id));
                            } else {
                              setSelectedProjects([]);
                            }
                          }}
                        />
                      </th>
                      <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort('title')}>
                        <div className="flex items-center">
                          Project
                          <SortIcon field="title" />
                        </div>
                      </th>
                      <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort('user.name')}>
                        <div className="flex items-center">
                          User
                          <SortIcon field="user.name" />
                        </div>
                      </th>
                      <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort('status')}>
                        <div className="flex items-center">
                          Status
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort('category')}>
                        <div className="flex items-center">
                          Category
                          <SortIcon field="category" />
                        </div>
                      </th>
                      <th className="px-8 py-6 cursor-pointer group" onClick={() => handleSort('createdAt')}>
                        <div className="flex items-center">
                          Submitted
                          <SortIcon field="createdAt" />
                        </div>
                      </th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {paginatedProjects.map((project) => (
                      <tr key={project.id} className={`transition-colors group ${
                        theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/2'
                      }`}>
                        <td className="px-8 py-6">
                          <input 
                            type="checkbox" 
                            className={`rounded focus:ring-0 ${
                              theme === 'light' ? 'border-slate-300 bg-white text-indigo-600' : 'border-white/10 bg-white/5 text-indigo-500'
                            }`}
                            checked={selectedProjects.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjects(prev => [...prev, project.id]);
                              } else {
                                setSelectedProjects(prev => prev.filter(id => id !== project.id));
                              }
                            }}
                          />
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <button 
                              onClick={() => handleToggleFeatured(project.id, !project.featured)}
                              className={`p-2.5 rounded-xl transition-all ${
                                project.featured 
                                  ? "bg-amber-500/10 text-amber-500" 
                                  : theme === 'light' ? "bg-slate-100 text-slate-300 hover:text-slate-400" : "bg-white/5 text-white/20 hover:text-white/40"
                              }`}
                            >
                              <Star className={`h-4 w-4 ${project.featured ? "fill-current" : ""}`} />
                            </button>
                            <div>
                              <button 
                                onClick={() => setPreviewProject(project)}
                                className={`text-sm font-bold uppercase tracking-tight flex items-center hover:text-indigo-500 transition-colors ${
                                  theme === 'light' ? 'text-slate-900' : 'text-white'
                                }`}
                              >
                                {project.title}
                                {project.featured && (
                                  <span className="ml-3 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] rounded border border-amber-500/20">FEATURED</span>
                                )}
                              </button>
                              <div className={`text-[10px] truncate max-w-[200px] uppercase tracking-widest ${
                                theme === 'light' ? 'text-slate-400' : 'text-white/40'
                              }`}>{project.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className={`h-10 w-10 rounded-xl border flex items-center justify-center font-bold text-sm ${
                              theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            }`}>
                              {(project.user?.name || "?").charAt(0)}
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.user?.name || "Unknown user"}</div>
                              <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{project.user?.email || "No email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${STATUS_COLORS[project.status]}`}>
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest border ${
                            theme === 'light' ? 'text-slate-500 bg-slate-100 border-slate-200' : 'text-white/40 bg-white/5 border-white/10'
                          }`}>
                            {project.category}
                          </span>
                        </td>
                        <td className={`px-8 py-6 text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                          {format(new Date(project.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => setPreviewProject(project)}
                              className={`p-3 rounded-xl transition-all ${
                                theme === 'light' ? 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-indigo-500/20 hover:text-indigo-400 hover:bg-indigo-500/10'
                              }`}
                              title="Preview Description"
                            >
                              <FileText className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setSelectedProject(project)}
                              className={`p-3 rounded-xl transition-all ${
                                theme === 'light' ? 'text-slate-400 hover:text-slate-900 hover:bg-slate-100' : 'text-white/20 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className={`p-3 rounded-xl transition-all ${
                                theme === 'light' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-red-500/20 hover:text-red-500 hover:bg-red-500/10'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className={`p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                <div className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedProjects.length)} of {filteredAndSortedProjects.length} projects
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Rows:</span>
                    <select
                      className={`bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer ${
                        theme === 'light' ? 'text-slate-900' : 'text-white'
                      }`}
                      value={itemsPerPage}
                      onChange={e => setItemsPerPage(Number(e.target.value))}
                    >
                      {[5, 10, 25, 50].map(n => <option key={n} value={n} className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>{n}</option>)}
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button 
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => prev - 1)}
                      className={`p-2 rounded-xl transition-all disabled:opacity-20 ${
                        theme === 'light' ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {paginationItems.map((item, i) =>
                        item === "ellipsis" ? (
                          <span key={`ellipsis-${i}`} className={`px-1 ${theme === 'light' ? 'text-slate-300' : 'text-white/10'}`}>
                            ...
                          </span>
                        ) : (
                          <button
                            key={item}
                            onClick={() => setCurrentPage(item)}
                            className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all ${
                              currentPage === item
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                : theme === 'light'
                                ? "hover:bg-slate-100 text-slate-400"
                                : "hover:bg-white/10 text-white/40"
                            }`}
                          >
                            {item}
                          </button>
                        )
                      )}
                    </div>

                    <button 
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(prev => prev + 1)}
                      className={`p-2 rounded-xl transition-all disabled:opacity-20 ${
                        theme === 'light' ? 'hover:bg-slate-100 text-slate-900' : 'hover:bg-white/10 text-white'
                      }`}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {view === "USERS" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                  <input
                    type="text"
                    placeholder="SEARCH USERS BY NAME OR EMAIL..."
                    className="w-full pl-12 pr-6 py-4 border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl transition-all outline-none text-[10px] font-bold tracking-widest focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Filter className="h-4 w-4 text-on-surface-variant/40" />
                  <select
                    className="border border-outline-variant bg-surface-container-low text-on-surface rounded-2xl px-6 py-4 text-[10px] font-bold uppercase tracking-widest outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                  >
                    <option value="ALL" className="bg-background text-on-surface">ALL ROLES</option>
                    <option value="USER" className="bg-background text-on-surface">USER</option>
                    <option value="ADMIN" className="bg-background text-on-surface">ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-[0.2em] bg-surface-container text-on-surface-variant/75">
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Role</th>
                      <th className="px-8 py-6">Projects</th>
                      <th className="px-8 py-6">Joined</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className="transition-colors group hover:bg-surface-container-low">
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm bg-primary-container border border-outline-variant text-on-primary-container">
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-on-surface">{u.name}</div>
                              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className="border border-outline-variant bg-surface-container-low text-on-surface rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none transition-all focus:border-primary"
                          >
                            <option value="USER" className="bg-background text-on-surface">USER</option>
                            <option value="ADMIN" className="bg-background text-on-surface">ADMIN</option>
                          </select>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="h-3 w-3 text-primary" />
                            <span className="text-sm font-bold text-on-surface">{u._count?.projects || 0}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                          {format(new Date(u.createdAt || new Date().toISOString()), "MMM d, yyyy")}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openUserEdit(u)}
                              className="p-3 rounded-xl transition-all text-on-surface-variant/40 hover:text-primary hover:bg-primary-container/20"
                              title="Edit profile"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id)}
                              disabled={u.id === user?.id}
                              className="p-3 rounded-xl transition-all disabled:opacity-0 text-error/60 hover:text-error hover:bg-error-container/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {view === "GALLERY" && (
          <motion.div
            key="gallery"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: SHOWCASE_CARD_DURATION, delay: i * SHOWCASE_CARD_STAGGER, ease: SHOWCASE_EASE }}
                  className="showcase-interactive glass-card rounded-[2.5rem] overflow-hidden group transition-all duration-700"
                >
                  <div className="aspect-video relative overflow-hidden bg-surface-container-lowest">
                    <img
                      src={resolveProjectShowcaseImage(project)}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <span className="px-4 py-1.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full text-[9px] font-bold text-white uppercase tracking-[0.2em]">
                        {project.category}
                      </span>
                    </div>
                    <div className="absolute top-6 right-6 text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
                      {project.timeline}
                    </div>
                  </div>
                  <div className="p-8 space-y-6">
                    <h3 className="font-display text-2xl uppercase tracking-tight text-on-surface group-hover:text-primary transition-colors">{project.title}</h3>
                    <p className="text-sm font-sans line-clamp-2 leading-relaxed text-on-surface-variant/70">{project.description}</p>
                    <div className="flex items-center justify-between pt-6 border-t border-outline-variant">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-xl border border-outline-variant flex items-center justify-center font-bold text-[10px] bg-secondary-container text-on-secondary-container">
                          {(project.user?.name || "?").charAt(0)}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/65">{project.user?.name || "Unknown user"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant/80">
                          {project.budget || "GH₵ TBD"}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(project.id, false)}
                          className="px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.2em] transition-colors bg-error-container/20 text-error hover:bg-error-container/40"
                        >
                          Remove
                        </button>
                        <Link to="/gallery" className="p-2 rounded-lg transition-colors bg-surface-container-low text-on-surface-variant hover:text-primary">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              <Link 
                to="/submit-project"
                className="aspect-video md:aspect-auto border-2 border-dashed border-outline-variant rounded-[2.5rem] flex flex-col items-center justify-center space-y-6 transition-all group p-12 bg-surface-container-low/20 hover:bg-surface-container-low hover:border-primary/50"
              >
                <div className="p-6 rounded-full border border-outline-variant bg-surface-container-low transition-transform group-hover:scale-110">
                  <Rocket className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-on-surface">Add Gallery Item</p>
                  <p className="text-xs uppercase tracking-widest text-on-surface-variant/40">Submit a new project to showcase</p>
                </div>
              </Link>
            </div>
          </motion.div>
        )}

        {view === "SUBMISSIONS" && (
          <motion.div
            key="submissions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-display uppercase tracking-tight text-on-surface">Project Submissions</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Review and manage new project requests</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-surface-container-low text-on-surface-variant">
                    {pendingProjectsCount} PENDING
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-[0.2em] bg-surface-container text-on-surface-variant/75">
                      <th className="px-8 py-6">Project</th>
                      <th className="px-8 py-6">Client</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Date</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {submissionProjects.map((project) => (
                      <tr key={project.id} className="transition-colors group hover:bg-surface-container-low">
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => setPreviewProject(project)}
                            className="text-sm font-bold text-left hover:text-primary transition-colors text-on-surface"
                          >
                            {project.title}
                          </button>
                          <div className="text-[10px] uppercase tracking-widest mt-1 text-on-surface-variant/40">
                            {project.category}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className="h-8 w-8 rounded-xl border border-outline-variant flex items-center justify-center font-bold text-[10px] bg-primary-container text-on-primary-container">
                              {(project.user?.name || "?").charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-on-surface">{project.user?.name || "Unknown user"}</div>
                              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/40">{project.user?.email || "No email"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold border uppercase tracking-widest ${STATUS_COLORS[project.status]}`}>
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                          {format(new Date(project.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(project.id, "IN_REVIEW", false)}
                              className="p-3 rounded-xl transition-all text-secondary/60 hover:text-secondary hover:bg-secondary-container/20"
                              title="Mark as In Review"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setSelectedProject(project)}
                              className="p-3 rounded-xl transition-all text-primary/60 hover:text-primary hover:bg-primary-container/20"
                              title="Manage Project"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {submissionProjects.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-24 text-center">
                          <div className="flex flex-col items-center space-y-4">
                            <Rocket className="h-12 w-12 text-on-surface-variant/20" />
                            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">No pending submissions</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {view === "TESTIMONIALS" && (
          <motion.div
            key="testimonials"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="glass-card rounded-[2.5rem] overflow-hidden">
              <div className="p-8 border-b border-outline-variant flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="relative flex-grow max-w-md w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant/40" />
                  <input
                    type="text"
                    placeholder="SEARCH TESTIMONIALS BY USER OR PROJECT..."
                    className="w-full pl-12 pr-6 py-4 border border-outline-variant bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl transition-all outline-none text-[10px] font-bold tracking-widest focus:border-primary focus:ring-2 focus:ring-primary/20"
                    value={testimonialSearch}
                    onChange={e => setTestimonialSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-bold uppercase tracking-[0.2em] bg-surface-container text-on-surface-variant/75">
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Project</th>
                      <th className="px-8 py-6">Rating</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredTestimonials.map((t) => (
                      <tr key={t.id} className="transition-colors group hover:bg-surface-container-low">
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm bg-primary-container border border-outline-variant text-on-primary-container">
                              {t.user?.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-on-surface">{t.user?.name}</div>
                              <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">{t.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-sm font-bold text-on-surface">{t.project?.title}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < t.rating ? "text-amber-500 fill-current" : "text-on-surface-variant/20"}`} />
                            ))}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${
                            t.isApproved 
                              ? "bg-green-500/10 text-green-500 border-green-500/20" 
                              : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          }`}>
                            {t.isApproved ? "APPROVED" : "PENDING"}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateTestimonialStatus(t.id, !t.isApproved)}
                              className={`p-3 rounded-xl transition-all ${
                                t.isApproved 
                                  ? "text-amber-500/20 hover:text-amber-500 hover:bg-amber-500/10"
                                  : "text-green-500/20 hover:text-green-400 hover:bg-green-500/10"
                              }`}
                              title={t.isApproved ? "Unapprove" : "Approve"}
                            >
                              {t.isApproved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteTestimonial(t.id)}
                              className="p-3 rounded-xl transition-all text-error/60 hover:text-error hover:bg-error-container/20"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {view === "SECURITY" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <Suspense
              fallback={
                <div className="glass-card rounded-[2.5rem] p-8 text-center text-on-surface-variant/60">
                  Loading security analytics...
                </div>
              }
            >
              <SecurityMonitoring />
            </Suspense>
          </motion.div>
        )}

        {view === "GODMODE" && user?.role === "ADMIN" && (
          <motion.div
            key="godmode"
            initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
            transition={prefersReducedMotion ? { duration: 0 } : undefined}
            className="space-y-8"
          >
            <div className="glass-card rounded-[2.5rem] border border-outline-variant/30 p-8 max-[360px]:p-4 space-y-6 max-[360px]:space-y-4 relative overflow-hidden">
              <div className={`pointer-events-none absolute -top-24 -right-24 h-60 w-60 rounded-full blur-3xl ${theme === 'light' ? 'bg-error-container/20' : 'bg-error/15'}`} />
              <div className={`pointer-events-none absolute -bottom-24 -left-24 h-60 w-60 rounded-full blur-3xl ${theme === 'light' ? 'bg-primary-container/20' : 'bg-primary/10'}`} />
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-2xl max-[360px]:text-lg font-headline-md uppercase tracking-tight text-on-surface">God Mode Control</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-on-surface-variant/60">
                    High-privilege automation. Use with care.
                  </p>
                </div>
                <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${godModeEnabled ? 'bg-error text-on-error animate-pulse' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {godModeEnabled ? 'Enabled' : 'Locked'}
                </span>
              </div>

              {!godModeEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                  <input
                    type="text"
                    value={godModePhrase}
                    onChange={(e) => setGodModePhrase(e.target.value)}
                    placeholder="Type: UNLOCK GOD MODE"
                    className="px-4 py-3 rounded-xl border border-outline-variant text-[10px] font-bold uppercase tracking-widest outline-none bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:border-error"
                  />
                  <button
                    onClick={handleUnlockGodMode}
                    className="px-6 py-3 rounded-xl bg-error text-on-error text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-colors"
                  >
                    Enable
                  </button>
                </div>
              )}
            </div>

            <div className="glass-card rounded-[2.5rem] p-8 max-[360px]:p-4 space-y-6 max-[360px]:space-y-4 border border-outline-variant/30">
              <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "PROJECTS", label: "Projects", count: projects.length },
                    { key: "USERS", label: "Users", count: users.length },
                    { key: "SUBMISSIONS", label: "Submissions", count: submissionProjects.length },
                    { key: "TASKS", label: "Tasks", count: godModeTaskRows.length },
                    { key: "ACTIVITY", label: "Activity", count: godModeActivityRows.length },
                  ].map((module) => (
                    <button
                      key={module.key}
                      onClick={() => setGodModeModule(module.key as "PROJECTS" | "USERS" | "SUBMISSIONS" | "TASKS" | "ACTIVITY")}
                      className={`px-4 max-[360px]:px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all motion-reduce:transition-none ${
                        godModeModule === module.key
                          ? "bg-error text-on-error"
                          : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high border border-outline-variant/20"
                      }`}
                    >
                      {module.label} ({module.count})
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setView("OVERVIEW")}
                    className="px-4 max-[360px]:px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest motion-reduce:transition-none bg-surface-container-low text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high"
                  >
                    Quick Jump: Overview
                  </button>
                  <button
                    onClick={() => setView("SECURITY")}
                    className="px-4 max-[360px]:px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest motion-reduce:transition-none bg-surface-container-low text-on-surface-variant border border-outline-variant/20 hover:bg-surface-container-high"
                  >
                    Quick Jump: Security
                  </button>
                  <button
                    onClick={handleGodModeRefresh}
                    disabled={godModeBusy}
                    className="px-4 max-[360px]:px-3 py-2 rounded-xl bg-error text-on-error text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 hover:brightness-110 transition-all border border-error/20 motion-reduce:transition-none"
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                <input
                  type="text"
                  value={godModeSearch}
                  onChange={(e) => setGodModeSearch(e.target.value)}
                  placeholder={`Search ${godModeModule.toLowerCase()}...`}
                  className="px-4 py-3 rounded-xl border border-outline-variant text-[10px] font-bold uppercase tracking-widest outline-none bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 focus:border-primary"
                />
                <select
                  value={godModePageSize}
                  onChange={(e) => setGodModePageSize(Number(e.target.value))}
                  className="px-4 py-3 rounded-xl border border-outline-variant text-[10px] font-bold uppercase tracking-widest outline-none bg-surface-container-low text-on-surface focus:border-primary"
                >
                  {[8, 16, 32].map((n) => (
                    <option key={n} value={n} className="bg-background text-on-surface">
                      {n} rows
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">Presets:</span>
                {[
                  { key: "Queue", label: "Hot Queue" },
                  { key: "Users", label: "New Users" },
                  { key: "Tasks", label: "Risk Tasks" },
                  { key: "Activity", label: "Activity Watch" },
                  { key: "Approved", label: "Approved Ops" },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => applyGodModePreset(preset.key as "Queue" | "Users" | "Tasks" | "Activity" | "Approved")}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-outline-variant/10 ${
                      godPreset === preset.key
                        ? "bg-error text-on-error"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="glass-card rounded-[2rem] p-6 space-y-4 border border-outline-variant/20">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                    Command Palette
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                    {filteredGodCommands.length} commands
                  </p>
                </div>
                <input
                  ref={godCommandInputRef}
                  type="text"
                  value={godCommandQuery}
                  onChange={(e) => setGodCommandQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredGodCommands.length > 0) {
                      e.preventDefault();
                      filteredGodCommands[0].run();
                    }
                  }}
                  placeholder="Type command..."
                  className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 text-[10px] font-bold uppercase tracking-widest outline-none focus:border-primary"
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                  Shortcut: press / to focus, Enter to execute top command.
                </p>
                <div className="flex flex-wrap gap-2">
                  {filteredGodCommands.slice(0, 6).map((cmd) => (
                    <button
                      key={cmd.label}
                      onClick={cmd.run}
                      className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest motion-reduce:transition-none bg-surface-container-low text-on-surface border border-outline-variant/30 hover:bg-surface-container-high"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>
              </div>

              {canSelectGodRows && selectedGodRows.length > 0 && (
                <div className="sticky top-20 max-[360px]:top-16 z-20 flex flex-wrap items-center gap-3 p-4 max-[360px]:p-3 rounded-[1.5rem] border backdrop-blur-md bg-error-container/20 border-error/30 shadow-lg shadow-error/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-error">
                    {selectedGodRows.length} selected
                  </p>
                  {godModeModule !== "USERS" ? (
                    <>
                      <button
                        onClick={handleGodModeBulkApprove}
                        disabled={godModeBusy || !godModeEnabled}
                        className="px-3 py-2 rounded-xl bg-error text-on-error text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-colors disabled:opacity-50"
                      >
                        Approve Selected
                      </button>
                      <button
                        onClick={handleGodModeBulkDeleteProjects}
                        disabled={godModeBusy || !godModeEnabled}
                        className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-surface-container-low text-error border border-error/30 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                      >
                        Delete Selected
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleGodModeBulkPromoteUsers}
                        disabled={godModeBusy || !godModeEnabled}
                        className="px-3 py-2 rounded-xl bg-error text-on-error text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-colors disabled:opacity-50"
                      >
                        Promote Selected
                      </button>
                      <button
                        onClick={handleGodModeBulkDemoteUsers}
                        disabled={godModeBusy || !godModeEnabled}
                        className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-surface-container-low text-error border border-error/30 hover:bg-surface-container-high transition-colors disabled:opacity-50"
                      >
                        Demote Selected
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedGodRows([])}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hover:bg-surface-container-high transition-colors"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="md:hidden space-y-3">
                {godModePaginatedRows.length === 0 ? (
                  <div className="px-4 py-8 text-center rounded-[2rem] border border-outline-variant/30 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 bg-surface-container-low/40">
                    No records found.
                  </div>
                ) : (
                  godModePaginatedRows.map((row) => (
                    <div key={row.id} className="glass-card rounded-[2rem] p-4 max-[360px]:p-3 space-y-3 border border-outline-variant/20">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold uppercase tracking-wider truncate text-on-surface">{row.primary}</p>
                          <p className="text-[10px] uppercase tracking-widest truncate text-on-surface-variant/60">{row.secondary}</p>
                        </div>
                        {canSelectGodRows && (
                          <input
                            type="checkbox"
                            checked={selectedGodRows.includes(row.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedGodRows((prev) => [...prev, row.id]);
                              else setSelectedGodRows((prev) => prev.filter((id) => id !== row.id));
                            }}
                            className="rounded border-outline-variant text-error focus:ring-error/30 bg-surface-container-low h-4 w-4 transition-all"
                          />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-surface-container-high text-on-surface-variant">{row.status}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/55">{format(new Date(row.timestamp), "MMM d, HH:mm")}</span>
                      </div>
                      <button
                        onClick={() => handleOpenGodModeRow(row)}
                        className="w-full px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden md:block rounded-[2rem] border border-outline-variant/30 overflow-hidden backdrop-blur-sm bg-surface-container-lowest/40">
                <div className={`grid ${canSelectGodRows ? 'grid-cols-[auto_1.7fr_1.2fr_auto_auto_auto]' : 'grid-cols-[1.7fr_1.2fr_auto_auto_auto]'} gap-3 px-6 py-4 text-[9px] font-bold uppercase tracking-[0.2em] bg-surface-container-low text-on-surface-variant border-b border-outline-variant/30 items-center`}>
                  {canSelectGodRows && (
                    <input
                      type="checkbox"
                      checked={godModePaginatedRows.length > 0 && godModePaginatedRows.every((row) => selectedGodRows.includes(row.id))}
                      onChange={(e) => {
                        if (e.target.checked) {
                          const ids = godModePaginatedRows.map((row) => row.id);
                          setSelectedGodRows((prev) => [...new Set([...prev, ...ids])]);
                        } else {
                          const ids = new Set(godModePaginatedRows.map((row) => row.id));
                          setSelectedGodRows((prev) => prev.filter((id) => !ids.has(id)));
                        }
                      }}
                      className="rounded border-outline-variant text-error focus:ring-error/30 bg-surface-container-low h-4 w-4 transition-all"
                    />
                  )}
                  <button onClick={() => toggleGodModeSort("primary")} className="text-left hover:underline">Entity</button>
                  <span>Details</span>
                  <button onClick={() => toggleGodModeSort("status")} className="text-left hover:underline">Status</button>
                  <button onClick={() => toggleGodModeSort("timestamp")} className="text-left hover:underline">Updated</button>
                  <span>Actions</span>
                </div>
                {godModePaginatedRows.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                    No records found.
                  </div>
                ) : (
                  godModePaginatedRows.map((row) => (
                    <div key={row.id} className={`grid ${canSelectGodRows ? 'grid-cols-[auto_1.7fr_1.2fr_auto_auto_auto]' : 'grid-cols-[1.7fr_1.2fr_auto_auto_auto]'} gap-3 px-6 py-4 text-[10px] border-b border-outline-variant/20 transition-all items-center hover:bg-surface-container-low/40 text-on-surface-variant`}>
                      {canSelectGodRows && (
                        <input
                          type="checkbox"
                          checked={selectedGodRows.includes(row.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedGodRows((prev) => [...prev, row.id]);
                            else setSelectedGodRows((prev) => prev.filter((id) => id !== row.id));
                          }}
                          className="rounded border-outline-variant text-error focus:ring-error/30 bg-surface-container-low h-4 w-4 transition-all"
                        />
                      )}
                      <span className="font-bold truncate text-on-surface" title={row.primary}>{row.primary}</span>
                      <span className="truncate text-on-surface-variant/80" title={row.secondary}>{row.secondary}</span>
                      <span className="font-bold uppercase tracking-widest text-on-surface-variant">{row.status}</span>
                      <span className="text-on-surface-variant/60">{format(new Date(row.timestamp), "MMM d, HH:mm")}</span>
                      <button
                        onClick={() => handleOpenGodModeRow(row)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                  {godModeRows.length} records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setGodModePage((prev) => Math.max(1, prev - 1))}
                    disabled={godModePage === 1}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    Page {godModePage} / {godModeTotalPages}
                  </span>
                  <button
                    onClick={() => setGodModePage((prev) => Math.min(godModeTotalPages, prev + 1))}
                    disabled={godModePage >= godModeTotalPages}
                    className="px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest disabled:opacity-30 bg-surface-container-low hover:bg-surface-container-high text-on-surface border border-outline-variant/30 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[
                { label: 'Approve Queue', value: approvalCandidateIds.length, action: handleApproveAllPending, cta: 'Approve All Pending' },
                { label: 'Feature Approved', value: approvedNotFeaturedIds.length, action: handleFeatureAllApproved, cta: 'Feature Approved' },
                { label: 'Unfeature Current', value: featuredProjectIds.length, action: handleUnfeatureAll, cta: 'Unfeature All' },
                { label: 'Promote Users', value: promoteCandidateIds.length, action: handlePromoteAllUsers, cta: 'Promote All Users' },
                { label: 'Demote Admins', value: demoteCandidateIds.length, action: handleDemoteAllAdmins, cta: 'Demote Other Admins' },
                { label: 'Snapshot Export', value: projects.length + users.length + testimonials.length, action: handleDownloadGodSnapshot, cta: 'Export Full Snapshot' },
              ].map((item) => (
                <div key={item.label} className="glass-card rounded-[2.5rem] p-6 space-y-4 border border-outline-variant/30">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">{item.label}</p>
                  <p className="text-3xl font-display text-on-surface">{item.value}</p>
                  <button
                    onClick={item.action}
                    disabled={!godModeEnabled || godModeBusy}
                    className="w-full py-3 rounded-xl bg-error text-on-error text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98] transition-all"
                  >
                    {item.cta}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card rounded-[2.5rem] border border-outline-variant/30 shadow-2xl w-full max-w-md p-8 bg-surface-container/95"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="p-6 rounded-full bg-error/10 text-error animate-pulse">
                  <AlertCircle className="h-10 w-10 text-error" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-headline-md uppercase tracking-tight text-on-surface">
                    {confirmModal.title}
                  </h3>
                  <p className="text-sm font-sans leading-relaxed text-on-surface-variant/80">
                    {confirmModal.message}
                  </p>
                </div>
                <div className="flex items-center space-x-4 w-full">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className="flex-1 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest bg-surface-container-low hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/30 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="flex-1 px-8 py-4 bg-error text-on-error rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-colors shadow-lg shadow-error/20"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Edit Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card rounded-[2.5rem] border border-outline-variant/30 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest/90 backdrop-blur-2xl"
            >
              <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center sticky top-0 backdrop-blur-xl z-10 bg-surface-container/85">
                <div className="flex items-center space-x-6">
                  <h2 className="text-2xl font-headline-md uppercase tracking-tight text-on-surface">Manage Project</h2>
                  <span className={`px-4 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${STATUS_COLORS[selectedProject.status]}`}>
                    {selectedProject.status.replace("_", " ")}
                  </span>
                </div>
                <button onClick={() => setSelectedProject(null)} className="p-3 rounded-full hover:bg-surface-container-high text-on-surface-variant/60 hover:text-on-surface transition-colors">
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-outline-variant/20 bg-surface/50">
                <div className="lg:col-span-2 p-8 space-y-12">
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-on-surface-variant/60">Project Overview</h3>
                    <div className="p-8 rounded-3xl border border-outline-variant/30 space-y-4 bg-surface-container-low/40">
                      <h4 className="text-xl font-bold uppercase tracking-tight text-on-surface">{selectedProject.title}</h4>
                      <div className="text-sm font-sans leading-relaxed prose prose-sm max-w-none text-on-surface-variant/80">
                        <LazyMarkdown>{selectedProject.description}</LazyMarkdown>
                      </div>
                    </div>
                  </section>
 
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-on-surface-variant/60">User Info</h3>
                      <div className="flex items-center space-x-4 p-4 border border-outline-variant/30 rounded-2xl bg-surface-container-low/40">
                        <div className="h-12 w-12 rounded-xl border border-outline-variant/30 flex items-center justify-center font-bold text-lg bg-surface-container-high text-primary">
                          {(selectedProject.user?.name || "?").charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-on-surface">{selectedProject.user?.name ?? "—"}</div>
                          <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">{selectedProject.user?.email ?? ""}</div>
                        </div>
                      </div>
                    </section>
                    <section>
                      <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-on-surface-variant/60">Attachments</h3>
                      <div className="space-y-3">
                        {(selectedProject.files || []).length === 0 ? (
                          <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">No files</p>
                        ) : (
                          (selectedProject.files || []).map((file: { id: string; path: string; originalName: string }) => (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 p-4 border border-outline-variant/30 rounded-xl bg-surface-container-low/40"
                            >
                              <a
                                href={file.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex flex-1 items-center justify-between min-w-0 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
                              >
                                <span className="truncate max-w-[140px]">{file.originalName}</span>
                                <Download className="h-4 w-4 shrink-0 text-on-surface-variant/30" />
                              </a>
                              <button
                                type="button"
                                onClick={() => handleAdminDeleteFile(file.id, selectedProject.id)}
                                className="p-2 rounded-lg shrink-0 text-error hover:bg-error/10 transition-colors"
                                title="Remove file"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
 
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-on-surface-variant/60">Reassign owner</h3>
                    <div className="flex flex-col sm:flex-row gap-3 p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low/40">
                      <select
                        value={reassignUserId}
                        onChange={(e) => setReassignUserId(e.target.value)}
                        className="flex-1 border border-outline-variant rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-widest bg-surface-container text-on-surface focus:border-primary outline-none"
                      >
                        {users.map((u) => (
                          <option key={u.id} value={u.id} className="bg-background text-on-surface">
                            {u.name} — {u.email}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleReassignProject}
                        disabled={!reassignUserId || reassignUserId === selectedProject.userId}
                        className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
                      >
                        Apply
                      </button>
                    </div>
                  </section>
 
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-on-surface-variant/60">Admin Actions</h3>
                    <div className="space-y-8">
                      <div>
                        <label className="block text-[10px] font-bold mb-4 uppercase tracking-widest text-on-surface-variant/60">Update Status</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => handleUpdateStatus(selectedProject.id, s, true)}
                              disabled={isUpdating}
                              className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                selectedProject.status === s 
                                ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                                : "bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:bg-surface-container-high hover:border-outline-variant"
                              }`}
                            >
                              {s.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-6 rounded-2xl border border-outline-variant/30 bg-surface-container-low/40">
                        <div className="flex items-center space-x-4">
                          <Star className={`h-6 w-6 ${selectedProject.featured ? "text-tertiary fill-current" : "text-on-surface-variant/30"}`} />
                          <div>
                            <div className="text-sm font-bold text-tertiary uppercase tracking-tight">Featured Project</div>
                            <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/60">Show this project on the public gallery</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFeatured(selectedProject.id, !selectedProject.featured)}
                          className={`w-14 h-7 rounded-full transition-colors relative ${selectedProject.featured ? "bg-tertiary" : "bg-surface-container-high"}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${selectedProject.featured ? "left-8" : "left-1"}`} />
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
 
                <div className="p-8 space-y-10 bg-surface-container-low/30">
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-on-surface-variant/60">Internal Notes</h3>
                    <textarea
                      rows={4}
                      placeholder="ADD A PRIVATE NOTE..."
                      className="w-full p-6 text-sm border border-outline-variant bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 rounded-2xl outline-none font-sans resize-none focus:border-primary transition-all"
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                    />
                    <button
                      onClick={() => handleUpdateStatus(selectedProject.id, selectedProject.status, false)}
                      className="mt-4 w-full py-4 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      Save Note
                    </button>
                  </section>
 
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-on-surface-variant/60">History</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {(selectedProject.adminNotes || []).map((note: { id: string; note: string; createdAt: string }) => (
                        <div key={note.id} className="p-5 border border-outline-variant/20 rounded-2xl space-y-3 bg-surface-container/60">
                          <p className="text-xs leading-relaxed font-sans text-on-surface-variant">{note.note}</p>
                          <div className="flex items-center justify-between gap-2 text-[8px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                            <span>Admin</span>
                            <div className="flex items-center gap-2">
                              <span>{format(new Date(note.createdAt), "MMM d, HH:mm")}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteAdminNote(note.id, selectedProject.id)}
                                className="p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors"
                                title="Delete note"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {userBeingEdited && (
          <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-[2rem] border border-outline-variant/30 shadow-2xl w-full max-w-md p-8 space-y-6 bg-surface-container-lowest/90 backdrop-blur-2xl"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-headline-md uppercase tracking-tight text-on-surface">Edit user</h2>
                <button
                  type="button"
                  onClick={() => setUserBeingEdited(null)}
                  className="p-2 rounded-full hover:bg-surface-container-high text-on-surface-variant/60 hover:text-on-surface transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-on-surface-variant/60">Display name</label>
                  <input
                    type="text"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest mb-2 text-on-surface-variant/60">Email (profile)</label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-container text-on-surface placeholder:text-on-surface-variant/30 text-sm outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUserBeingEdited(null)}
                  className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30 text-on-surface-variant bg-surface-container-low hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveUserEdit}
                  className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Project Preview Side Panel */}
      <AnimatePresence>
        {previewProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewProject(null)}
              className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-2xl z-[90] shadow-2xl flex flex-col bg-surface-container-lowest/98 backdrop-blur-3xl border-l border-outline-variant/30"
            >
              <div className="p-8 border-b border-outline-variant/20 flex justify-between items-center bg-surface-container/70">
                <div className="space-y-1">
                  <h2 className="text-2xl font-headline-md uppercase tracking-tight text-on-surface">Project Preview</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">
                    ID: {previewProject.id}
                  </p>
                </div>
                <button 
                  onClick={() => setPreviewProject(null)} 
                  className="p-3 rounded-full hover:bg-surface-container-high text-on-surface-variant/60 hover:text-on-surface transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-12 custom-scrollbar">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60">Description</h3>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${STATUS_COLORS[previewProject.status]}`}>
                      {previewProject.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className="p-8 rounded-3xl border border-outline-variant/30 space-y-4 bg-surface-container-low/40">
                    <h4 className="text-xl font-bold uppercase tracking-tight text-on-surface">{previewProject.title}</h4>
                    <div className="text-sm font-sans leading-relaxed prose prose-sm max-w-none text-on-surface-variant/80">
                      <LazyMarkdown>{previewProject.description}</LazyMarkdown>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60">Category</h3>
                    <div className="p-4 rounded-2xl border border-outline-variant/30 text-sm font-bold uppercase tracking-widest bg-surface-container-low/40 text-on-surface">
                      {previewProject.category}
                    </div>
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60">Budget</h3>
                    <div className="p-4 rounded-2xl border border-outline-variant/30 text-sm font-bold uppercase tracking-widest bg-surface-container-low/40 text-on-surface">
                      {previewProject.budget}
                    </div>
                  </section>
                </div>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60">User Information</h3>
                  <div className="flex items-center space-x-4 p-6 border border-outline-variant/30 rounded-2xl bg-surface-container-low/40">
                    <div className="h-12 w-12 rounded-xl border border-outline-variant/30 flex items-center justify-center font-bold text-lg bg-surface-container-high text-primary">
                      {previewProject.user?.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface">{previewProject.user?.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">{previewProject.user?.email}</div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant/60">Timeline</h3>
                  <div className="p-4 rounded-2xl border border-outline-variant/30 text-sm font-bold uppercase tracking-widest bg-surface-container-low/40 text-on-surface">
                    {previewProject.timeline}
                  </div>
                </section>
              </div>

              <div className="p-8 border-t border-outline-variant/20 flex space-x-4 bg-surface-container/70">
                <button
                  onClick={() => {
                    setSelectedProject(previewProject);
                    setPreviewProject(null);
                  }}
                  className="flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-primary text-on-primary hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Manage Project
                </button>
                <button
                  onClick={() => setPreviewProject(null)}
                  className="flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-outline-variant/30 bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
};
