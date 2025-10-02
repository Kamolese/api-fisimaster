const asyncHandler = require('express-async-handler');
const Procedimento = require('../models/procedimentoModel');
const Paciente = require('../models/pacienteModel');
const { sendReportEmail, sendParticularReportEmail, sendHealthPlanReportEmail } = require('../utils/emailUtils');
const { generateReportPDF } = require('../utils/pdfUtils');

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
  const evolucoesGeradasParticular = procedimentosParticular.length;
  const evolucoesGeradasPlanoSaude = procedimentosPlanoSaude.length;
  const evolucoesGeradas = evolucoesGeradasParticular + evolucoesGeradasPlanoSaude;
  
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
    if (proc.evolucao && proc.evolucao.trim() !== '') {
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
      totalProcedimentos: paciente.totalProcedimentos,
      totalEvolucoes: paciente.evolucoes.length
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
    evolucoesGeradasParticular,
    evolucoesGeradasPlanoSaude,
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
  
  const evolucoesGeradasParticular = procedimentosParticular.length;
  const evolucoesGeradasPlanoSaude = procedimentosPlanoSaude.length;
  const evolucoesGeradas = evolucoesGeradasParticular + evolucoesGeradasPlanoSaude;
  
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
    if (proc.evolucao && proc.evolucao.trim() !== '') {
      procedimentosPorPaciente[pacienteId].evolucoes.push({
        data: proc.dataRealizacao,
        texto: proc.evolucao
      });
    }
    procedimentosPorPaciente[pacienteId].totalProcedimentos++;
  });
  
  const procedimentosDetalhados = Object.values(procedimentosPorPaciente)
    // Filter to only include patients with health plans (not particular)
    .filter(paciente => paciente.planoSaude !== 'Particular')
    .map(paciente => {
      paciente.procedimentos.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
      
      return {
        pacienteNome: paciente.pacienteNome,
        planoSaude: paciente.planoSaude,
        primeiroProcedimento: paciente.procedimentos[0].dataRealizacao,
        ultimoProcedimento: paciente.procedimentos[paciente.procedimentos.length - 1].dataRealizacao,
        totalProcedimentos: paciente.totalProcedimentos,
        totalEvolucoes: paciente.evolucoes.length
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
    evolucoesGeradasParticular,
    evolucoesGeradasPlanoSaude,
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
  const procedimentosPlanoSaude = procedimentos.filter(proc => proc.paciente.planoSaude !== 'Particular');
  
  const producaoParticular = procedimentosParticular.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0);
  
  const evolucoesGeradasParticular = procedimentosParticular.length;
  const evolucoesGeradasPlanoSaude = procedimentosPlanoSaude.length;
  const evolucoesGeradas = evolucoesGeradasParticular + evolucoesGeradasPlanoSaude;
  
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
    if (proc.evolucao && proc.evolucao.trim() !== '') {
      procedimentosPorPaciente[pacienteId].evolucoes.push({
        data: proc.dataRealizacao,
        texto: proc.evolucao
      });
    }
    procedimentosPorPaciente[pacienteId].totalProcedimentos++;
  });
  
  const procedimentosDetalhados = Object.values(procedimentosPorPaciente)
    // Filter to only include patients with health plans (not particular)
    .filter(paciente => paciente.planoSaude !== 'Particular')
    .map(paciente => {
      paciente.procedimentos.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
      
      return {
        pacienteNome: paciente.pacienteNome,
        planoSaude: paciente.planoSaude,
        primeiroProcedimento: paciente.procedimentos[0].dataRealizacao,
        ultimoProcedimento: paciente.procedimentos[paciente.procedimentos.length - 1].dataRealizacao,
        totalProcedimentos: paciente.totalProcedimentos,
        totalEvolucoes: paciente.evolucoes.length
      };
    });

  const reportData = {
    totalProcedimentos,
    totalParticular: procedimentosParticular.length,
    producaoParticular,
    evolucoesGeradas,
    evolucoesGeradasParticular,
    evolucoesGeradasPlanoSaude,
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
  const procedimentosParticular = procedimentos.filter(proc => proc.paciente.planoSaude === 'Particular');
  
  const producaoPlanoSaude = procedimentosPlanoSaude.reduce((total, proc) => {
    return total + (proc.valorPlano || 0);
  }, 0) * 5;
  
  const totalPlanoSaudeMultiplicado = procedimentosPlanoSaude.length * 5;
  
  const evolucoesGeradasParticular = procedimentosParticular.length;
  const evolucoesGeradasPlanoSaude = procedimentosPlanoSaude.length;
  const evolucoesGeradas = evolucoesGeradasParticular + evolucoesGeradasPlanoSaude;
  
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
    if (proc.evolucao && proc.evolucao.trim() !== '') {
      procedimentosPorPaciente[pacienteId].evolucoes.push({
        data: proc.dataRealizacao,
        texto: proc.evolucao
      });
    }
    procedimentosPorPaciente[pacienteId].totalProcedimentos++;
  });
  
  const procedimentosDetalhados = Object.values(procedimentosPorPaciente)
    // Filter to only include patients with health plans (not particular)
    .filter(paciente => paciente.planoSaude !== 'Particular')
    .map(paciente => {
      paciente.procedimentos.sort((a, b) => new Date(a.dataRealizacao) - new Date(b.dataRealizacao));
      
      return {
        pacienteNome: paciente.pacienteNome,
        planoSaude: paciente.planoSaude,
        primeiroProcedimento: paciente.procedimentos[0].dataRealizacao,
        ultimoProcedimento: paciente.procedimentos[paciente.procedimentos.length - 1].dataRealizacao,
        totalProcedimentos: paciente.totalProcedimentos,
        totalEvolucoes: paciente.evolucoes.length
      };
    });

  const reportData = {
    totalProcedimentos,
    totalPlanoSaude: totalPlanoSaudeMultiplicado,
    producaoPlanoSaude,
    evolucoesGeradas,
    evolucoesGeradasParticular,
    evolucoesGeradasPlanoSaude,
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

/**
 * @desc    Download complete report as PDF
 * @route   GET /api/relatorios/download
 * @access  Private
 */
const downloadReportPDF = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Por favor, forneça as datas de início e fim');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // Buscar procedimentos do usuário no período especificado
  const procedimentos = await Procedimento.find({
    fisioterapeuta: req.user._id,
    dataRealizacao: {
      $gte: start,
      $lte: end
    }
  }).populate('paciente', 'nome planoSaude');

  if (!procedimentos || procedimentos.length === 0) {
    res.status(404);
    throw new Error('Nenhum procedimento encontrado no período especificado');
  }

  // Calcular estatísticas
  const totalProcedimentos = procedimentos.length;
  let producaoTotal = 0;
  let producaoParticular = 0;
  let producaoPlanoSaude = 0;
  const pacientesUnicos = new Set();

  procedimentos.forEach(proc => {
    producaoTotal += proc.valorPlano;
    pacientesUnicos.add(proc.paciente._id.toString());
    
    if (proc.paciente.planoSaude === 'Particular') {
      producaoParticular += proc.valorPlano;
    } else {
      producaoPlanoSaude += proc.valorPlano;
    }
  });

  const totalPacientes = pacientesUnicos.size;
  const totalParticular = procedimentos.filter(p => p.paciente.planoSaude === 'Particular').length;
  const totalPlanoSaude = procedimentos.filter(p => p.paciente.planoSaude !== 'Particular').length;

  const reportData = {
    startDate: start,
    endDate: end,
    totalProcedimentos,
    totalPacientes,
    producaoTotal,
    producaoParticular,
    producaoPlanoSaude,
    totalParticular,
    totalPlanoSaude
  };

  try {
    console.log('📄 Gerando PDF do relatório...');
    const pdfBuffer = await generateReportPDF(reportData, req.user.nome);
    
    // Configurar headers para download
    const fileName = `relatorio-${req.user.nome.replace(/\s+/g, '-')}-${startDate}-${endDate}.pdf`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    console.log('✅ PDF enviado para download');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    res.status(500);
    throw new Error('Erro ao gerar o relatório em PDF');
  }
});

module.exports = {
  getRelatorios,
  sendReportViaEmail,
  sendParticularReportViaEmail,
  sendHealthPlanReportViaEmail,
  downloadReportPDF
};
