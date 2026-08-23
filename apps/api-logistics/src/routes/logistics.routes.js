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
    updateIssueStatus,
    updateTrackingLocation
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


// =============================================
// BID SELECTION - LOGISTICS
// =============================================

/**
 * GET SHORTLISTED BIDS
 *
 * Operations Team shortlists maximum 5 bids
 * and sends them to Logistics.
 *
 * Logistics receives those shortlisted bids
 * through this endpoint.
 *
 * Expected flow:
 *
 * Operations
 *      ↓
 * bid_selection
 *      ↓
 * SHORTLISTED bids
 *      ↓
 * Logistics BidsSection
 *
 * Frontend:
 * GET /api/logistics/orders/:orderId/shortlisted-bids
 */
router.get(
    "/orders/:orderId/shortlisted-bids",
    getShortlistedBids
);


/**
 * FINALIZE WINNER
 *
 * Logistics selects ONE winner from the
 * shortlisted bids received from Operations.
 *
 * Frontend sends:
 *
 * {
 *   bidId,
 *   selectionId
 * }
 *
 * Controller should:
 *
 * Selected bid:
 * status = WINNER
 *
 * Other shortlisted bids:
 * status = REJECTED
 *
 * The decision is then available for
 * the Operations Team.
 *
 * Frontend:
 * POST /api/logistics/orders/:orderId/finalize
 */
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

router.get(
    "/issues",
    getAllIssues
);

router.patch(
    "/issues/:id/status",
    updateIssueStatus
);

router.post(
    "/tracking/location",
    updateTrackingLocation
);

router.get(
    "/orders/:orderId/tracking",
    getTrackingByOrderId
);


export default router;