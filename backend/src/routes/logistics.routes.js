import express from 'express';
import { getDashboardSummary, getOrdersByType } from '../controllers/logistics.Controller.js';

const router = express.Router();

// Dashboard summary
router.get('/dashboard-summary', getDashboardSummary);

// List orders by type (import/export)
router.get('/orders', getOrdersByType);

export default router;