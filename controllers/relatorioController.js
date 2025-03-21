const asyncHandler = require('express-async-handler');
const Procedimento = require('../models/procedimentoModel');
const Paciente = require('../models/pacienteModel');
const { sendReportEmail } = require('../utils/emailUtils');

const getRelatorios = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const start = startDate ? new Date(startDate) : firstDayOfMonth;
  const end = endDate ? new Date(endDate) : lastDayOfMonth;
  
  end.setHours(23, 59, 59, 999);
  
  const dateFilter = {
    fisioterapeuta: req.user.id,
    dataRealizacao: {
      $gte: start,
      $lte: end
    }
  };
  
  const procedimentos = await Procedimento.find(dateFilter)
    .populate('paciente', 'nome planoSaude');
  
  const totalProcedimentos = procedimentos.length;
  
  const procedimentosParticular = procedimentos.filter(proc => proc.paciente.planoSaude === 'Particular');
  const procedimentosPlanoSaude = procedimentos.filter(proc => proc.paciente.planoSaude !== 'Particular');
  
  const producao = procedimentos.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0);
  
  const producaoParticular = procedimentosParticular.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0);
  
  const producaoPlanoSaude = procedimentosPlanoSaude.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0) * 5;
  
  const totalPlanoSaudeMultiplicado = procedimentosPlanoSaude.length * 5;
  
  const evolucoesGeradas = totalProcedimentos;
  
  const pacientesAtendidosIds = [...new Set(procedimentos.map(proc => 
    proc.paciente._id.toString()
  ))];
  const pacientesAtendidos = pacientesAtendidosIds.length;
  
  const procedimentosDetalhados = procedimentos.map(proc => ({
    pacienteNome: proc.paciente.nome,
    planoSaude: proc.paciente.planoSaude,
    dataRealizacao: proc.dataRealizacao,
    valorPlano: proc.valorPlano
  }));

  res.status(200).json({
    totalProcedimentos,
    producao: producaoParticular + producaoPlanoSaude,
    producaoParticular,
    producaoPlanoSaude,
    totalParticular: procedimentosParticular.length,
    totalPlanoSaude: totalPlanoSaudeMultiplicado,
    evolucoesGeradas,
    pacientesAtendidos,
    periodoInicio: start,
    periodoFim: end,
    procedimentosDetalhados
  });
});

const sendReportViaEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const { startDate, endDate } = req.query;
  
  if (!email) {
    res.status(400);
    throw new Error('Por favor, forneça um endereço de email');
  }
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  
  const start = startDate ? new Date(startDate) : firstDayOfMonth;
  const end = endDate ? new Date(endDate) : lastDayOfMonth;
  
  end.setHours(23, 59, 59, 999);
  
  const dateFilter = {
    fisioterapeuta: req.user.id,
    dataRealizacao: {
      $gte: start,
      $lte: end
    }
  };
  
  const procedimentos = await Procedimento.find(dateFilter)
    .populate('paciente', 'nome planoSaude');
  
  const totalProcedimentos = procedimentos.length;
  
  const procedimentosParticular = procedimentos.filter(proc => proc.paciente.planoSaude === 'Particular');
  const procedimentosPlanoSaude = procedimentos.filter(proc => proc.paciente.planoSaude !== 'Particular');
  
  const producao = procedimentos.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0);
  
  const producaoParticular = procedimentosParticular.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0);
  
  const producaoPlanoSaude = procedimentosPlanoSaude.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0) * 5;
  
  const totalPlanoSaudeMultiplicado = procedimentosPlanoSaude.length * 5;
  
  const evolucoesGeradas = totalProcedimentos;
  
  const pacientesAtendidosIds = [...new Set(procedimentos.map(proc => 
    proc.paciente._id.toString()
  ))];
  const pacientesAtendidos = pacientesAtendidosIds.length;
  
  const procedimentosDetalhados = procedimentos.map(proc => ({
    pacienteNome: proc.paciente.nome,
    planoSaude: proc.paciente.planoSaude,
    dataRealizacao: proc.dataRealizacao,
    valorPlano: proc.valorPlano
  }));

  const reportData = {
    totalProcedimentos,
    producao: producaoParticular + producaoPlanoSaude,
    producaoParticular,
    producaoPlanoSaude,
    totalParticular: procedimentosParticular.length,
    totalPlanoSaude: totalPlanoSaudeMultiplicado, 
    evolucoesGeradas,
    pacientesAtendidos,
    periodoInicio: start,
    periodoFim: end,
    procedimentosDetalhados
  };
  
  try {
    await sendReportEmail(email, reportData, req.user.nome);
    res.status(200).json({ success: true, message: 'Relatório enviado com sucesso para ' + email });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500);
    throw new Error('Erro ao enviar o relatório por email');
  }
});

module.exports = {
  getRelatorios,
  sendReportViaEmail,
};