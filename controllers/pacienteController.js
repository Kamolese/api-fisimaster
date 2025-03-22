const asyncHandler = require('express-async-handler');
const Paciente = require('../models/pacienteModel');

const getPacientes = asyncHandler(async (req, res) => {
  const pacientes = await Paciente.find({ fisioterapeuta: req.user.id });
  res.status(200).json(pacientes);
});

const getPaciente = asyncHandler(async (req, res) => {
  const paciente = await Paciente.findById(req.params.id);

  if (!paciente) {
    res.status(404);
    throw new Error('Paciente não encontrado');
  }

  if (paciente.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  res.status(200).json(paciente);
});

const createPaciente = asyncHandler(async (req, res) => {
  const {
    nome,
    dataNascimento,
    telefone,
    email,
    endereco,
    planoSaude,
    numeroCarteirinha,
    observacoes,
  } = req.body;

  if (!nome || !dataNascimento || !telefone || !planoSaude) {
    res.status(400);
    throw new Error('Por favor preencha os campos obrigatórios');
  }

  const paciente = await Paciente.create({
    nome,
    dataNascimento,
    telefone,
    email,
    endereco,
    planoSaude,
    numeroCarteirinha,
    observacoes,
    fisioterapeuta: req.user.id,
  });

  res.status(201).json(paciente);
});

const updatePaciente = asyncHandler(async (req, res) => {
  const paciente = await Paciente.findById(req.params.id);

  if (!paciente) {
    res.status(404);
    throw new Error('Paciente não encontrado');
  }

  if (paciente.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  const updatedPaciente = await Paciente.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json(updatedPaciente);
});

const deletePaciente = asyncHandler(async (req, res) => {
  const paciente = await Paciente.findById(req.params.id);

  if (!paciente) {
    res.status(404);
    throw new Error('Paciente não encontrado');
  }

  if (paciente.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  await paciente.remove();

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getPacientes,
  getPaciente,
  createPaciente,
  updatePaciente,
  deletePaciente,
};