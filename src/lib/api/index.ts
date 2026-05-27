/**
 * API barrel export — re-exports all domain modules for backward compatibility.
 * Consumers can import from "../lib/api" or "../lib/api/{module}".
 */

// Mappers (row types + mapping functions + shared helpers)
export {
  BUCKET,
  OFFICIAL_INBOX_EMAIL,
  type ProfileRow,
  type ProjectRow,
  type ProjectFileRow,
  type TestimonialRow,
  type AdminNoteRow,
  type SubmissionNotificationRow,
  mapProjectRow,
  mapProjectFileRow,
  mapTestimonialRow,
  mapAdminNoteRow,
  mapSubmissionNotificationRow,
  profileToUser,
  profilesByIds,
  attachProjectRelations,
  removeStorageKeys,
} from "./mappers";

// Auth & security
export {
  userFromAuthUser,
  fetchSessionUser,
  validateEmailPasswordLogin,
  trackPasswordResetRequest,
  completePasswordReset,
  getRecentPasswordResets,
  trackLoginAttempt,
  checkBruteForceAttempts,
  logAuditEvent,
  markEmailAsVerified,
} from "./auth";

// Projects, gallery, testimonials, profile updates
export {
  fetchMyProjects,
  deleteMyProject,
  fetchFeaturedGallery,
  fetchApprovedTestimonials,
  createProjectWithFiles,
  updateMyProfile,
} from "./projects";

// Submission notifications
export {
  createSubmissionNotification,
  fetchAdminSubmissionNotifications,
  adminAcknowledgeSubmissionNotification,
  adminRetrySubmissionNotificationEmail,
} from "./notifications";

// User settings
export {
  fetchUserSettings,
  updateUserSettings,
} from "./profiles";

// Admin dashboard
export {
  fetchAdminProjects,
  adminUpdateProject,
  adminDeleteProject,
  adminBulkUpdateProjects,
  adminBulkDeleteProjects,
  adminDeleteProjectFile,
  adminDeleteAdminNote,
  adminReassignProject,
  adminCreateTestimonial,
  fetchAdminTestimonials,
  adminSetTestimonialApproved,
  adminDeleteTestimonial,
  adminUpdateUserProfile,
  fetchAdminUsers,
  adminSetUserRole,
  adminDeleteUserProfile,
  adminGetRecentLoginAttempts,
  adminGetAuditLogs,
  fetchAdminAnalytics,
} from "./admin";
