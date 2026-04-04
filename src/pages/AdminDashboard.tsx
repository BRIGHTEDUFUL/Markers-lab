import React, { useState, useEffect } from "react";
import {
  fetchAdminProjects,
  fetchAdminAnalytics,
  fetchAdminUsers,
  fetchAdminTestimonials,
  adminUpdateProject,
  adminDeleteProject,
  adminBulkUpdateProjects,
  adminBulkDeleteProjects,
  adminSetUserRole,
  adminDeleteUserProfile,
  adminSetTestimonialApproved,
  adminDeleteTestimonial,
} from "../lib/makers-data";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { 
  Search, Filter, MoreVertical, Edit2, Trash2, CheckCircle, XCircle, 
  Clock, AlertCircle, Download, ExternalLink, Star, MessageSquare, 
  Loader2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, User as UserIcon, Calendar, Tag, 
  DollarSign, Clock as ClockIcon, FileText, BarChart3, Users, Briefcase, Image, Rocket
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { 
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Legend, CartesianGrid 
} from "recharts";
import PageHero from "../components/PageHero";
import { Project, User, Analytics, Testimonial } from "../types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const CATEGORIES = ["Website", "E-commerce", "Portfolio", "Web Application", "Mobile App", "Desktop Software", "AI / Machine Learning", "Blockchain / Web3", "Cloud Infrastructure", "Cybersecurity", "Other"];
const STATUSES = ["PENDING", "IN_REVIEW", "APPROVED", "IN_PROGRESS", "COMPLETED", "REJECTED"];

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
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
  const [view, setView] = useState<"OVERVIEW" | "SUBMISSIONS" | "GALLERY" | "USERS" | "TESTIMONIALS">("OVERVIEW");
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

  const fetchData = async (): Promise<Project[] | undefined> => {
    try {
      const [p, a, u, t] = await Promise.all([
        fetchAdminProjects(),
        fetchAdminAnalytics(),
        fetchAdminUsers(),
        fetchAdminTestimonials(),
      ]);
      setProjects(Array.isArray(p) ? p : []);
      setAnalytics(a || null);
      setUsers(Array.isArray(u) ? u : []);
      setTestimonials(Array.isArray(t) ? t : []);
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

  const filteredAndSortedProjects = [...projects]
    .filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || 
                           p.user.name.toLowerCase().includes(search.toLowerCase()) ||
                           p.user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
      const matchesFeatured = featuredFilter === "ALL" || 
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

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, featuredFilter, itemsPerPage]);

  if (loading) return (
    <div className={`flex items-center justify-center h-screen ${theme === 'light' ? 'bg-slate-50' : 'bg-[#050505]'}`}>
      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
    </div>
  );

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                         u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${
      theme === 'light' ? 'bg-slate-50' : 'bg-[#050505]'
    }`}>
      <PageHero 
        title={`Admin <br /><span class='text-transparent italic' style='-webkit-text-stroke: 1px ${theme === 'light' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.3)'}'>Console</span>`}
        subtitle="Global project oversight and management terminal."
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
              {projects.filter(p => p.status === "PENDING").length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[8px] rounded-full">
                  {projects.filter(p => p.status === "PENDING").length}
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
                { label: "Total Projects", value: analytics?.totalProjects, icon: Briefcase, color: theme === 'light' ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400" },
                { label: "Total Users", value: analytics?.totalUsers, icon: Users, color: theme === 'light' ? "bg-purple-50 text-purple-600" : "bg-purple-500/10 text-purple-400" },
                { label: "Pending Review", value: analytics?.statusCounts?.find((s: any) => s.status === "PENDING")?._count || 0, icon: Clock, color: theme === 'light' ? "bg-yellow-50 text-yellow-600" : "bg-yellow-500/10 text-yellow-400" },
                { label: "Completed", value: analytics?.statusCounts?.find((s: any) => s.status === "COMPLETED")?._count || 0, icon: CheckCircle, color: theme === 'light' ? "bg-green-50 text-green-600" : "bg-green-500/10 text-green-400" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className={`p-8 rounded-3xl border transition-all ${
                    theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className={`p-4 rounded-2xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <span className={`text-3xl font-display ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{stat.value}</span>
                  </div>
                  <p className={`text-[10px] font-bold uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`p-8 rounded-3xl border transition-all ${
                theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
              }`}>
                <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-8 flex items-center ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>
                  <BarChart3 className="h-4 w-4 mr-3 text-indigo-400" />
                  Project Status Distribution
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics?.statusCounts?.map((s: any) => ({
                          name: s.status.replace("_", " "),
                          value: s._count
                        })) || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics?.statusCounts?.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={
                            entry.status === "COMPLETED" ? "#22c55e" :
                            entry.status === "PENDING" ? "#eab308" :
                            entry.status === "IN_PROGRESS" ? "#6366f1" :
                            entry.status === "IN_REVIEW" ? "#3b82f6" :
                            "#ef4444"
                          } />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: theme === 'light' ? "#fff" : "#1a1a1a", 
                          borderRadius: "12px", 
                          border: `1px solid ${theme === 'light' ? "#e2e8f0" : "rgba(255,255,255,0.1)"}`, 
                          color: theme === 'light' ? "#000" : "#fff" 
                        }}
                        itemStyle={{ color: theme === 'light' ? "#000" : "#fff" }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        wrapperStyle={{ 
                          paddingTop: '20px', 
                          fontSize: '10px', 
                          textTransform: 'uppercase', 
                          letterSpacing: '0.1em',
                          color: theme === 'light' ? '#64748b' : '#94a3b8'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`p-8 rounded-3xl border transition-all ${
                theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
              }`}>
                <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-8 flex items-center ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>
                  <Tag className="h-4 w-4 mr-3 text-indigo-400" />
                  Projects by Category
                </h3>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analytics?.categoryCounts?.map((c: any) => ({
                        name: c.category.replace("_", " "),
                        count: c._count
                      })) || []}
                      layout="vertical"
                      margin={{ left: 40, right: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'light' ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)"} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={100} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fontWeight: 700, fill: theme === 'light' ? "rgba(0,0,0,0.4)" : "rgba(255,255,255,0.4)" }}
                      />
                      <Tooltip 
                        cursor={{ fill: theme === 'light' ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.02)" }}
                        contentStyle={{ 
                          backgroundColor: theme === 'light' ? "#fff" : "#1a1a1a", 
                          borderRadius: "12px", 
                          border: `1px solid ${theme === 'light' ? "#e2e8f0" : "rgba(255,255,255,0.1)"}`, 
                          color: theme === 'light' ? "#000" : "#fff" 
                        }}
                        itemStyle={{ color: theme === 'light' ? "#000" : "#fff" }}
                      />
                      <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Projects Table */}
            <div className={`rounded-[2.5rem] border overflow-hidden transition-all ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
            }`}>
              <div className={`p-8 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                theme === 'light' ? 'border-slate-100' : 'border-white/5'
              }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-grow">
                  <div className="relative flex-grow max-w-md w-full">
                    <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
                    <input
                      type="text"
                      placeholder="SEARCH PROJECTS, USERS, EMAILS..."
                      className={`w-full pl-12 pr-6 py-4 border rounded-2xl transition-all outline-none text-[10px] font-bold tracking-widest ${
                        theme === 'light' 
                          ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-slate-200' 
                          : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'
                      }`}
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                  
                  {selectedProjects.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex items-center space-x-4 border px-6 py-2 rounded-2xl ${
                        theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-500/10 border-indigo-500/20'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{selectedProjects.length} SELECTED</span>
                      <div className={`h-4 w-px ${theme === 'light' ? 'bg-indigo-200' : 'bg-indigo-500/20'}`} />
                      <select
                        className={`bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}
                        value={bulkStatus}
                        onChange={e => setBulkStatus(e.target.value)}
                      >
                        <option value="" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>BULK STATUS</option>
                        {STATUSES.map(s => <option key={s} value={s} className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>{s.replace("_", " ")}</option>)}
                      </select>
                      <button 
                        onClick={handleBulkStatusUpdate}
                        disabled={!bulkStatus || isUpdating}
                        className="p-2 hover:bg-indigo-500 text-indigo-500 hover:text-white rounded-lg transition-all disabled:opacity-50"
                        title="Apply Status"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={handleBulkDelete}
                        disabled={isUpdating}
                        className={`p-2 rounded-lg transition-all ${
                          theme === 'light' ? 'hover:bg-red-50 text-red-500/60 hover:text-red-600' : 'hover:bg-red-500/20 text-red-500/40 hover:text-red-500'
                        }`}
                        title="Bulk Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedProjects([])}
                        className={`p-2 rounded-lg transition-all ${
                          theme === 'light' ? 'hover:bg-red-50 text-red-500/60 hover:text-red-600' : 'hover:bg-red-500/20 text-red-500/40 hover:text-red-500'
                        }`}
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <button
                    onClick={handleExportData}
                    className={`flex items-center px-6 py-4 border rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      theme === 'light' 
                        ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                    }`}
                  >
                    <Download className="h-4 w-4 mr-3 text-indigo-500" />
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
                              {project.user.name.charAt(0)}
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.user.name}</div>
                              <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{project.user.email}</div>
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
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        if (totalPages > 5 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                          if (page === 2 || page === totalPages - 1) return <span key={page} className={`px-1 ${theme === 'light' ? 'text-slate-300' : 'text-white/10'}`}>...</span>;
                          return null;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-xl text-[10px] font-bold transition-all ${
                              currentPage === page 
                                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                : theme === 'light' ? "hover:bg-slate-100 text-slate-400" : "hover:bg-white/10 text-white/40"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
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
            <div className={`rounded-[2.5rem] border overflow-hidden transition-all ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
            }`}>
              <div className={`p-8 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                theme === 'light' ? 'border-slate-100' : 'border-white/5'
              }`}>
                <div className="relative flex-grow max-w-md w-full">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
                  <input
                    type="text"
                    placeholder="SEARCH USERS BY NAME OR EMAIL..."
                    className={`w-full pl-12 pr-6 py-4 border rounded-2xl transition-all outline-none text-[10px] font-bold tracking-widest ${
                      theme === 'light' 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-slate-200' 
                        : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'
                    }`}
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Filter className={`h-4 w-4 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
                  <select
                    className={`border rounded-2xl px-6 py-4 text-[10px] font-bold uppercase tracking-widest outline-none transition-all ${
                      theme === 'light' 
                        ? 'bg-white border-slate-200 text-slate-900 focus:ring-slate-200' 
                        : 'bg-white/5 border-white/10 text-white focus:ring-white/30'
                    }`}
                    value={userRoleFilter}
                    onChange={e => setUserRoleFilter(e.target.value)}
                  >
                    <option value="ALL" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>ALL ROLES</option>
                    <option value="USER" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>USER</option>
                    <option value="ADMIN" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>ADMIN</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      theme === 'light' ? 'bg-slate-50 text-slate-400' : 'bg-white/2 text-white/20'
                    }`}>
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Role</th>
                      <th className="px-8 py-6">Projects</th>
                      <th className="px-8 py-6">Joined</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} className={`transition-colors group ${
                        theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/2'
                      }`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            }`}>
                              {u.name.charAt(0)}
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{u.name}</div>
                              <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                            className={`border rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none transition-all ${
                              theme === 'light' 
                                ? 'bg-white border-slate-200 text-slate-900 focus:ring-slate-200' 
                                : 'bg-white/5 border-white/10 text-white focus:ring-white/30'
                            }`}
                          >
                            <option value="USER" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>USER</option>
                            <option value="ADMIN" className={theme === 'light' ? 'bg-white' : 'bg-[#1a1a1a]'}>ADMIN</option>
                          </select>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-2">
                            <Briefcase className="h-3 w-3 text-indigo-400" />
                            <span className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{u._count.projects}</span>
                          </div>
                        </td>
                        <td className={`px-8 py-6 text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                          {format(new Date(u.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user?.id}
                            className={`p-3 rounded-xl transition-all disabled:opacity-0 ${
                              theme === 'light' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-red-500/20 hover:text-red-500 hover:bg-red-500/10'
                            }`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
              {projects.filter(p => p.featured).map((project) => (
                <div key={project.id} className={`rounded-[2.5rem] border overflow-hidden group transition-all ${
                  theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
                }`}>
                  <div className={`aspect-video relative overflow-hidden ${theme === 'light' ? 'bg-slate-100' : 'bg-[#0a0a0a]'}`}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <span className="px-4 py-1.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full text-[9px] font-bold text-white uppercase tracking-[0.2em]">
                        {project.category}
                      </span>
                    </div>
                    <button 
                      onClick={() => handleToggleFeatured(project.id, false)}
                      className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="p-8 space-y-6">
                    <h3 className={`font-display text-2xl uppercase tracking-tight group-hover:text-indigo-400 transition-colors ${
                      theme === 'light' ? 'text-slate-900' : 'text-white'
                    }`}>{project.title}</h3>
                    <p className={`text-sm font-sans line-clamp-2 leading-relaxed ${
                      theme === 'light' ? 'text-slate-500' : 'text-white/40'
                    }`}>{project.description}</p>
                    <div className={`flex items-center justify-between pt-6 border-t ${
                      theme === 'light' ? 'border-slate-100' : 'border-white/5'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <div className={`h-8 w-8 rounded-xl border flex items-center justify-center font-bold text-[10px] ${
                          theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {project.user.name.charAt(0)}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${
                          theme === 'light' ? 'text-slate-400' : 'text-white/20'
                        }`}>{project.user.name}</span>
                      </div>
                      <Link to="/gallery" className={`p-2 rounded-lg transition-colors ${
                        theme === 'light' ? 'bg-slate-100 text-slate-400 hover:text-slate-900' : 'bg-white/5 text-white/40 hover:text-white'
                      }`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              <Link 
                to="/submit-project"
                className={`aspect-video md:aspect-auto border-2 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center space-y-6 transition-all group p-12 ${
                  theme === 'light' 
                    ? 'bg-white border-slate-200 hover:bg-slate-50 hover:border-indigo-500/50' 
                    : 'bg-white/2 border-white/10 hover:bg-white/5 hover:border-indigo-500/50'
                }`}
              >
                <div className={`p-6 rounded-full border transition-transform group-hover:scale-110 ${
                  theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'
                }`}>
                  <Rocket className="h-8 w-8 text-indigo-400" />
                </div>
                <div className="text-center space-y-2">
                  <p className={`text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Add Gallery Item</p>
                  <p className={`text-xs uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Submit a new project to showcase</p>
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
            <div className={`rounded-[2.5rem] border overflow-hidden transition-all ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
            }`}>
              <div className={`p-8 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                theme === 'light' ? 'border-slate-100' : 'border-white/5'
              }`}>
                <div className="space-y-1">
                  <h2 className={`text-xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Project Submissions</h2>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Review and manage new project requests</p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest ${
                    theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-white/5 text-white/40'
                  }`}>
                    {projects.filter(p => p.status === "PENDING").length} PENDING
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      theme === 'light' ? 'bg-slate-50 text-slate-400' : 'bg-white/2 text-white/20'
                    }`}>
                      <th className="px-8 py-6">Project</th>
                      <th className="px-8 py-6">Client</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Date</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {projects
                      .filter(p => p.status === "PENDING" || p.status === "IN_REVIEW")
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((project) => (
                      <tr key={project.id} className={`transition-colors group ${
                        theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/2'
                      }`}>
                        <td className="px-8 py-6">
                          <button 
                            onClick={() => setPreviewProject(project)}
                            className={`text-sm font-bold text-left hover:text-indigo-500 transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}
                          >
                            {project.title}
                          </button>
                          <div className={`text-[10px] uppercase tracking-widest mt-1 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                            {project.category}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <div className={`h-8 w-8 rounded-xl border flex items-center justify-center font-bold text-[10px] ${
                              theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            }`}>
                              {project.user.name.charAt(0)}
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{project.user.name}</div>
                              <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>{project.user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-bold border uppercase tracking-widest ${STATUS_COLORS[project.status]}`}>
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className={`px-8 py-6 text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                          {format(new Date(project.createdAt), "MMM d, yyyy")}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleUpdateStatus(project.id, "IN_REVIEW", false)}
                              className={`p-3 rounded-xl transition-all ${
                                theme === 'light' ? 'text-blue-400 hover:text-blue-600 hover:bg-blue-50' : 'text-blue-500/20 hover:text-blue-500 hover:bg-blue-500/10'
                              }`}
                              title="Mark as In Review"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setSelectedProject(project)}
                              className={`p-3 rounded-xl transition-all ${
                                theme === 'light' ? 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50' : 'text-indigo-500/20 hover:text-indigo-500 hover:bg-indigo-500/10'
                              }`}
                              title="Manage Project"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {projects.filter(p => p.status === "PENDING" || p.status === "IN_REVIEW").length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-24 text-center">
                          <div className="flex flex-col items-center space-y-4">
                            <Rocket className={`h-12 w-12 ${theme === 'light' ? 'text-slate-200' : 'text-white/5'}`} />
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>No pending submissions</p>
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
            <div className={`rounded-[2.5rem] border overflow-hidden transition-all ${
              theme === 'light' ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 backdrop-blur-3xl border-white/10'
            }`}>
              <div className={`p-8 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                theme === 'light' ? 'border-slate-100' : 'border-white/5'
              }`}>
                <div className="relative flex-grow max-w-md w-full">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
                  <input
                    type="text"
                    placeholder="SEARCH TESTIMONIALS BY USER OR PROJECT..."
                    className={`w-full pl-12 pr-6 py-4 border rounded-2xl transition-all outline-none text-[10px] font-bold tracking-widest ${
                      theme === 'light' 
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-slate-200' 
                        : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'
                    }`}
                    value={testimonialSearch}
                    onChange={e => setTestimonialSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`text-[10px] font-bold uppercase tracking-[0.2em] ${
                      theme === 'light' ? 'bg-slate-50 text-slate-400' : 'bg-white/2 text-white/20'
                    }`}>
                      <th className="px-8 py-6">User</th>
                      <th className="px-8 py-6">Project</th>
                      <th className="px-8 py-6">Rating</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-100' : 'divide-white/5'}`}>
                    {testimonials
                      .filter(t => 
                        t.user?.name.toLowerCase().includes(testimonialSearch.toLowerCase()) || 
                        t.project?.title.toLowerCase().includes(testimonialSearch.toLowerCase())
                      )
                      .map((t) => (
                      <tr key={t.id} className={`transition-colors group ${
                        theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/2'
                      }`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                              theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                            }`}>
                              {t.user?.name.charAt(0)}
                            </div>
                            <div>
                              <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.user?.name}</div>
                              <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{t.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{t.project?.title}</div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-3 w-3 ${i < t.rating ? "text-amber-500 fill-current" : theme === 'light' ? "text-slate-200" : "text-white/10"}`} />
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
                                  ? theme === 'light' ? 'text-yellow-400 hover:text-yellow-600 hover:bg-yellow-50' : 'text-yellow-500/20 hover:text-yellow-400 hover:bg-yellow-500/10'
                                  : theme === 'light' ? 'text-green-400 hover:text-green-600 hover:bg-green-50' : 'text-green-500/20 hover:text-green-400 hover:bg-green-500/10'
                              }`}
                              title={t.isApproved ? "Unapprove" : "Approve"}
                            >
                              {t.isApproved ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteTestimonial(t.id)}
                              className={`p-3 rounded-xl transition-all ${
                                theme === 'light' ? 'text-red-400 hover:text-red-600 hover:bg-red-50' : 'text-red-500/20 hover:text-red-500 hover:bg-red-500/10'
                              }`}
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
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`rounded-[2.5rem] border shadow-2xl w-full max-w-md p-8 ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className={`p-6 rounded-full ${theme === 'light' ? 'bg-red-50' : 'bg-red-500/10'}`}>
                  <AlertCircle className="h-10 w-10 text-red-500" />
                </div>
                <div className="space-y-2">
                  <h3 className={`text-xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                    {confirmModal.title}
                  </h3>
                  <p className={`text-sm font-sans leading-relaxed ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                    {confirmModal.message}
                  </p>
                </div>
                <div className="flex items-center space-x-4 w-full">
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className={`flex-1 px-8 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      theme === 'light' 
                        ? 'bg-slate-100 text-slate-900 hover:bg-slate-200' 
                        : 'bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="flex-1 px-8 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
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
              className={`rounded-[2.5rem] border shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#0a0a0a] border-white/10'
              }`}
            >
              <div className={`p-8 border-b flex justify-between items-center sticky top-0 backdrop-blur-xl z-10 ${
                theme === 'light' ? 'bg-white/80 border-slate-100' : 'bg-[#0a0a0a]/80 border-white/5'
              }`}>
                <div className="flex items-center space-x-6">
                  <h2 className={`text-2xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Manage Project</h2>
                  <span className={`px-4 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${STATUS_COLORS[selectedProject.status]}`}>
                    {selectedProject.status.replace("_", " ")}
                  </span>
                </div>
                <button onClick={() => setSelectedProject(null)} className={`p-3 rounded-full transition-colors ${
                  theme === 'light' ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/5 text-white/20'
                }`}>
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className={`grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x ${
                theme === 'light' ? 'divide-slate-100' : 'divide-white/5'
              }`}>
                <div className="lg:col-span-2 p-8 space-y-12">
                  <section>
                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Project Overview</h3>
                    <div className={`p-8 rounded-3xl border space-y-4 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'
                    }`}>
                      <h4 className={`text-xl font-bold uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedProject.title}</h4>
                      <div className={`text-sm font-sans leading-relaxed prose prose-sm max-w-none ${
                        theme === 'light' ? 'text-slate-600 prose-slate' : 'text-white/40 prose-invert'
                      }`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {selectedProject.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </section>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <section>
                      <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>User Info</h3>
                      <div className={`flex items-center space-x-4 p-4 border rounded-2xl ${
                        theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'
                      }`}>
                        <div className={`h-12 w-12 rounded-xl border flex items-center justify-center font-bold text-lg ${
                          theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        }`}>
                          {selectedProject.user.name.charAt(0)}
                        </div>
                        <div>
                          <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedProject.user.name}</div>
                          <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{selectedProject.user.email}</div>
                        </div>
                      </div>
                    </section>
                    <section>
                      <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Attachments</h3>
                      <div className="space-y-3">
                        {selectedProject.files.map((file: any) => (
                          <a key={file.id} href={file.path} className={`flex items-center justify-between p-4 border rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
                            theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100' : 'bg-white/2 border-white/5 text-white/40 hover:bg-white/5'
                          }`}>
                            <span className="truncate max-w-[150px]">{file.originalName}</span>
                            <Download className={`h-4 w-4 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
                          </a>
                        ))}
                      </div>
                    </section>
                  </div>

                  <section>
                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Admin Actions</h3>
                    <div className="space-y-8">
                      <div>
                        <label className={`block text-[10px] font-bold mb-4 uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Update Status</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {STATUSES.map(s => (
                            <button
                              key={s}
                              onClick={() => handleUpdateStatus(selectedProject.id, s, true)}
                              disabled={isUpdating}
                              className={`px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                                selectedProject.status === s 
                                ? theme === 'light' ? "bg-slate-900 text-white border-slate-900 shadow-xl" : "bg-white text-black border-white shadow-xl" 
                                : theme === 'light' ? "bg-white text-slate-400 border-slate-200 hover:border-slate-400" : "bg-white/2 text-white/40 border-white/5 hover:border-white/20"
                              }`}
                            >
                              {s.replace("_", " ")}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className={`flex items-center justify-between p-6 rounded-2xl border ${
                        theme === 'light' ? 'bg-amber-50 border-amber-100' : 'bg-amber-500/5 border-amber-100/10'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <Star className={`h-6 w-6 ${selectedProject.featured ? "text-amber-500 fill-current" : theme === 'light' ? "text-amber-200" : "text-amber-500/20"}`} />
                          <div>
                            <div className="text-sm font-bold text-amber-500 uppercase tracking-tight">Featured Project</div>
                            <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-amber-500/60' : 'text-amber-500/40'}`}>Show this project on the public gallery</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleFeatured(selectedProject.id, !selectedProject.featured)}
                          className={`w-14 h-7 rounded-full transition-colors relative ${selectedProject.featured ? "bg-amber-500" : theme === 'light' ? "bg-slate-200" : "bg-white/10"}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${selectedProject.featured ? "left-8" : "left-1"}`} />
                        </button>
                      </div>
                    </div>
                  </section>
                </div>

                <div className={`p-8 space-y-10 ${theme === 'light' ? 'bg-slate-50' : 'bg-white/2'}`}>
                  <section>
                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Internal Notes</h3>
                    <textarea
                      rows={4}
                      placeholder="ADD A PRIVATE NOTE..."
                      className={`w-full p-6 text-sm border rounded-2xl outline-none font-sans resize-none transition-all ${
                        theme === 'light' 
                          ? 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-slate-200' 
                          : 'bg-white/5 border-white/10 text-white placeholder:text-white/10 focus:ring-white/30'
                      }`}
                      value={adminNote}
                      onChange={e => setAdminNote(e.target.value)}
                    />
                    <button
                      onClick={() => handleUpdateStatus(selectedProject.id, selectedProject.status, false)}
                      className={`mt-4 w-full py-4 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${
                        theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'
                      }`}
                    >
                      Save Note
                    </button>
                  </section>

                  <section>
                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-6 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>History</h3>
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {selectedProject.adminNotes.map((note: any) => (
                        <div key={note.id} className={`p-5 border rounded-2xl space-y-3 ${
                          theme === 'light' ? 'bg-white border-slate-100' : 'bg-white/2 border-white/5'
                        }`}>
                          <p className={`text-xs leading-relaxed font-sans ${theme === 'light' ? 'text-slate-600' : 'text-white/60'}`}>{note.note}</p>
                          <div className={`flex items-center justify-between text-[8px] font-bold uppercase tracking-widest ${
                            theme === 'light' ? 'text-slate-400' : 'text-white/20'
                          }`}>
                            <span>Admin</span>
                            <span>{format(new Date(note.createdAt), "MMM d, HH:mm")}</span>
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
              className={`fixed right-0 top-0 bottom-0 w-full max-w-2xl z-[90] shadow-2xl flex flex-col ${
                theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]'
              }`}
            >
              <div className={`p-8 border-b flex justify-between items-center ${
                theme === 'light' ? 'border-slate-100' : 'border-white/5'
              }`}>
                <div className="space-y-1">
                  <h2 className={`text-2xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Project Preview</h2>
                  <p className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>
                    ID: {previewProject.id}
                  </p>
                </div>
                <button 
                  onClick={() => setPreviewProject(null)} 
                  className={`p-3 rounded-full transition-colors ${
                    theme === 'light' ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-white/5 text-white/20'
                  }`}
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-8 space-y-12 custom-scrollbar">
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Description</h3>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold border uppercase tracking-widest ${STATUS_COLORS[previewProject.status]}`}>
                      {previewProject.status.replace("_", " ")}
                    </span>
                  </div>
                  <div className={`p-8 rounded-3xl border ${
                    theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'
                  }`}>
                    <h4 className={`text-xl font-bold uppercase tracking-tight mb-6 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{previewProject.title}</h4>
                    <div className={`text-sm font-sans leading-relaxed prose prose-sm max-w-none ${
                      theme === 'light' ? 'text-slate-600 prose-slate' : 'text-white/40 prose-invert'
                    }`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {previewProject.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-2 gap-8">
                  <section className="space-y-4">
                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Category</h3>
                    <div className={`p-4 rounded-2xl border text-sm font-bold uppercase tracking-widest ${
                      theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-900' : 'bg-white/2 border-white/5 text-white'
                    }`}>
                      {previewProject.category}
                    </div>
                  </section>
                  <section className="space-y-4">
                    <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Budget</h3>
                    <div className={`p-4 rounded-2xl border text-sm font-bold uppercase tracking-widest ${
                      theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-900' : 'bg-white/2 border-white/5 text-white'
                    }`}>
                      {previewProject.budget}
                    </div>
                  </section>
                </div>

                <section className="space-y-4">
                  <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>User Information</h3>
                  <div className={`flex items-center space-x-4 p-6 border rounded-2xl ${
                    theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'
                  }`}>
                    <div className={`h-12 w-12 rounded-xl border flex items-center justify-center font-bold text-lg ${
                      theme === 'light' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    }`}>
                      {previewProject.user?.name.charAt(0)}
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{previewProject.user?.name}</div>
                      <div className={`text-[10px] uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>{previewProject.user?.email}</div>
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className={`text-[10px] font-bold uppercase tracking-[0.3em] ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Timeline</h3>
                  <div className={`p-4 rounded-2xl border text-sm font-bold uppercase tracking-widest ${
                    theme === 'light' ? 'bg-slate-50 border-slate-100 text-slate-900' : 'bg-white/2 border-white/5 text-white'
                  }`}>
                    {previewProject.timeline}
                  </div>
                </section>
              </div>

              <div className={`p-8 border-t flex space-x-4 ${
                theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'
              }`}>
                <button
                  onClick={() => {
                    setSelectedProject(previewProject);
                    setPreviewProject(null);
                  }}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600' : 'bg-white text-black hover:bg-indigo-500 hover:text-white'
                  }`}
                >
                  Manage Project
                </button>
                <button
                  onClick={() => setPreviewProject(null)}
                  className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${
                    theme === 'light' ? 'bg-white border-slate-200 text-slate-900 hover:bg-slate-100' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
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
