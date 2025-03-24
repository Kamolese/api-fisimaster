const express = require('express');
const router = express.Router();
const { 
  getRelatorios, 
  sendReportViaEmail, 
  sendParticularReportViaEmail, 
  sendHealthPlanReportViaEmail 
} = require('../controllers/relatorioController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRelatorios);

router.route('/email')
  .post(protect, sendReportViaEmail);

router.route('/email/particular')
  .post(protect, sendParticularReportViaEmail);

router.route('/email/plano-saude')
  .post(protect, sendHealthPlanReportViaEmail);

module.exports = router;