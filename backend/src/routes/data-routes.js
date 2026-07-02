const express = require('express');
const router = express.Router();
const dataController = require('../controllers/data-controller');

router.get('/export', dataController.exportAll);
router.get('/backups', dataController.listBackups);
router.post('/backups', dataController.createBackup);
router.get('/backups/:filename', dataController.getBackup);
router.post('/backups/:filename/restore', dataController.restoreBackup);
router.post('/import', dataController.importOverwrite);
router.delete('/clear', dataController.clearAll);

module.exports = router;
