import React, { useState, useEffect } from "react";
import {
  adminGetRecentLoginAttempts,
  adminGetAuditLogs,
} from "../lib/makers-data";
import { useTheme } from "../contexts/ThemeContext";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Shield,
  Clock,
  MapPin,
  User as UserIcon,
  Activity,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { LoginAttempt, AuditLog } from "../types";

interface BruteForceAlert {
  ip: string;
  count: number;
  severity: "low" | "medium" | "high" | "critical";
}

export const SecurityMonitoring: React.FC = () => {
  const { theme } = useTheme();
  const [loginAttempts, setLoginAttempts] = useState<LoginAttempt[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState<LoginAttempt | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filterAction, setFilterAction] = useState("ALL");
  const [filterEmail, setFilterEmail] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "audit" | "alerts">("login");

  const fetchSecurityData = async () => {
    try {
      const [attempts, logs] = await Promise.all([
        adminGetRecentLoginAttempts(100),
        adminGetAuditLogs({ limit: 100 }),
      ]);

      setLoginAttempts(attempts || []);
      setAuditLogs(logs || []);
    } catch (error) {
      console.error("Error fetching security data:", error);
      toast.error("Failed to load security data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSecurityData();
    toast.success("Security data refreshed");
  };

  const handleDownloadLogs = () => {
    const data = {
      loginAttempts,
      auditLogs,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-logs-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
    a.click();
    toast.success("Logs downloaded");
  };

  // Calculate brute force alerts
  const bruteForceAlerts: BruteForceAlert[] = (() => {
    const ipMap = new Map<string, number>();
    loginAttempts
      .filter((a) => !a.success && a.ip_address)
      .forEach((a) => {
        ipMap.set(a.ip_address, (ipMap.get(a.ip_address) || 0) + 1);
      });

    return Array.from(ipMap.entries())
      .map(([ip, count]) => {
        let severity: "low" | "medium" | "high" | "critical" = "low";
        if (count > 50) severity = "critical";
        else if (count > 20) severity = "high";
        else if (count > 10) severity = "medium";
        return { ip, count, severity };
      })
      .filter((a) => a.count >= 5)
      .sort((a, b) => b.count - a.count);
  })();

  // Filter login attempts
  const filteredAttempts = loginAttempts.filter((a) =>
    filterEmail ? a.email.toLowerCase().includes(filterEmail.toLowerCase()) : true
  );

  // Filter audit logs
  const filteredLogs = auditLogs.filter((log) =>
    filterAction !== "ALL" ? log.action === filterAction : true
  );

  // Chart data for login attempts by status
  const loginChartData = (() => {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const hourly = new Map<string, { success: number; failed: number }>();

    loginAttempts
      .filter((a) => new Date(a.created_at) > last24h)
      .forEach((a) => {
        const hour = format(new Date(a.created_at), "HH:00");
        const data = hourly.get(hour) || { success: 0, failed: 0 };
        if (a.success) data.success++;
        else data.failed++;
        hourly.set(hour, data);
      });

    return Array.from(hourly.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([time, data]) => ({ time, ...data }));
  })();

  // Audit log actions breakdown
  const auditChartData = (() => {
    const actions = new Map<string, number>();
    auditLogs.forEach((log) => {
      actions.set(log.action, (actions.get(log.action) || 0) + 1);
    });

    return Array.from(actions.entries())
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  })();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="inline w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-400">Loading security data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-100">Security Monitoring</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Login Attempts</p>
              <p className="text-2xl font-bold text-gray-100">
                {loginAttempts.length}
              </p>
            </div>
            <Activity className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Successful Logins</p>
              <p className="text-2xl font-bold text-green-400">
                {loginAttempts.filter((a) => a.success).length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Failed Attempts</p>
              <p className="text-2xl font-bold text-red-400">
                {loginAttempts.filter((a) => !a.success).length}
              </p>
            </div>
            <XCircle className="w-8 h-8 text-red-500 opacity-50" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Alerts</p>
              <p className="text-2xl font-bold text-yellow-400">
                {bruteForceAlerts.length}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {["login", "audit", "alerts"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as "login" | "audit" | "alerts")}
            className={`px-4 py-2 border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-gray-400 hover:text-gray-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Login Attempts Tab */}
      {activeTab === "login" && (
        <div className="space-y-4">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Login Trends Chart */}
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-200 mb-4">
                Login Attempts - Last 24 Hours
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={loginChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #374151",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#10B981"
                    name="Successful"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#EF4444"
                    name="Failed"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Success Rate Chart */}
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-200 mb-4">
                Success vs Failed
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    {
                      status: "Success",
                      count: loginAttempts.filter((a) => a.success).length,
                    },
                    {
                      status: "Failed",
                      count: loginAttempts.filter((a) => !a.success).length,
                    },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="status" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      border: "1px solid #374151",
                    }}
                  />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Filter by email..."
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleDownloadLogs}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Login Attempts List */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50">
                  <tr className="border-b border-gray-700/50">
                    <th className="px-4 py-3 text-left text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-gray-400">Email</th>
                    <th className="px-4 py-3 text-left text-gray-400">IP Address</th>
                    <th className="px-4 py-3 text-left text-gray-400">Time</th>
                    <th className="px-4 py-3 text-left text-gray-400">Device</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredAttempts.slice(0, 50).map((attempt, idx) => (
                      <motion.tr
                        key={attempt.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedAttempt(attempt)}
                        className="border-b border-gray-700/30 hover:bg-gray-700/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          {attempt.success ? (
                            <span className="flex items-center gap-1 text-green-400">
                              <CheckCircle className="w-4 h-4" />
                              Success
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-400">
                              <XCircle className="w-4 h-4" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-300">{attempt.email}</td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {attempt.ip_address}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {formatDistanceToNow(new Date(attempt.created_at), {
                            addSuffix: true,
                          })}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {attempt.user_agent?.substring(0, 30)}...
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Modal */}
          <AnimatePresence>
            {selectedAttempt && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedAttempt(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-800 max-w-2xl w-full rounded-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-100">
                      Login Attempt Details
                    </h3>
                    <button
                      onClick={() => setSelectedAttempt(null)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span
                        className={
                          selectedAttempt.success
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {selectedAttempt.success ? "Successful" : "Failed"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="text-gray-100">{selectedAttempt.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">IP Address:</span>
                      <span className="text-gray-100 font-mono">
                        {selectedAttempt.ip_address}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-gray-100">
                        {format(
                          new Date(selectedAttempt.created_at),
                          "MMM dd, yyyy HH:mm:ss"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">User Agent:</span>
                      <span className="text-gray-100 font-mono text-xs">
                        {selectedAttempt.user_agent}
                      </span>
                    </div>
                    {selectedAttempt.device_fingerprint && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Device Fingerprint:</span>
                        <span className="text-gray-100 font-mono text-xs">
                          {selectedAttempt.device_fingerprint}
                        </span>
                      </div>
                    )}
                    {selectedAttempt.failed_reason && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Failure Reason:</span>
                        <span className="text-red-300">
                          {selectedAttempt.failed_reason}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedAttempt(null)}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === "audit" && (
        <div className="space-y-4">
          {/* Chart */}
          <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-200 mb-4">
              Top Actions
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={auditChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="action" angle={-45} textAnchor="end" height={100} stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-3 py-2 bg-gray-800/50 border border-gray-700/50 rounded text-gray-100 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Actions</option>
              {Array.from(new Set(auditLogs.map((log) => log.action))).map(
                (action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                )
              )}
            </select>
            <button
              onClick={handleDownloadLogs}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2 transition-colors ml-auto"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>

          {/* Audit Logs List */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/50">
                  <tr className="border-b border-gray-700/50">
                    <th className="px-4 py-3 text-left text-gray-400">Action</th>
                    <th className="px-4 py-3 text-left text-gray-400">Table</th>
                    <th className="px-4 py-3 text-left text-gray-400">User ID</th>
                    <th className="px-4 py-3 text-left text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-gray-400">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredLogs.slice(0, 50).map((log) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedLog(log)}
                        className="border-b border-gray-700/30 hover:bg-gray-700/30 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-blue-300">{log.action}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {log.table_name}
                        </td>
                        <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                          {log.user_id?.substring(0, 8)}...
                        </td>
                        <td className="px-4 py-3">
                          {log.status === "success" ? (
                            <span className="text-green-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Success
                            </span>
                          ) : (
                            <span className="text-red-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              Failed
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {formatDistanceToNow(new Date(log.created_at), {
                            addSuffix: true,
                          })}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Modal */}
          <AnimatePresence>
            {selectedLog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                onClick={() => setSelectedLog(null)}
              >
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-gray-800 max-w-2xl w-full rounded-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold text-gray-100">
                      Audit Log Details
                    </h3>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Action:</span>
                      <span className="text-gray-100">{selectedLog.action}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Table:</span>
                      <span className="text-gray-100">{selectedLog.table_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span
                        className={
                          selectedLog.status === "success"
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {selectedLog.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-gray-100">
                        {format(
                          new Date(selectedLog.created_at),
                          "MMM dd, yyyy HH:mm:ss"
                        )}
                      </span>
                    </div>
                    {selectedLog.user_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">User ID:</span>
                        <span className="text-gray-100 font-mono text-xs">
                          {selectedLog.user_id}
                        </span>
                      </div>
                    )}
                    {selectedLog.record_id && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Record ID:</span>
                        <span className="text-gray-100 font-mono text-xs">
                          {selectedLog.record_id}
                        </span>
                      </div>
                    )}
                    {selectedLog.ip_address && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">IP Address:</span>
                        <span className="text-gray-100 font-mono">
                          {selectedLog.ip_address}
                        </span>
                      </div>
                    )}
                    {selectedLog.error_message && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Error:</span>
                        <span className="text-red-300 text-xs">
                          {selectedLog.error_message}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedLog.old_values && (
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-2">Old Values:</p>
                      <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                        {JSON.stringify(selectedLog.old_values, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedLog.new_values && (
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-700/50">
                      <p className="text-xs text-gray-400 mb-2">New Values:</p>
                      <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                        {JSON.stringify(selectedLog.new_values, null, 2)}
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={() => setSelectedLog(null)}
                    className="w-full mt-4 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded transition-colors"
                  >
                    Close
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Brute Force Alerts Tab */}
      {activeTab === "alerts" && (
        <div className="space-y-4">
          {bruteForceAlerts.length === 0 ? (
            <div className="p-8 text-center bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
              <p className="text-gray-300">No brute force attacks detected</p>
              <p className="text-sm text-gray-400 mt-1">
                Your system is secure
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {bruteForceAlerts.map((alert) => (
                <motion.div
                  key={alert.ip}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    alert.severity === "critical"
                      ? "bg-red-900/20 border-red-500"
                      : alert.severity === "high"
                      ? "bg-orange-900/20 border-orange-500"
                      : alert.severity === "medium"
                      ? "bg-yellow-900/20 border-yellow-500"
                      : "bg-blue-900/20 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle
                          className={`w-5 h-5 ${
                            alert.severity === "critical"
                              ? "text-red-500"
                              : alert.severity === "high"
                              ? "text-orange-500"
                              : alert.severity === "medium"
                              ? "text-yellow-500"
                              : "text-blue-500"
                          }`}
                        />
                        <p className="font-semibold text-gray-100">
                          {alert.ip}{" "}
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              alert.severity === "critical"
                                ? "bg-red-500/20 text-red-300"
                                : alert.severity === "high"
                                ? "bg-orange-500/20 text-orange-300"
                                : alert.severity === "medium"
                                ? "bg-yellow-500/20 text-yellow-300"
                                : "bg-blue-500/20 text-blue-300"
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                        </p>
                      </div>
                      <p className="text-sm text-gray-300">
                        {alert.count} failed login attempts in the last 15 minutes
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
