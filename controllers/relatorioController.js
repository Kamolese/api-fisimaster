const asyncHandler = require('express-async-handler');
const Procedimento = require('../models/procedimentoModel');
const Paciente = require('../models/pacienteModel');
const { sendReportEmail, sendParticularReportEmail, sendHealthPlanReportEmail } = require('../utils/emailUtils');

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
  
  const evolucoesGeradas = procedimentosPlanoSaude.length;
  
  const pacientesAtendidosIds = [...new Set(procedimentos.map(proc => 
    proc.paciente._id.toString()
  ))];
  const pacientesAtendidos = pacientesAtendidosIds.length;
  
  const procedimentosPorPaciente = {};
  
  procedimentos.forEach(proc => {
    const pacienteId = proc.paciente._id.toString();
    if (!procedimentosPorPaciente[pacienteId]) {
      procedimentosPorPaciente[pacienteId] = {
        pacienteNome: proc.paciente.nome,
        planoSaude: proc.paciente.planoSaude,
        procedimentos: [],
        totalProcedimentos: 0,
        evolucoes: []
      };
    }
    procedimentosPorPaciente[pacienteId].procedimentos.push({
      dataRealizacao: proc.dataRealizacao,
      valorPlano: proc.valorPlano
    });
    if (proc.evolucao) {
      procedimentosPorPaciente[pacienteId].evolucoes.push({
        data: proc.dataRealizacao,
        texto: proc.evolucao
      });
    }
    procedimentosPorPaciente[pacienteId].totalProcedimentos++;
  });
  
  const procedimentosDetalhados = Object.values(procedimentosPorPaciente).map(paciente => {
  
    paciente.procedimentos.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
    
    return {
      pacienteNome: paciente.pacienteNome,
      planoSaude: paciente.planoSaude,
      primeiroProcedimento: paciente.procedimentos[0].dataRealizacao,
      ultimoProcedimento: paciente.procedimentos[paciente.procedimentos.length - 1].dataRealizacao,
      totalProcedimentos: paciente.totalProcedimentos
    };
  });

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
  
  const evolucoesGeradas = procedimentosPlanoSaude.length;
  
  const pacientesAtendidosIds = [...new Set(procedimentos.map(proc => 
    proc.paciente._id.toString()
  ))];
  const pacientesAtendidos = pacientesAtendidosIds.length;
  
  // Agrupar procedimentos por paciente
  const procedimentosPorPaciente = {};
  
  procedimentos.forEach(proc => {
    const pacienteId = proc.paciente._id.toString();
    if (!procedimentosPorPaciente[pacienteId]) {
      procedimentosPorPaciente[pacienteId] = {
        pacienteNome: proc.paciente.nome,
        planoSaude: proc.paciente.planoSaude,
        procedimentos: [],
        totalProcedimentos: 0,
        evolucoes: []
      };
    }
    procedimentosPorPaciente[pacienteId].procedimentos.push({
      dataRealizacao: proc.dataRealizacao,
      valorPlano: proc.valorPlano
    });
    if (proc.evolucao) {
      procedimentosPorPaciente[pacienteId].evolucoes.push({
        data: proc.dataRealizacao,
        texto: proc.evolucao
      });
    }
    procedimentosPorPaciente[pacienteId].totalProcedimentos++;
  });
  
  const procedimentosDetalhados = Object.values(procedimentosPorPaciente).map(paciente => {
    paciente.procedimentos.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
    
    return {
      pacienteNome: paciente.pacienteNome,
      planoSaude: paciente.planoSaude,
      primeiroProcedimento: paciente.procedimentos[0].dataRealizacao,
      ultimoProcedimento: paciente.procedimentos[paciente.procedimentos.length - 1].dataRealizacao,
      totalProcedimentos: paciente.totalProcedimentos
    };
  });

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

/**
 * @desc    Send particular report via email
 * @route   POST /api/relatorios/email/particular
 * @access  Private
 */
const sendParticularReportViaEmail = asyncHandler(async (req, res) => {
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
  
  const producaoParticular = procedimentosParticular.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0);
  
  const evolucoesGeradas = procedimentosPlanoSaude.length;
  
  const pacientesAtendidosIds = [...new Set(procedimentos.map(proc => 
    proc.paciente._id.toString()
  ))];
  const pacientesAtendidos = pacientesAtendidosIds.length;
  
  // Agrupar procedimentos por paciente
  const procedimentosPorPaciente = {};
  
  procedimentos.forEach(proc => {
    const pacienteId = proc.paciente._id.toString();
    if (!procedimentosPorPaciente[pacienteId]) {
      procedimentosPorPaciente[pacienteId] = {
        pacienteNome: proc.paciente.nome,
        planoSaude: proc.paciente.planoSaude,
        procedimentos: [],
        totalProcedimentos: 0,
        evolucoes: []
      };
    }
    procedimentosPorPaciente[pacienteId].procedimentos.push({
      dataRealizacao: proc.dataRealizacao,
      valorPlano: proc.valorPlano
    });
    if (proc.evolucao) {
      procedimentosPorPaciente[pacienteId].evolucoes.push({
        data: proc.dataRealizacao,
        texto: proc.evolucao
      });
    }
    procedimentosPorPaciente[pacienteId].totalProcedimentos++;
  });
  
  const procedimentosDetalhados = Object.values(procedimentosPorPaciente).map(paciente => {
    paciente.procedimentos.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
    
    return {
      pacienteNome: paciente.pacienteNome,
      planoSaude: paciente.planoSaude,
      primeiroProcedimento: paciente.procedimentos[0].dataRealizacao,
      ultimoProcedimento: paciente.procedimentos[paciente.procedimentos.length - 1].dataRealizacao,
      totalProcedimentos: paciente.totalProcedimentos
    };
  });

  const reportData = {
    totalProcedimentos,
    totalParticular: procedimentosParticular.length,
    producaoParticular,
    evolucoesGeradas,
    pacientesAtendidos,
    periodoInicio: start,
    periodoFim: end,
    procedimentosDetalhados
  };
  
  try {
    await sendParticularReportEmail(email, reportData, req.user.nome);
    res.status(200).json({ success: true, message: 'Relatório de pacientes particulares enviado com sucesso para ' + email });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500);
    throw new Error('Erro ao enviar o relatório por email');
  }
});

/**
 * @desc    Send health plan report via email
 * @route   POST /api/relatorios/email/plano-saude
 * @access  Private
 */
const sendHealthPlanReportViaEmail = asyncHandler(async (req, res) => {
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
  
  const procedimentosPlanoSaude = procedimentos.filter(proc => proc.paciente.planoSaude !== 'Particular');
  
  const producaoPlanoSaude = procedimentosPlanoSaude.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0) * 5;
  
  const totalPlanoSaudeMultiplicado = procedimentosPlanoSaude.length * 5;
  
  const evolucoesGeradas = procedimentosPlanoSaude.length;
  
  const pacientesAtendidosIds = [...new Set(procedimentos.map(proc => 
    proc.paciente._id.toString()
  ))];
  const pacientesAtendidos = pacientesAtendidosIds.length;
  
  // Agrupar procedimentos por paciente
  const procedimentosPorPaciente = {};
  
  procedimentos.forEach(proc => {
    const pacienteId = proc.paciente._id.toString();
    if (!procedimentosPorPaciente[pacienteId]) {
      procedimentosPorPaciente[pacienteId] = {
        pacienteNome: proc.paciente.nome,
        planoSaude: proc.paciente.planoSaude,
        procedimentos: [],
        totalProcedimentos: 0,
        evolucoes: []
      };
    }
    procedimentosPorPaciente[pacienteId].procedimentos.push({
      dataRealizacao: proc.dataRealizacao,
      valorPlano: proc.valorPlano
    });
    if (proc.evolucao) {
      procedimentosPorPaciente[pacienteId].evolucoes.push({
        data: proc.dataRealizacao,
        texto: proc.evolucao
      });
    }
    procedimentosPorPaciente[pacienteId].totalProcedimentos++;
  });
  
  const procedimentosDetalhados = Object.values(procedimentosPorPaciente).map(paciente => {
    paciente.procedimentos.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
    
    return {
      pacienteNome: paciente.pacienteNome,
      planoSaude: paciente.planoSaude,
      primeiroProcedimento: paciente.procedimentos[0].dataRealizacao,
      ultimoProcedimento: paciente.procedimentos[paciente.procedimentos.length - 1].dataRealizacao,
      totalProcedimentos: paciente.totalProcedimentos
    };
  });

  const reportData = {
    totalProcedimentos,
    totalPlanoSaude: totalPlanoSaudeMultiplicado,
    producaoPlanoSaude,
    evolucoesGeradas,
    pacientesAtendidos,
    periodoInicio: start,
    periodoFim: end,
    procedimentosDetalhados
  };
  
  try {
    await sendHealthPlanReportEmail(email, reportData, req.user.nome);
    res.status(200).json({ success: true, message: 'Relatório de planos de saúde enviado com sucesso para ' + email });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500);
    throw new Error('Erro ao enviar o relatório por email');
  }
});

module.exports = {
  getRelatorios,
  sendReportViaEmail,
  sendParticularReportViaEmail,
  sendHealthPlanReportViaEmail
};