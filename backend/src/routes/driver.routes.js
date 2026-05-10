const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');

// 1. Get orders assigned to the driver
router.get('/assignments/:driverId', driverController.getAssignedOrders);

// 2. Post GPS tracking updates
router.post('/tracking', driverController.updateTracking);

// 3. Get driver profile and documents
router.get('/profile/:driverId', driverController.getDriverDetails);

// 4. Driver Login
router.post('/login', driverController.loginDriver);
router.get('/mission/:driverId', driverController.getActiveMission);
router.post('/update-status', driverController.updateMissionStatus);
router.post('/upload-document', driverController.uploadDocument);
router.patch('/update-duty-status', driverController.updateDutyStatus);
router.put('/update-profile', driverController.updateProfile);
router.get('/issues/:driverId', driverController.getDriverIssues);
router.post('/report-issue', driverController.reportIssue);
router.post('/upload-profile-photo', driverController.uploadProfilePhoto);
router.post('/remove-profile-photo', driverController.removeProfilePhoto);
router.get('/history/:driverId', driverController.getDriverHistory);
router.get('/vehicle-info/:supplierId', driverController.getVehicleInfo);
router.get('/order-documents/:orderId', driverController.getOrderDocuments);

module.exports = router;
