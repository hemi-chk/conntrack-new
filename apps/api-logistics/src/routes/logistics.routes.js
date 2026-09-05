import express from "express";
import multer from "multer";

import {
    clearNotifications,
    createIssue,
    deleteDocument,
    downloadReportPdf,
    finalizeOrder,
    getAllIssues,
    getDashboardSummary,
    getFilteredReports,
    getMyProfile,
    getNotifications,
    getOrderById,
    getOrdersByType,
    getShortlistedBids,
    getTrackingByOrderId,
    markAllNotificationsAsRead,
    markNotificationAsRead,
    updateIssueStatus,
    updateTrackingLocation,
    uploadDocuments
} from "../controllers/logistics.controller.js";

const router = express.Router();

// =========================================================
// LOGISTICS API ROUTES
// ---------------------------------------------------------
// This router contains all endpoints used by the logistics app:
// dashboard, orders, tracking, documents, issues, profile, and notifications.
// Keeping all logistics routes together makes the backend easier to trace
// from the UI and avoids mixing logistics logic with other interfaces.
// =========================================================

// =============================================
// MULTER CONFIG
// =============================================
// Used for document uploads such as proof of delivery, shipment docs,
// and proof-of-incident files. Only logistics documents are accepted here.
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            "application/pdf",
            "image/png",
            "image/jpeg"
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only PDF, PNG, JPG files allowed"));
        }
    }
});

// =============================================
// DASHBOARD & REPORTS
// =============================================
// These endpoints power the logistics landing page and reporting views.
router.get("/dashboard-summary", getDashboardSummary);
router.get("/reports", getFilteredReports);
router.get("/reports/pdf", downloadReportPdf);
router.get("/profile", getMyProfile);

// =============================================
// ORDERS
// =============================================
// Orders are the core logistics workflow. This section handles listing,
// fetching one order, shortlist results, and finalizing supplier selection.
router.get("/orders", getOrdersByType);
router.get("/orders/:id", getOrderById);
router.get("/orders/:orderId/shortlisted-bids", getShortlistedBids);
router.post("/orders/:orderId/finalize", finalizeOrder);

// =============================================
// TRACKING
// =============================================
// Tracking endpoints give the logistics operator the current status and route
// movement for an individual shipment.
router.get("/tracking/order/:orderId", getTrackingByOrderId);

// =============================================
// DOCUMENTS
// =============================================
// Logistics-specific document workflow for proof files and workflow uploads.
router.post("/documents/upload", upload.array("files"), uploadDocuments);
router.delete("/documents/:id", deleteDocument);

// =============================================
// ISSUES
// =============================================
// Issue reporting is used when a shipment, route, supplier, or vehicle has a
// logistics problem that must be escalated to admin review.
router.post("/issues", createIssue);
router.get("/issues", getAllIssues);
router.patch("/issues/:id/status", updateIssueStatus);

// =============================================
// NOTIFICATIONS
// =============================================
// These endpoints keep logistics users informed about issues, updates, and
// workflow events related to their assigned shipments.
router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationAsRead);
router.patch("/notifications/read-all", markAllNotificationsAsRead);
router.delete("/notifications", clearNotifications);

router.post("/tracking/location", updateTrackingLocation);
router.get("/orders/:orderId/tracking", getTrackingByOrderId);

export default router;
