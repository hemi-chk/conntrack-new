import express from "express";
import multer from "multer";

import {
    getDashboardSummary,
    getOrdersByType,
    createIssue,
    getFilteredReports,
    getShortlistedBids,
    finalizeOrder,
    getOrderById,
    getTrackingByOrderId,
    uploadDocuments,
    deleteDocument,
    getAllIssues,
    updateIssueStatus
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

<<<<<<<< HEAD:apps/api-logistics/src/routes/logistics.routes.js
export default router;
========
router.post(
    "/issues",
    createIssue
);

router.get(
    "/issues",
    getAllIssues
);

router.patch(
    "/issues/:id/status",
    updateIssueStatus
);


export default router;
>>>>>>>> dc52815 ( scaffold API admin routes, update UI component library, and configure monorepo dependencies):apps/api-admin/src/routes/logistics.routes.js
