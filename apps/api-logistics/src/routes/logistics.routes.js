import express from "express";
import multer from "multer";

import {
    createIssue,
    deleteDocument,
    finalizeOrder,
    getAllIssues,
    getDashboardSummary,
    getFilteredReports,
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

// =============================================
// MULTER CONFIG
// =============================================
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
router.get("/dashboard-summary", getDashboardSummary);
router.get("/reports", getFilteredReports);

// =============================================
// ORDERS
// =============================================
router.get("/orders", getOrdersByType);
router.get("/orders/:id", getOrderById);
router.get("/orders/:orderId/shortlisted-bids", getShortlistedBids);
router.post("/orders/:orderId/finalize", finalizeOrder);

// =============================================
// TRACKING
// =============================================
router.get("/tracking/order/:orderId", getTrackingByOrderId);

// =============================================
// DOCUMENTS
// =============================================
router.post("/documents/upload", upload.array("files"), uploadDocuments);
router.delete("/documents/:id", deleteDocument);

// =============================================
// ISSUES
// =============================================
router.post("/issues", createIssue);
router.get("/issues", getAllIssues);
router.patch("/issues/:id/status", updateIssueStatus);

router.get("/notifications", getNotifications);
router.patch("/notifications/:id/read", markNotificationAsRead);
router.patch("/notifications/read-all", markAllNotificationsAsRead);

router.post("/tracking/location", updateTrackingLocation);
router.get("/orders/:orderId/tracking", getTrackingByOrderId);

export default router;
