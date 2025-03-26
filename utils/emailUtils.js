const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});



/**
 * Send email
 * @param {string} to
 * @param {object} reportData
 * @param {string} fisioterapeutaName
 * @returns {Promise}
 */
const sendReportEmail = async (to, reportData, fisioterapeutaName) => {
  const { 
    totalProcedimentos, 
    producao, 
    producaoParticular,
    producaoPlanoSaude,
    totalParticular,
    totalPlanoSaude,
    evolucoesGeradas, 
    evolucoesGeradasParticular,
    evolucoesGeradasPlanoSaude,
    pacientesAtendidos, 
    periodoInicio, 
    periodoFim,
    procedimentosDetalhados 
  } = reportData;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0d6efd; text-align: center;">Relatório de Produção - FisiMaster</h2>
      <p style="text-align: center;">Período: ${formatDate(periodoInicio)} até ${formatDate(periodoFim)}</p>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h3 style="color: #0d6efd;">Resumo</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Produção Total:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(producaoParticular + producaoPlanoSaude)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Procedimentos Particulares:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${totalParticular || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Produção Particulares:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(producaoParticular || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Procedimentos Planos de Saúde:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${totalPlanoSaude || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Produção Planos de Saúde:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(producaoPlanoSaude || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Evoluções Particulares:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${evolucoesGeradasParticular || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Evoluções Planos de Saúde:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${evolucoesGeradasPlanoSaude || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Pacientes Atendidos:</strong></td>
            <td style="padding: 8px; text-align: right;">${pacientesAtendidos}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Este relatório foi gerado automaticamente pelo sistema FisiMaster.<br>
        Não responda a este email.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"FisiMaster" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Relatório - Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
};

/**

 * @param {string} to
 * @param {object} reportData
 * @param {string} fisioterapeutaName
 * @returns {Promise}
 */
const sendParticularReportEmail = async (to, reportData, fisioterapeutaName) => {
  const { 
    totalParticular, 
    producaoParticular,
    evolucoesGeradas, 
    evolucoesGeradasParticular,
    evolucoesGeradasPlanoSaude,
    pacientesAtendidos, 
    periodoInicio, 
    periodoFim,
    procedimentosDetalhados 
  } = reportData;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0d6efd; text-align: center;">Relatório de Produção Particular - FisiMaster</h2>
      <p style="text-align: center;">Período: ${formatDate(periodoInicio)} até ${formatDate(periodoFim)}</p>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h3 style="color: #0d6efd;">Resumo</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Procedimentos Particulares:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${totalParticular || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Produção Particulares:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(producaoParticular || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Evoluções Particulares:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${evolucoesGeradasParticular || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Pacientes Atendidos:</strong></td>
            <td style="padding: 8px; text-align: right;">${pacientesAtendidos}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h3 style="color: #0d6efd;">Procedimentos Particulares Detalhados</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Paciente</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Primeiro Procedimento</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Último Procedimento</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Total</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Evoluções</th>
            </tr>
          </thead>
          <tbody>
            ${procedimentosDetalhados.filter(proc => proc.planoSaude === 'Particular').map(proc => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${proc.pacienteNome}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(proc.primeiroProcedimento)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(proc.ultimoProcedimento)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${proc.totalProcedimentos}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${proc.totalEvolucoes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Este relatório foi gerado automaticamente pelo sistema FisiMaster.<br>
        Não responda a este email.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"FisiMaster" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Relatório Particular - Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
};

/**
 * Send health plan report email
 * @param {string} to
 * @param {object} reportData
 * @param {string} fisioterapeutaName
 * @returns {Promise}
 */
const sendHealthPlanReportEmail = async (to, reportData, fisioterapeutaName) => {
  const { 
    totalPlanoSaude, 
    producaoPlanoSaude,
    evolucoesGeradas, 
    evolucoesGeradasParticular,
    evolucoesGeradasPlanoSaude,
    pacientesAtendidos, 
    periodoInicio, 
    periodoFim,
    procedimentosDetalhados 
  } = reportData;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #0d6efd; text-align: center;">Relatório de Produção Planos de Saúde - FisiMaster</h2>
      <p style="text-align: center;">Período: ${formatDate(periodoInicio)} até ${formatDate(periodoFim)}</p>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h3 style="color: #0d6efd;">Resumo</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Procedimentos Planos de Saúde:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${totalPlanoSaude || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Produção Planos de Saúde:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(producaoPlanoSaude || 0)}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;"><strong>Evoluções Planos de Saúde:</strong></td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${evolucoesGeradasPlanoSaude || 0}</td>
          </tr>
          <tr>
            <td style="padding: 8px;"><strong>Pacientes Atendidos:</strong></td>
            <td style="padding: 8px; text-align: right;">${pacientesAtendidos}</td>
          </tr>
        </table>
      </div>
      
      <div style="margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h3 style="color: #0d6efd;">Procedimentos Planos de Saúde Detalhados</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Paciente</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Plano de Saúde</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Primeiro Procedimento</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: left;">Último Procedimento</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Procedimentos</th>
              <th style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Evoluções</th>
            </tr>
          </thead>
          <tbody>
            ${procedimentosDetalhados.map(proc => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${proc.pacienteNome}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${proc.planoSaude}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(proc.primeiroProcedimento)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${formatDate(proc.ultimoProcedimento)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${proc.planoSaude !== 'Particular' ? proc.totalProcedimentos * 5 : proc.totalProcedimentos}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${proc.planoSaude !== 'Particular' ? Math.round((proc.totalProcedimentos * 5) / 5) : proc.totalEvolucoes}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <p style="color: #666; font-size: 12px; text-align: center;">
        Este relatório foi gerado automaticamente pelo sistema FisiMaster.<br>
        Não responda a este email.
      </p>
    </div>
  `;

  const mailOptions = {
    from: `"FisiMaster" <${process.env.EMAIL_USER}>`,
    to,
    subject: `Relatório Planos de Saúde - Período: ${formatDate(periodoInicio)} a ${formatDate(periodoFim)}`,
    html: htmlContent
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  sendReportEmail,
  sendParticularReportEmail,
  sendHealthPlanReportEmail
};