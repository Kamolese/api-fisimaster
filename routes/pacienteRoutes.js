const express = require('express');
const router = express.Router();

const {
  getPacientes,
  getPaciente,
  createPaciente,
  updatePaciente,
  deletePaciente,
} = require('../controllers/pacienteController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPacientes)
  .post(protect, createPaciente);

router.route('/:id')
  .get(protect, getPaciente)
  .put(protect, updatePaciente)
  .delete(protect, deletePaciente);

module.exports = router;