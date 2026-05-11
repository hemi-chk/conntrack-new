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
    deleteDocument
} from "../controllers/logistics.controller.js";

const router = express.Router();


// =============================================
// MULTER CONFIG
// =============================================

// Memory storage because files go directly
// to Supabase Storage

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
            cb(
                new Error(
                    "Only PDF, PNG, JPG files allowed"
                )
            );
        }
    }
});


// =============================================
// DASHBOARD & REPORTS
// =============================================

// Dashboard summary
router.get(
    "/dashboard-summary",
    getDashboardSummary
);

// Reports
router.get(
    "/reports",
    getFilteredReports
);


// =============================================
// ORDERS
// =============================================

// All orders
router.get(
    "/orders",
    getOrdersByType
);

// Single order details
router.get(
    "/orders/:id",
    getOrderById
);

// Shortlisted bids
router.get(
    "/orders/:orderId/shortlisted-bids",
    getShortlistedBids
);

// Finalize order
router.post(
    "/orders/:orderId/finalize",
    finalizeOrder
);


// =============================================
// TRACKING
// =============================================

// Tracking by order
router.get(
    "/tracking/order/:orderId",
    getTrackingByOrderId
);


// =============================================
// DOCUMENTS
// =============================================

/**
 * @route POST /api/logistics/documents/upload
 * @desc Upload clearance documents
 */

router.post(
    "/documents/upload",

    // field name from frontend
    upload.array("files"),

    uploadDocuments
);

router.delete(
    "/documents/:id",
    deleteDocument
);


// =============================================
// ISSUES
// =============================================

router.post(
    "/issues",
    createIssue
);


export default router;