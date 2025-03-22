const express = require('express');
const router = express.Router();
const { getRelatorios, sendReportViaEmail } = require('../controllers/relatorioController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getRelatorios);

router.route('/email')
  .post(protect, sendReportViaEmail);

module.exports = router;