const express = require('express');
const router = express.Router();

const {
  getProcedimentos,
  getProcedimentosByPaciente,
  getProcedimento,
  createProcedimento,
  updateProcedimento,
  deleteProcedimento,
} = require('../controllers/procedimentoController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getProcedimentos)
  .post(protect, createProcedimento);

router.route('/paciente/:pacienteId')
  .get(protect, getProcedimentosByPaciente);

router.route('/:id')
  .get(protect, getProcedimento)
  .put(protect, updateProcedimento)
  .delete(protect, deleteProcedimento);

module.exports = router;