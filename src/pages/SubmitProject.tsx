import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProjectWithFiles } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { 
  Rocket, Upload, X, Plus, Info, DollarSign, Calendar, 
  Link as LinkIcon, Loader2, CheckCircle, Globe, 
  Smartphone, Monitor, Cpu, Database, Cloud, Shield,
  ChevronDown, Search, ShoppingCart, User, Layout,
  FileText, Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import PageHero from "../components/PageHero";
import LazyMarkdown from "../components/LazyMarkdown";
import { useTheme } from "../contexts/ThemeContext";
import { useAdaptiveMotion } from "../hooks/useAdaptiveMotion";
import { Category, Timeline, BudgetRange, PricingTier } from "../types";
import { PRICING_PACKAGES } from "../config/pricing";

const CATEGORIES = [
  { id: "Website", icon: Globe, description: "Business, Landing Pages, Blogs" },
  { id: "E-commerce", icon: ShoppingCart, description: "Online Stores, Payment Gateways" },
  { id: "Portfolio", icon: User, description: "Personal, Creative, Showcases" },
  { id: "Web Application", icon: Layout, description: "SaaS, Portals, Dashboards" },
  { id: "Mobile App", icon: Smartphone, description: "iOS, Android, Cross-platform" },
  { id: "Desktop Software", icon: Monitor, description: "Windows, macOS, Linux" },
  { id: "AI / Machine Learning", icon: Cpu, description: "LLMs, Computer Vision, Data" },
  { id: "Blockchain / Web3", icon: Database, description: "DApps, Smart Contracts, DeFi" },
  { id: "Cloud Infrastructure", icon: Cloud, description: "DevOps, Serverless, Scaling" },
  { id: "Cybersecurity", icon: Shield, description: "Audits, Pentesting, Hardening" },
  { id: "Other", icon: Plus, description: "Custom technical solutions" }
];

const BUDGET_RANGES: BudgetRange[] = [
  "GH₵ 300 - GH₵ 1,000",
  "GH₵ 1,000 - GH₵ 5,000",
  "GH₵ 5,000 - GH₵ 10,000",
  "GH₵ 10,000 - GH₵ 25,000",
  "GH₵ 25,000+",
];

const TIMELINES = [
  "Less than 1 month",
  "1-3 months",
  "3-6 months",
  "6+ months",
  "Flexible"
];

const PACKAGE_TO_BUDGET: Record<PricingTier, BudgetRange> = {
  Standard: "GH₵ 300 - GH₵ 1,000",
  Premium: "GH₵ 1,000 - GH₵ 5,000",
  Executive: "GH₵ 5,000 - GH₵ 10,000",
};

const PACKAGE_TO_TIMELINE: Record<PricingTier, Timeline> = {
  Standard: "Less than 1 month",
  Premium: "1-3 months",
  Executive: "3-6 months",
};

export const SubmitProject: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { shouldReduceMotion } = useAdaptiveMotion();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(CATEGORIES[0].id as Category);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [budget, setBudget] = useState<BudgetRange>(BUDGET_RANGES[0]);
  const [timeline, setTimeline] = useState<Timeline>(TIMELINES[0] as Timeline);
  const [selectedPackage, setSelectedPackage] = useState<PricingTier>("Standard");
  const [repoUrl, setRepoUrl] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileProgress, setFileProgress] = useState<{ [key: number]: number }>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false);
  const [showAllFiles, setShowAllFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const deferredDescription = useDeferredValue(description);
  const totalFilesSizeMB = useMemo(
    () => (files.reduce((acc, f) => acc + f.size, 0) / 1024 / 1024).toFixed(2),
    [files]
  );
  const visibleFiles = useMemo(
    () => (showAllFiles ? files : files.slice(0, 20)),
    [files, showAllFiles]
  );
  const previewImageFile = useMemo(
    () => files.find((file) => file.type.startsWith("image/")) || null,
    [files]
  );
  const previewImageUrl = useMemo(
    () => (previewImageFile ? URL.createObjectURL(previewImageFile) : ""),
    [previewImageFile]
  );

  useEffect(() => {
    if (files.length <= 20) setShowAllFiles(false);
  }, [files.length]);

  useEffect(() => {
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds 50MB limit`);
          return false;
        }
        return true;
      });
      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        toast.success(`Added ${newFiles.length} file(s)`);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`File ${file.name} exceeds 50MB limit`);
          return false;
        }
        return true;
      });
      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        toast.success(`Dropped ${newFiles.length} file(s)`);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a project title.");
      return;
    }
    if (!description.trim()) {
      toast.error("Please add a project description.");
      return;
    }
    setLoading(true);
    setError("");
    setFileProgress({});
    setUploadProgress(0);

    try {
      if (!user?.id) {
        throw new Error("You must be signed in");
      }
      for (let i = 0; i < files.length; i++) {
        setFileProgress((prev) => ({ ...prev, [i]: 40 }));
      }
      setUploadProgress(20);

      await createProjectWithFiles(
        user.id,
        {
          title,
          description,
          category,
          tags: JSON.stringify(tags),
          budget,
          timeline,
          packageTier: selectedPackage,
          repoUrl: repoUrl || undefined,
        },
        files
      );

      for (let i = 0; i < files.length; i++) {
        setFileProgress((prev) => ({ ...prev, [i]: 100 }));
      }
      setUploadProgress(100);

      setSuccess(true);
      toast.success("Project submitted successfully!");
      setTimeout(() => navigate("/dashboard", { replace: true }), 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err !== null && "message" in err && typeof (err as { message: string }).message === "string"
            ? (err as { message: string }).message
            : "Failed to submit project";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    const totalFileProgress = files.length > 0 
      ? Math.round((Object.values(fileProgress).reduce((a, b) => a + b, 0) / (files.length * 100)) * 100)
      : 0;

    return (
      <div className="page-shell-flex">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-12 max-w-md w-full px-6"
        >
          <div className="relative flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="w-32 h-32 sm:w-48 sm:h-48 rounded-full border-t-2 border-indigo-500/30 border-r-2 border-indigo-500"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ 
                  y: [0, -10, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Rocket className="h-10 w-10 sm:h-16 sm:w-16 text-indigo-500" />
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className={`text-2xl sm:text-4xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
              Transmitting Vision
            </h2>
            <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.4em] ${theme === 'light' ? 'text-slate-400' : 'text-white/40'}`}>
              Architecting your digital masterpiece...
            </p>
          </div>

          {files.length > 0 && (
            <div className="space-y-4">
              <div className={`h-1.5 w-full rounded-full overflow-hidden ${theme === 'light' ? 'bg-slate-200' : 'bg-white/5'}`}>
                <motion.div 
                  className="h-full bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalFileProgress}%` }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                />
              </div>
              <div className="flex justify-between items-center">
                <p className={`text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                  Asset Synchronization
                </p>
                <p className={`text-[9px] font-black uppercase tracking-widest text-indigo-500`}>
                  {totalFileProgress}%
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-1.5 h-1.5 rounded-full bg-indigo-500"
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="page-shell-short">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`text-center space-y-6 max-w-md p-12 backdrop-blur-3xl rounded-[2.5rem] border shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-white/5 border-white/10'
          }`}
        >
          <div className={`inline-flex items-center justify-center p-6 rounded-full border ${
            theme === 'light' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-green-500/10 text-green-400 border-green-500/20'
          }`}>
            <CheckCircle className="h-16 w-16" />
          </div>
          <h2 className={`text-4xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Project Initiated</h2>
          <p className={`font-sans ${theme === 'light' ? 'text-slate-500' : 'text-white/60'}`}>Your proposal has been successfully transmitted to our creative terminal. Redirecting to dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-shell duration-500">
      <PageHero 
        category="Project Submission Terminal"
        title={`Launch Your <br /><span class='text-transparent' style='-webkit-text-stroke: 1px ${theme === "light" ? "#0f172a" : "rgba(255,255,255,0.35)"}'>Vision</span>`}
        subtitle="Provide the technical specifications for your next digital masterpiece. Our team will analyze your requirements and architect a bespoke solution."
        details="Share your project goals, estimated budget (GH₵), timeline, and scope. Include as much detail as possible about your vision, and we'll respond with a comprehensive technical proposal within 48 hours."
      />

      <div className="max-w-7xl mx-auto relative z-10 py-6 sm:py-20 px-4 sm:px-6 lg:px-8">
        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-12 sm:mb-20 max-w-3xl mx-auto relative">
          <div className={`absolute top-1/2 left-0 right-0 h-px -translate-y-1/2 z-0 transition-colors duration-500 ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
          {[
            { step: 1, label: "Core Specs", active: !showReview },
            { step: 2, label: "Review & Launch", active: showReview }
          ].map((s, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-4">
              <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full border-2 flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-500 ${
                s.active 
                  ? "bg-indigo-500 border-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]" 
                  : theme === 'light' ? "bg-white border-slate-200 text-slate-400" : "bg-[#050505] border-white/10 text-white/20"
              }`}>
                {s.step}
              </div>
              <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] transition-colors duration-500 ${s.active ? 'text-indigo-500' : theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!showReview ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12"
            >
              {/* Left Column: Core Specs */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-10">
                <div className={`backdrop-blur-3xl border p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-lg shadow-slate-200/50' : 'bg-white/5 border-white/10'}`}>
                  <h2 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-6 sm:mb-10 flex items-center transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                    <div className="h-px w-6 sm:w-8 bg-indigo-500 mr-3 sm:mr-4" />
                    Core Specifications
                  </h2>
                  
                  <div className="space-y-5 sm:space-y-8">
                    {/* Title */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ml-3 sm:ml-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Project Title</label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Quantum Commerce Platform"
                        className={`w-full px-5 sm:px-8 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500' : 'bg-white/5 border-white/10 text-white placeholder:text-white/10'}`}
                      />
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-2 sm:space-y-3 relative">
                      <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ml-3 sm:ml-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Category</label>
                      <button
                        type="button"
                        onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                        className={`w-full px-5 sm:px-8 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-medium flex items-center justify-between transition-all duration-300 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500' : 'bg-white/5 border-white/10 text-white'}`}
                      >
                        <span className={category ? "" : theme === 'light' ? "text-slate-300" : "text-white/10"}>
                          {category || "Select Project Category"}
                        </span>
                        <ChevronDown className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition-transform duration-500 ${isCategoryOpen ? "rotate-180" : ""} ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`} />
                      </button>

                      <AnimatePresence>
                        {isCategoryOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute z-50 left-0 right-0 mt-2 sm:mt-3 border rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl transition-colors duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-slate-200' : 'bg-[#0a0a0a] border-white/10 shadow-black'}`}
                          >
                            <div className="max-h-48 sm:max-h-64 overflow-y-auto p-1.5 sm:p-2">
                              {CATEGORIES.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setCategory(cat.id as Category);
                                    setIsCategoryOpen(false);
                                  }}
                                  className={`w-full text-left px-4 sm:px-6 py-3 sm:py-4 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    category === cat.id 
                                      ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                                      : theme === 'light' ? "text-slate-600 hover:bg-slate-50" : "text-white/60 hover:bg-white/5"
                                  }`}
                                >
                                  {cat.id}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Description */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex justify-between items-center ml-3 sm:ml-4">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Detailed Brief</label>
                        <button
                          type="button"
                          onClick={() => setShowDescriptionPreview(!showDescriptionPreview)}
                          className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-400 hover:text-indigo-300'}`}
                        >
                          {showDescriptionPreview ? "Edit Mode" : "Preview Markdown"}
                        </button>
                      </div>
                      
                      <div className="relative">
                        {!showDescriptionPreview ? (
                          <textarea
                            required
                            rows={8}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your vision, technical requirements, and goals..."
                            className={`w-full px-5 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-3xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 resize-none ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500' : 'bg-white/5 border-white/10 text-white placeholder:text-white/10'}`}
                          />
                        ) : (
                          <div className={`w-full px-5 sm:px-8 py-4 sm:py-6 rounded-2xl sm:rounded-3xl border min-h-[200px] sm:min-h-[260px] prose prose-sm max-w-none transition-all duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200 prose-slate' : 'bg-white/2 border-white/10 prose-invert'}`}>
                            <LazyMarkdown>{deferredDescription || "*No description provided yet.*"}</LazyMarkdown>
                          </div>
                        )}
                      </div>
                      <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest ml-3 sm:ml-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/10'}`}>Supports GitHub Flavored Markdown</p>
                    </div>

                    {/* Tags */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ml-3 sm:ml-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Technology Tags</label>
                      <div className={`flex flex-wrap gap-2 sm:gap-3 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border transition-all duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                        {tags.map((tag) => (
                          <motion.span
                            layout
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            key={tag}
                            className={`inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-white text-slate-900 border border-slate-200 shadow-sm' : 'bg-white/10 text-white border border-white/10'}`}
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-1.5 sm:ml-2 hover:text-red-500 transition-colors"
                            >
                              <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            </button>
                          </motion.span>
                        ))}
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleAddTag}
                          placeholder={tags.length === 0 ? "Add tags" : "Add more..."}
                          className={`flex-1 min-w-[100px] sm:min-w-[150px] bg-transparent border-none focus:ring-0 text-xs sm:text-sm font-medium transition-colors duration-500 ${theme === 'light' ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-white/10'}`}
                        />
                      </div>
                    </div>

                    {/* Repo URL */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ml-3 sm:ml-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Repository URL (Optional)</label>
                      <div className="relative">
                        <LinkIcon className={`absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-300' : 'text-white/10'}`} />
                        <input
                          type="url"
                          value={repoUrl}
                          onChange={(e) => setRepoUrl(e.target.value)}
                          placeholder="https://github.com/your-username/project"
                          className={`w-full pl-11 sm:pl-16 pr-5 sm:pr-8 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all duration-300 ${theme === 'light' ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500' : 'bg-white/5 border-white/10 text-white placeholder:text-white/10'}`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Logistics & Assets */}
              <div className="lg:col-span-5 space-y-6 lg:space-y-12">
                {/* Live Preview Card */}
                <div className={`backdrop-blur-3xl border p-5 sm:p-8 rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 overflow-hidden group ${theme === 'light' ? (shouldReduceMotion ? 'bg-white border-slate-200 shadow-sm shadow-slate-200/30' : 'bg-white border-slate-200 shadow-xl') : 'bg-white/5 border-white/10'}`}>
                  <h2 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-6 sm:mb-8 flex items-center transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                    <div className="h-px w-6 sm:w-8 bg-indigo-500 mr-3 sm:mr-4" />
                    Live Preview
                  </h2>
                  
                  <div className={`aspect-[16/10] relative overflow-hidden rounded-2xl sm:rounded-[2rem] border transition-all duration-500 ${theme === 'light' ? 'bg-slate-50 border-slate-100' : 'bg-black/40 border-white/5'}`}>
                    {previewImageFile && previewImageUrl ? (
                      <img 
                        src={previewImageUrl}
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-60"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Rocket className={`h-12 w-12 transition-colors duration-500 ${theme === 'light' ? 'text-slate-200' : 'text-white/5'}`} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 bg-indigo-500 text-white rounded-full text-[8px] font-bold uppercase tracking-widest">
                          {category}
                        </span>
                      </div>
                      <h3 className="text-white font-display text-2xl uppercase tracking-tight truncate">
                        {title || "Project Title"}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {tags.length > 0 ? tags.map(tag => (
                        <span key={tag} className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">#{tag}</span>
                      )) : (
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-300' : 'text-white/10'}`}>No tags added</span>
                      )}
                    </div>
                    <p className={`text-[10px] font-medium leading-relaxed line-clamp-2 transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                      {description || "Your project description will appear here..."}
                    </p>
                  </div>
                </div>

                <div className={`backdrop-blur-3xl border p-5 sm:p-10 rounded-2xl sm:rounded-[2.5rem] transition-all duration-500 ${theme === 'light' ? (shouldReduceMotion ? 'bg-white border-slate-200 shadow-sm shadow-slate-200/30' : 'bg-white border-slate-200 shadow-lg shadow-slate-200/50') : 'bg-white/5 border-white/10'}`}>
                  <h2 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-6 sm:mb-10 flex items-center transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                    <div className="h-px w-6 sm:w-8 bg-indigo-500 mr-3 sm:mr-4" />
                    Planning, Budget & Assets
                  </h2>

                  <div className="space-y-8 sm:space-y-10">
                    {/* Package Selection */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ml-3 sm:ml-4">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                          Preferred Package
                        </label>
                        <button
                          type="button"
                          onClick={() => navigate("/pricing")}
                          className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-indigo-600 hover:text-indigo-800' : 'text-indigo-400 hover:text-indigo-300'}`}
                        >
                          View Full Pricing
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {PRICING_PACKAGES.map((pkg) => (
                          <button
                            key={pkg.tier}
                            type="button"
                            onClick={() => {
                              setSelectedPackage(pkg.tier);
                              setBudget(PACKAGE_TO_BUDGET[pkg.tier]);
                              setTimeline(PACKAGE_TO_TIMELINE[pkg.tier]);
                            }}
                            className={`text-left px-4 sm:px-5 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl border transition-all duration-300 ${
                              selectedPackage === pkg.tier
                                ? shouldReduceMotion
                                  ? "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/15"
                                  : "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20"
                                : theme === 'light'
                                ? "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                                : "bg-white/5 border-white/10 text-white/70 hover:border-white/20"
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">{pkg.tier}</p>
                              <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em]">GH₵ {pkg.priceGhs.toLocaleString("en-GH")}</p>
                            </div>
                            <p className={`mt-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] ${selectedPackage === pkg.tier ? 'text-white/90' : theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>
                              {pkg.bestFor}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Estimated Budget (GH₵ default) */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 ml-3 sm:ml-4">
                        <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Estimated Budget</label>
                        <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${theme === 'light' ? 'bg-slate-100 border-slate-200 text-slate-600' : 'bg-white/5 border-white/10 text-white/60'}`}>
                          GH₵ Default
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {BUDGET_RANGES.map((range) => (
                          <button
                            key={range}
                            type="button"
                            onClick={() => setBudget(range)}
                            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                              budget === range 
                                ? shouldReduceMotion
                                  ? "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/15"
                                  : "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" 
                                : theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="space-y-4 sm:space-y-6">
                      <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ml-3 sm:ml-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Target Timeline</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {TIMELINES.map((time) => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setTimeline(time as Timeline)}
                            className={`px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${
                              timeline === time 
                                ? shouldReduceMotion
                                  ? "bg-indigo-500 text-white border-indigo-500 shadow-sm shadow-indigo-500/15"
                                  : "bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20" 
                                : theme === 'light' ? "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300" : "bg-white/5 border-white/10 text-white/60 hover:border-white/20"
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* File Upload */}
                    <div className="space-y-4 sm:space-y-6">
                      <label className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ml-3 sm:ml-4 transition-colors duration-500 ${theme === 'light' ? 'text-slate-500' : 'text-white/40'}`}>Supporting Assets</label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        className={`relative group cursor-pointer border-2 border-dashed rounded-2xl sm:rounded-[2.5rem] p-8 sm:p-12 text-center transition-all duration-500 ${
                          isDragging 
                            ? "border-indigo-500 bg-indigo-500/5 scale-[0.98]" 
                            : theme === 'light' ? "border-slate-200 bg-slate-50 hover:border-slate-300" : "border-white/10 bg-white/[0.02] hover:border-white/20"
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <input
                          type="file"
                          multiple
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="space-y-4 sm:space-y-6">
                          <div className={`w-14 h-14 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto border transition-all duration-500 ${isDragging ? "bg-indigo-500 border-indigo-500" : theme === 'light' ? "bg-white border-slate-200" : "bg-white/5 border-white/10"}`}>
                            <Upload className={`h-6 w-6 sm:h-8 sm:w-8 transition-colors duration-500 ${isDragging ? "text-white" : theme === 'light' ? "text-slate-300" : "text-white/20"}`} />
                          </div>
                          <div className="space-y-1.5 sm:space-y-2">
                            <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? "text-slate-900" : "text-white"}`}>Drop Assets Here</p>
                            <p className={`text-[8px] sm:text-[9px] font-bold uppercase tracking-widest transition-colors duration-500 ${theme === 'light' ? "text-slate-400" : "text-white/20"}`}>PDF, Images, or ZIP (Max 50MB)</p>
                          </div>
                        </div>
                      </div>

                      {/* File List */}
                      <AnimatePresence>
                        {files.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-4"
                          >
                            <div className="flex justify-between items-center px-4">
                              <div className="flex items-center gap-3">
                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                                  {files.length} {files.length === 1 ? 'Asset' : 'Assets'} Attached
                                </p>
                                <div className={`w-1 h-1 rounded-full ${theme === 'light' ? 'bg-slate-200' : 'bg-white/10'}`} />
                                <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                                  {totalFilesSizeMB} MB Total
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setFiles([]);
                                  setShowAllFiles(false);
                                }}
                                className={`text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${theme === 'light' ? 'text-red-500 hover:text-red-700' : 'text-red-400 hover:text-red-300'}`}
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="space-y-2">
                              {visibleFiles.map((file, idx) => (
                                <motion.div
                                  key={`${file.name}-${idx}`}
                                  initial={{ x: -20, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  exit={{ x: 20, opacity: 0 }}
                                  className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 group ${theme === 'light' ? 'bg-white border-slate-100 hover:border-slate-200 shadow-sm' : 'bg-white/[0.03] border-white/5 hover:border-white/10'}`}
                                >
                                  <div className="flex items-center space-x-4 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme === 'light' ? 'bg-slate-50 text-indigo-500' : 'bg-white/5 text-indigo-400'}`}>
                                      <FileText className="h-5 w-5" />
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className={`text-[10px] font-bold uppercase tracking-widest truncate transition-colors ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                                        {file.name}
                                      </p>
                                      <p className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500' : 'bg-white/5 text-white/20 hover:bg-red-500/10 hover:text-red-400'}`}
                                  >
                                    <span>Remove</span>
                                    <X className="h-3 w-3" />
                                  </button>
                                </motion.div>
                              ))}
                              {files.length > 20 && (
                                <button
                                  type="button"
                                  onClick={() => setShowAllFiles((prev) => !prev)}
                                  className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-colors ${theme === 'light' ? 'bg-slate-50 text-slate-600 hover:bg-slate-100' : 'bg-white/5 text-white/60 hover:bg-white/10'}`}
                                >
                                  {showAllFiles ? "Show Fewer Files" : `Show All ${files.length} Files`}
                                </button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="space-y-4 sm:space-y-6">
                  <button
                    type="button"
                    onClick={() => setShowReview(true)}
                    disabled={loading || !title || !category || !description}
                    className={`w-full py-6 sm:py-8 rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] transition-all duration-500 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed ${
                      theme === 'light' 
                        ? "bg-slate-900 text-white hover:bg-indigo-600 shadow-2xl shadow-slate-200" 
                        : "bg-white text-black hover:bg-indigo-500 hover:text-white shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      Review Proposal
                      <ChevronDown className="ml-3 sm:ml-4 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-y-1 transition-transform" />
                    </span>
                  </button>
                  <p className={`text-center text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                    By submitting, you agree to our creative partnership terms.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="review"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto"
            >
              <div className={`backdrop-blur-3xl border p-6 sm:p-12 rounded-2xl sm:rounded-[3rem] transition-all duration-500 ${theme === 'light' ? 'bg-white border-slate-200 shadow-2xl shadow-slate-200/50' : 'bg-white/5 border-white/10'}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-6 mb-8 sm:mb-12">
                  <div>
                    <h2 className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-3 sm:mb-4 flex items-center transition-colors duration-500 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>
                      <div className="h-px w-6 sm:w-8 bg-indigo-500 mr-3 sm:mr-4" />
                      Review Transmission
                    </h2>
                    <h3 className={`text-xl sm:text-4xl font-display uppercase tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{title}</h3>
                  </div>
                  <button
                    onClick={() => setShowReview(false)}
                    className={`p-2 sm:p-4 rounded-full border transition-all ${theme === 'light' ? 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-900' : 'bg-white/5 border-white/10 text-white/20 hover:text-white'}`}
                  >
                    <X className="h-4 w-4 sm:h-6 sm:w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 mb-8 sm:mb-12">
                  <div className="space-y-6 sm:space-y-8">
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Category</p>
                      <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{category}</p>
                    </div>
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Budget Allocation</p>
                      <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{budget}</p>
                    </div>
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Selected Package</p>
                      <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{selectedPackage}</p>
                    </div>
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Target Timeline</p>
                      <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{timeline}</p>
                    </div>
                  </div>
                  <div className="space-y-6 sm:space-y-8">
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Technology Stack</p>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {tags.map(tag => (
                          <span key={tag} className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase tracking-widest ${theme === 'light' ? 'bg-slate-100 text-slate-900' : 'bg-white/10 text-white'}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-1.5 sm:mb-2 ${theme === 'light' ? 'text-slate-400' : 'text-white/20'}`}>Attached Assets</p>
                      <p className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>{files.length} Files Ready</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-8">
                  <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className={`w-full py-6 sm:py-8 rounded-2xl sm:rounded-[2rem] text-xs sm:text-sm font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] transition-all duration-500 relative overflow-hidden group ${
                      theme === 'light'
                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-200"
                        : "bg-white text-black hover:bg-indigo-500 hover:text-white shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                    }`}
                  >
                    <span className="relative z-10 flex items-center justify-center">
                      {loading ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <>
                          Confirm & Transmit
                          <Rocket className="ml-3 sm:ml-4 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                        </>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => setShowReview(false)}
                    className={`w-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest transition-colors ${theme === 'light' ? 'text-slate-400 hover:text-slate-900' : 'text-white/20 hover:text-white'}`}
                  >
                    Back to Edit Mode
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
