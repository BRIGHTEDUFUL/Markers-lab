import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback, memo } from "react";
import { fetchMyProjects, deleteMyProject } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { 
  FileText, Clock, ChevronRight, Loader2, Plus, XCircle, 
  Download, AlertCircle, ExternalLink, Calendar, BarChart3, 
  Filter, ChevronDown, Search, LayoutGrid, List
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format } from "date-fns";
import { useTheme } from "../contexts/ThemeContext";
import PageHero from "../components/PageHero";
import LazyMarkdown from "../components/LazyMarkdown";
import { toast } from "sonner";
import { Project } from "../types";
import SkeletonCard from "../components/SkeletonCard";
import { useSmartNavigate } from "../hooks/useSmartNavigate";
import { useOverlayBackHandler } from "../hooks/useOverlayBackHandler";
import { resolveProjectShowcaseImage } from "../lib/gallery-showcase";
import { SHOWCASE_CARD_DURATION, SHOWCASE_CARD_STAGGER, SHOWCASE_EASE } from "../lib/showcase-motion";

const DashboardStatusChart = lazy(() => import("../components/charts/DashboardStatusChart"));

const stripMarkdown = (text: string) => {
  return text
    .replace(/[#*`_~]/g, '') // Basic markdown chars
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/\n/g, ' ') // Newlines
    .trim();
};

const TiltCard: React.FC<{ children: React.ReactNode; className: string; onClick: () => void }> = memo(({ children, className, onClick }) => {
  return (
    <div className={className} onClick={onClick}>
      {children}
    </div>
  );
});

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  IN_REVIEW: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  IN_PROGRESS: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  APPROVED: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border-red-500/20",
};

const STATUS_DOTS: Record<string, string> = {
  PENDING: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.5)]",
  IN_REVIEW: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]",
  IN_PROGRESS: "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]",
  COMPLETED: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]",
  APPROVED: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
  REJECTED: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]",
};

const CARD_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/[0.03] border-yellow-500/10 hover:border-yellow-500/40 hover:bg-yellow-500/[0.06]",
  IN_REVIEW: "bg-blue-500/[0.03] border-blue-500/10 hover:border-blue-500/40 hover:bg-blue-500/[0.06]",
  IN_PROGRESS: "bg-indigo-500/[0.03] border-indigo-500/10 hover:border-indigo-500/40 hover:bg-indigo-500/[0.06]",
  COMPLETED: "bg-green-500/[0.03] border-green-500/10 hover:border-green-500/40 hover:bg-green-500/[0.06]",
  APPROVED: "bg-emerald-500/[0.03] border-emerald-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]",
  REJECTED: "bg-red-500/[0.03] border-red-500/10 hover:border-red-500/40 hover:bg-red-500/[0.06]",
};

const CATEGORIES = [
  "Website",
  "E-commerce",
  "Portfolio",
  "Web Application", 
  "Mobile App", 
  "Desktop Software", 
  "AI / Machine Learning", 
  "Blockchain / Web3", 
  "Cloud Infrastructure", 
  "Cybersecurity", 
  "Other"
];

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const smartNavigate = useSmartNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const { closeWithBack: closeConfirmModal } = useOverlayBackHandler(
    confirmModal.isOpen,
    () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
    "dashboard-confirm-modal"
  );

  const filteredProjects = useMemo(() => projects.filter(p => {
    const statusMatch = statusFilter === "ALL" || p.status === statusFilter;
    const categoryMatch = categoryFilter === "ALL" || p.category === categoryFilter;
    return statusMatch && categoryMatch;
  }), [projects, statusFilter, categoryFilter]);

  const chartData = useMemo(() =>
    Object.keys(STATUS_COLORS).map(status => ({
      name: status.replace("_", " "),
      value: projects.filter(p => p.status === status).length,
      status,
    })).filter(d => d.value > 0),
  [projects]);

  const fetchProjects = useCallback(async () => {
    try {
      if (!user?.id) {
        setProjects([]);
        return;
      }
      const data = await fetchMyProjects(user.id);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProjects();
  }, [user?.id]);

  const handleDelete = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: "DELETE PROJECT?",
      message: "Are you sure you want to delete this project? This action cannot be undone.",
      onConfirm: async () => {
        try {
          if (user?.id) await deleteMyProject(id, user.id);
          await fetchProjects();
          toast.success("Project removed");
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Could not delete project";
          toast.error(msg);
        } finally {
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  if (loading) return (
    <div className="page-shell">
      <div className="max-w-7xl mx-auto px-4 pt-32 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonCard variant="project" count={6} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="page-shell">
      <PageHero 
        category="Terminal / Project Management"
        title={`My <br /><span class='text-transparent' style='-webkit-text-stroke: 1px ${theme === 'light' ? '#0f172a' : 'rgba(255,255,255,0.3)'}'>Projects</span>`}
        subtitle="Track your creative requests, monitor development progress, and manage your digital assets in real-time."
        details="View all active projects, track submission status, review approved assets, and communicate directly with the Maker's Lab team on your engagements."
      />

      <div className="max-w-7xl mx-auto relative z-10 py-10 sm:py-20 px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
          <div className="space-y-2">
            <h2 className={`font-display text-3xl sm:text-4xl uppercase tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Active Sessions</h2>
            <div className="h-1 w-12 bg-indigo-500" />
          </div>
          <button
            onClick={() => smartNavigate("/submit-project", { asSectionSwitch: true })}
            className={`group relative px-8 sm:px-10 py-4 sm:py-5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] transition-all duration-500 overflow-hidden rounded-full shadow-lg ${theme === 'light' ? 'bg-slate-900 text-white hover:bg-indigo-600 shadow-slate-200' : 'bg-white text-black hover:bg-indigo-500 hover:text-white shadow-[0_0_40px_rgba(255,255,255,0.1)]'}`}
          >
            <span className="relative z-10 flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
              New Request
            </span>
          </button>
        </div>

        {/* Overview Stats & Chart */}
        {projects.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className={`lg:col-span-1 backdrop-blur-3xl border p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] flex flex-col justify-center transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/40' : 'bg-white/5 border-white/10'}`}>
              <h3 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-10 flex items-center transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-3 text-indigo-400" />
                Status Overview
              </h3>
              <div className="space-y-3 sm:space-y-4">
                {Object.keys(STATUS_COLORS).map(status => {
                  const count = projects.filter(p => p.status === status).length;
                  if (count === 0) return null;
                  return (
                    <div key={status} className={`flex items-center justify-between p-4 sm:p-5 border rounded-xl sm:rounded-2xl transition-all duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'}`}>
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${STATUS_DOTS[status]}`} />
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>{status.replace("_", " ")}</span>
                      </div>
                      <span className={`text-xl sm:text-2xl font-display transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`lg:col-span-2 backdrop-blur-3xl border p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/40' : 'bg-white/5 border-white/10'}`}>
              <div className="h-[250px] sm:h-[350px] w-full">
                <Suspense
                  fallback={
                    <div className={`h-full w-full rounded-2xl border ${theme === "light" ? "border-slate-200 bg-slate-50" : "border-white/10 bg-white/5"}`} />
                  }
                >
                  <DashboardStatusChart chartData={chartData} theme={theme} />
                </Suspense>
              </div>
            </div>
          </div>
        )}

        {/* Filters & View Toggle */}
        <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 pb-6 sm:pb-10 border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-200' : 'border-white/5'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`flex items-center space-x-3 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em]">Status</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all border ${
                    statusFilter === "ALL"
                      ? theme === 'light' ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-200" : "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                      : theme === 'light' ? "bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-700" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                  }`}
                >
                  All
                </button>
                {Object.keys(STATUS_COLORS).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all border ${
                      statusFilter === status
                        ? "bg-indigo-500 text-white border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                        : theme === 'light' ? "bg-white text-slate-500 border-slate-300 hover:border-slate-400 hover:text-slate-700" : "bg-white/5 text-white/40 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 dark:bg-white/10 hidden lg:block" />

            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className={`flex items-center space-x-3 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em]">Category</span>
              </div>
              <div className="relative min-w-full sm:min-w-[200px]">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`w-full appearance-none border text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-5 sm:px-6 py-2.5 sm:py-3 rounded-full pr-10 sm:pr-12 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer ${theme === 'light' ? 'bg-white border-slate-200 text-slate-900 hover:border-slate-300' : 'bg-white/5 border-white/10 text-white hover:border-white/20'}`}
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className={`absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 pointer-events-none transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
              </div>
            </div>
          </div>

          <div className={`flex items-center p-1 rounded-full border transition-colors duration-500 w-fit ${theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-white/5 border-white/10'}`}>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 sm:p-2.5 rounded-full transition-all ${viewMode === 'grid' ? (theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white') : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/40')}`}
            >
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 sm:p-2.5 rounded-full transition-all ${viewMode === 'list' ? (theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'bg-white/10 text-white') : (theme === 'light' ? 'text-slate-400 hover:text-slate-600' : 'text-white/20 hover:text-white/40')}`}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {projects.length === 0 ? (
            <div className={`backdrop-blur-3xl border rounded-[3rem] p-24 text-center space-y-8 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/40' : 'bg-white/5 border-white/10'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <FileText className={`h-8 w-8 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
              </div>
              <div className="space-y-4">
                <h3 className={`font-display text-4xl uppercase tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No projects found</h3>
                <p className={`font-heading text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                  Initiate your first creative partnership
                </p>
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className={`backdrop-blur-3xl border rounded-[3rem] p-24 text-center space-y-8 transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/40' : 'bg-white/5 border-white/10'}`}>
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                <Search className={`h-8 w-8 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/20'}`} />
              </div>
              <div className="space-y-4">
                <h3 className={`font-display text-4xl uppercase tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>No matches found</h3>
                <p className={`font-heading text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                  Try adjusting your filters to find what you're looking for
                </p>
                <button 
                  onClick={() => { setStatusFilter("ALL"); setCategoryFilter("ALL"); }}
                  className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:text-indigo-600 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredProjects.map((project, i) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: SHOWCASE_CARD_DURATION, delay: i * SHOWCASE_CARD_STAGGER, ease: SHOWCASE_EASE }}
                >
                <TiltCard
                  className={`showcase-interactive relative rounded-2xl sm:rounded-[2.5rem] border overflow-hidden transition-all duration-700 hover:-translate-y-1 cursor-pointer group backdrop-blur-3xl ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/40 hover:border-indigo-500/50' : CARD_STATUS_COLORS[project.status] || "bg-white/5 border-white/10"}`}
                  onClick={() => setSelectedProject(project)}
                >
                  {/* Status Accent Bar */}
                  <div className={`absolute top-0 left-0 w-full h-1 sm:h-1.5 ${STATUS_DOTS[project.status].split(' ')[0]}`} />
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={resolveProjectShowcaseImage(project)}
                      alt={project.title}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/90">
                        {project.category.replace("_", " ")}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">
                        {project.timeline}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 sm:p-10">
                    <div className="flex justify-between items-start mb-6 sm:mb-8">
                      <span className={`inline-flex items-center px-3 sm:px-4 py-1 sm:py-1.5 text-[8px] sm:text-[9px] font-black border rounded-full uppercase tracking-[0.15em] sm:tracking-[0.2em] ${STATUS_COLORS[project.status]}`}>
                        <span className={`h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full mr-2 ${STATUS_DOTS[project.status]}`} />
                        {project.status.replace("_", " ")}
                      </span>
                    </div>
                    
                    <h3 className={`font-display text-2xl sm:text-3xl group-hover:text-indigo-500 transition-colors leading-tight mb-3 sm:mb-4 uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                      {project.title}
                    </h3>
                    
                    {/* Tags Chips */}
                    {project.tags && project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                        {project.tags.map((tag: string) => (
                          <button
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[7px] sm:text-[8px] font-black uppercase tracking-widest transition-all duration-300 ${
                              theme === 'light' 
                                ? 'bg-slate-100 text-slate-600 hover:bg-indigo-100 hover:text-indigo-600' 
                                : 'bg-white/5 text-white/40 hover:bg-indigo-500/20 hover:text-indigo-400'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    <div className={`inline-flex items-center text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-6 sm:mb-8 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-colors duration-500 ${theme === 'light' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'}`}>
                      <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-2" />
                      {format(new Date(project.createdAt), "MMM d, yyyy")}
                    </div>
    
                    <p className={`text-[10px] sm:text-xs font-medium line-clamp-2 mb-8 sm:mb-10 leading-relaxed font-sans transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                      {stripMarkdown(project.description)}
                    </p>
    
                    <div className={`pt-6 sm:pt-8 flex items-center justify-between border-t transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                      <span className={`text-[8px] sm:text-[9px] font-black px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-[0.15em] sm:tracking-[0.2em] border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-white/5 text-white/45 border-white/5'}`}>
                        {project.budget || "GH₵ TBD"}
                      </span>
                      <div className="flex items-center text-indigo-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        Details <ChevronRight className="h-2.5 w-2.5 sm:h-3 sm:w-3 ml-1" />
                      </div>
                    </div>
                  </div>
                </TiltCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className={`backdrop-blur-3xl border rounded-[2.5rem] overflow-hidden transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-indigo-100/40' : 'bg-white/5 border-white/10'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                      <th className={`px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Project</th>
                      <th className={`px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Category</th>
                      <th className={`px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Status</th>
                      <th className={`px-10 py-6 text-[10px] font-bold uppercase tracking-[0.3em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Date</th>
                      <th className="px-10 py-6"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr 
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={`group cursor-pointer border-b last:border-0 transition-all duration-500 ${theme === 'light' ? 'hover:bg-slate-50 border-slate-100 hover:-translate-y-[1px]' : 'hover:bg-white/[0.02] border-white/5 hover:-translate-y-[1px]'}`}
                      >
                        <td className="px-10 py-8">
                          <div className="flex items-center gap-4">
                            <img
                              src={resolveProjectShowcaseImage(project)}
                              alt={project.title}
                              loading="lazy"
                              decoding="async"
                              className="h-14 w-20 rounded-xl object-cover border border-white/10"
                              referrerPolicy="no-referrer"
                            />
                            <div className="space-y-1 min-w-0">
                              <div className={`text-sm font-bold uppercase tracking-tight transition-colors duration-500 truncate ${theme === 'light' ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-400'}`}>
                                {project.title}
                              </div>
                            {/* Tags Chips */}
                            {project.tags && project.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {project.tags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                      theme === 'light' 
                                        ? 'bg-slate-100 text-slate-500' 
                                        : 'bg-white/5 text-white/30'
                                    }`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className={`text-[10px] font-medium transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                              {stripMarkdown(project.description).substring(0, 60)}...
                            </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 text-slate-400 border-slate-100' : 'bg-white/5 text-white/20 border-white/5'}`}>
                            {project.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <span className={`inline-flex items-center px-4 py-1.5 text-[9px] font-black border rounded-full uppercase tracking-[0.2em] ${STATUS_COLORS[project.status]}`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-2 ${STATUS_DOTS[project.status]}`} />
                            {project.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="px-10 py-8">
                          <div className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                            {format(new Date(project.createdAt), "MMM d, yyyy")}
                          </div>
                        </td>
                        <td className="px-10 py-8 text-right">
                          <div className="flex items-center justify-end text-indigo-400 text-[9px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                            View <ChevronRight className="h-3 w-3 ml-1" />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`border rounded-2xl sm:rounded-[3rem] w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl transition-colors duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-900/20' : 'bg-[#0a0a0a] border-white/10 shadow-black'}`}
            >
              <div className={`p-6 sm:p-10 border-b flex justify-between items-center sticky top-0 backdrop-blur-xl z-10 transition-colors duration-500 ${theme === 'light' ? 'bg-white/80 border-slate-100' : 'bg-[#0a0a0a]/80 border-white/5'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:space-x-6">
                  <h2 className={`font-display text-2xl sm:text-4xl uppercase tracking-tighter transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedProject.title}</h2>
                  <span className={`px-3 py-1 text-[8px] sm:text-[9px] font-black border rounded-full uppercase tracking-[0.15em] sm:tracking-[0.2em] w-fit ${STATUS_COLORS[selectedProject.status]}`}>
                    {selectedProject.status.replace("_", " ")}
                  </span>
                </div>
                <button 
                  onClick={() => setSelectedProject(null)} 
                  className={`p-2 sm:p-3 transition-colors rounded-full ${theme === 'light' ? 'hover:bg-slate-100 text-slate-300 hover:text-slate-900' : 'hover:bg-white/10 text-white/20 hover:text-white'}`}
                >
                  <XCircle className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
              </div>
              
              <div className="p-6 sm:p-12 space-y-10 sm:space-y-16">
                <section>
                  <h3 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-4 sm:mb-6 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Project Brief</h3>
                  <div className={`p-6 sm:p-8 rounded-2xl sm:rounded-3xl border transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'}`}>
                    <div className={`text-xs sm:text-sm leading-relaxed prose prose-sm max-w-none font-sans transition-colors duration-500 ${theme === 'light' ? 'text-slate-600 prose-slate' : 'text-white/60 prose-invert'}`}>
                      <LazyMarkdown>{selectedProject.description}</LazyMarkdown>
                    </div>
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
                  <section>
                    <h3 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-8 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Technical Specs</h3>
                    <div className="space-y-1 sm:space-y-2">
                      <div className={`flex justify-between py-3 sm:py-4 border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Category</span>
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedProject.category.replace("_", " ")}</span>
                      </div>
                      <div className={`flex justify-between py-3 sm:py-4 border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Budget Range</span>
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedProject.budget || "TBD"}</span>
                      </div>
                      <div className={`flex justify-between py-3 sm:py-4 border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Target Timeline</span>
                        <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedProject.timeline || "TBD"}</span>
                      </div>
                      {selectedProject.repoUrl && (
                        <div className={`flex justify-between py-3 sm:py-4 border-b transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Source Control</span>
                          <a href={selectedProject.repoUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest flex items-center hover:text-indigo-600 transition-colors">
                            Repository <ExternalLink className="h-3 w-3 ml-2" />
                          </a>
                        </div>
                      )}
                    </div>
                  </section>

                  <section>
                    <h3 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-8 transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Assets & Documents</h3>
                    {selectedProject.files.length === 0 ? (
                      <div className={`p-6 sm:p-8 border rounded-2xl sm:rounded-3xl text-center transition-colors duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-white/2 border-white/5'}`}>
                        <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest italic transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/10'}`}>No files provided</p>
                      </div>
                    ) : (
                      <div className="space-y-2 sm:space-y-3">
                        {selectedProject.files.map((file: any) => (
                          <a
                            key={file.id}
                            href={file.path}
                            className={`flex items-center justify-between p-4 sm:p-5 border rounded-xl sm:rounded-2xl transition-all group ${theme === 'light' ? 'bg-slate-50 border-slate-100 hover:border-slate-300 hover:bg-slate-100' : 'bg-white/2 border-white/5 hover:border-white/20 hover:bg-white/5'}`}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4 overflow-hidden">
                              <FileText className={`h-4 w-4 sm:h-5 sm:w-5 transition-colors ${theme === 'light' ? 'text-slate-300 group-hover:text-slate-900' : 'text-white/20 group-hover:text-white'}`} />
                              <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest truncate transition-colors ${theme === 'light' ? 'text-slate-500 group-hover:text-slate-900' : 'text-white/40 group-hover:text-white'}`}>{file.originalName}</span>
                            </div>
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white/20 group-hover:text-indigo-400 transition-colors" />
                          </a>
                        ))}
                      </div>
                    )}
                  </section>
                </div>

                {selectedProject.adminNotes.length > 0 && (
                  <section className={`p-6 sm:p-10 rounded-2xl sm:rounded-[2.5rem] border transition-colors duration-500 ${theme === 'light' ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-500/5 border-indigo-500/10'}`}>
                    <h3 className="text-[9px] sm:text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] sm:tracking-[0.3em] mb-6 sm:mb-8 flex items-center">
                      <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-3" /> Project Feedback
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      {selectedProject.adminNotes.map((note: any) => (
                        <div key={note.id} className={`text-[10px] sm:text-xs p-5 sm:p-6 border rounded-xl sm:rounded-2xl font-sans leading-relaxed transition-colors duration-500 ${theme === 'light' ? 'text-slate-600 bg-white border-slate-100' : 'text-white/60 bg-white/2 border-white/5'}`}>
                          {note.note}
                          <div className={`text-[8px] sm:text-[9px] font-black mt-3 sm:mt-4 uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-indigo-300' : 'text-indigo-500/30'}`}>
                            {format(new Date(note.createdAt), "MMM d, yyyy • HH:mm")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {selectedProject.status === "PENDING" && (
                  <div className={`flex justify-end pt-8 sm:pt-12 border-t transition-colors duration-500 ${theme === 'light' ? 'border-slate-100' : 'border-white/5'}`}>
                    <button
                      onClick={() => { handleDelete(selectedProject.id); setSelectedProject(null); }}
                      className="px-8 sm:px-10 py-4 sm:py-5 border border-red-500/20 text-red-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] hover:bg-red-500 hover:text-white transition-all rounded-full"
                    >
                      Terminate Request
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
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
                    onClick={closeConfirmModal}
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
    </div>
  );
};

