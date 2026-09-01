const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const requireDriverAuth = require('../middleware/auth.middleware');

router.post('/login', driverController.loginDriver);

router.use(requireDriverAuth);

router.get('/assignments/:driverId', driverController.getAssignedOrders);
router.post('/tracking', driverController.updateTracking);
router.get('/profile/:driverId', driverController.getDriverDetails);
router.get('/mission/:driverId', driverController.getActiveMission);
router.post('/update-status', driverController.updateMissionStatus);
router.post('/upload-document', driverController.uploadDocument);
router.patch('/update-duty-status', driverController.updateDutyStatus);
router.put('/update-profile', driverController.updateProfile);
router.get('/issues/:driverId', driverController.getDriverIssues);
router.post('/report-issue', driverController.reportIssue);
router.post('/upload-profile-photo', driverController.uploadProfilePhoto);
router.post('/remove-profile-photo', driverController.removeProfilePhoto);
router.post('/change-password', driverController.changePassword);
router.get('/history/:driverId', driverController.getDriverHistory);
router.get('/vehicle-info/:supplierId', driverController.getVehicleInfo);
router.get('/order-documents/:orderId', driverController.getOrderDocuments);
router.get('/tracking-stages/:type', driverController.getTrackingStages);
router.get('/assigned-vehicle/:driverId', driverController.getAssignedVehicle);

module.exports = router;
