const asyncHandler = require('express-async-handler');
const Procedimento = require('../models/procedimentoModel');
const Paciente = require('../models/pacienteModel');

const getProcedimentos = asyncHandler(async (req, res) => {
  const procedimentos = await Procedimento.find({ fisioterapeuta: req.user.id })
    .populate('paciente', 'nome planoSaude')
    .sort({ dataRealizacao: -1 });
  res.status(200).json(procedimentos);
});

const getProcedimentosByPaciente = asyncHandler(async (req, res) => {
  const paciente = await Paciente.findById(req.params.pacienteId);

  if (!paciente) {
    res.status(404);
    throw new Error('Paciente não encontrado');
  }

  if (paciente.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  const procedimentos = await Procedimento.find({
    paciente: req.params.pacienteId,
    fisioterapeuta: req.user.id,
  }).sort({ dataRealizacao: -1 });

  res.status(200).json(procedimentos);
});

const getProcedimento = asyncHandler(async (req, res) => {
  const procedimento = await Procedimento.findById(req.params.id).populate(
    'paciente',
    'nome planoSaude'
  );

  if (!procedimento) {
    res.status(404);
    throw new Error('Procedimento não encontrado');
  }

  if (procedimento.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  res.status(200).json(procedimento);
});

const createProcedimento = asyncHandler(async (req, res) => {
  const {
    nome,
    descricao,
    paciente,
    dataRealizacao,
    evolucao,
    planoSaude,
    valorPlano,
  } = req.body;

  if (!paciente || !planoSaude || !valorPlano) {
    res.status(400);
    throw new Error('Por favor preencha os campos obrigatórios');
  }

  const pacienteExists = await Paciente.findById(paciente);

  if (!pacienteExists) {
    res.status(404);
    throw new Error('Paciente não encontrado');
  }

  if (pacienteExists.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }
  let dataAjustada;
  if (dataRealizacao) {
    const [year, month, day] = dataRealizacao.split('T')[0].split('-');
    dataAjustada = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  } else {
    dataAjustada = Date.now();
  }

  const procedimento = await Procedimento.create({
    nome,
    descricao,
    paciente,
    fisioterapeuta: req.user.id,
    dataRealizacao: dataAjustada,
    evolucao,
    planoSaude,
    valorPlano,
  });

  res.status(201).json(procedimento);
});

const updateProcedimento = asyncHandler(async (req, res) => {
  const procedimento = await Procedimento.findById(req.params.id);

  if (!procedimento) {
    res.status(404);
    throw new Error('Procedimento não encontrado');
  }

  if (procedimento.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  if (req.body.valor && req.body.valor !== 5) {
    req.body.valor = 5;
  }

  const updatedProcedimento = await Procedimento.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );

  res.status(200).json(updatedProcedimento);
});

const deleteProcedimento = asyncHandler(async (req, res) => {
  const procedimento = await Procedimento.findById(req.params.id);

  if (!procedimento) {
    res.status(404);
    throw new Error('Procedimento não encontrado');
  }

  if (procedimento.fisioterapeuta.toString() !== req.user.id) {
    res.status(401);
    throw new Error('Não autorizado');
  }

  await Procedimento.deleteOne({ _id: req.params.id });

  res.status(200).json({ id: req.params.id });
});

module.exports = {
  getProcedimentos,
  getProcedimentosByPaciente,
  getProcedimento,
  createProcedimento,
  updateProcedimento,
  deleteProcedimento,
};