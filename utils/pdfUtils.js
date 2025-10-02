const puppeteer = require('puppeteer');

// Função para formatar data
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

// Função para formatar moeda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Gerar HTML para o relatório completo
const generateReportHTML = (reportData, fisioterapeutaName) => {
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório de Procedimentos - FisiMaster</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f8f9fa;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 3px solid #3498db;
        }
        
        .header h1 {
          color: #2c3e50;
          font-size: 28px;
          margin-bottom: 10px;
        }
        
        .header .subtitle {
          color: #7f8c8d;
          font-size: 16px;
        }
        
        .fisio-info {
          background-color: #3498db;
          color: white;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
          text-align: center;
        }
        
        .fisio-info h2 {
          font-size: 20px;
          margin: 0;
        }
        
        .period-info {
          background-color: #ecf0f1;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 25px;
        }
        
        .period-info h3 {
          color: #34495e;
          margin-bottom: 10px;
        }
        
        .period-dates {
          font-size: 16px;
          font-weight: bold;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .stat-card {
          background-color: #fff;
          border: 2px solid #ecf0f1;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          transition: transform 0.2s;
        }
        
        .stat-card.procedures {
          border-color: #27ae60;
          background-color: #e8f5e8;
        }
        
        .stat-card.patients {
          border-color: #f39c12;
          background-color: #fff3cd;
        }
        
        .stat-card.production {
          border-color: #28a745;
          background-color: #d4edda;
        }
        
        .stat-card h4 {
          margin-bottom: 10px;
          font-size: 16px;
        }
        
        .stat-card.procedures h4 {
          color: #27ae60;
        }
        
        .stat-card.patients h4 {
          color: #f39c12;
        }
        
        .stat-card.production h4 {
          color: #28a745;
        }
        
        .stat-value {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
        }
        
        .stat-card.procedures .stat-value {
          color: #27ae60;
        }
        
        .stat-card.patients .stat-value {
          color: #f39c12;
        }
        
        .stat-card.production .stat-value {
          color: #28a745;
        }
        
        .detailed-section {
          margin-top: 30px;
        }
        
        .detailed-section h3 {
          color: #2c3e50;
          margin-bottom: 15px;
          padding-bottom: 10px;
          border-bottom: 2px solid #ecf0f1;
        }
        
        .breakdown-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .breakdown-card {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          border-left: 4px solid #3498db;
        }
        
        .breakdown-card h4 {
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ecf0f1;
          text-align: center;
          color: #7f8c8d;
          font-size: 14px;
        }
        
        @media print {
          body {
            background-color: white;
          }
          
          .container {
            box-shadow: none;
            max-width: none;
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Relatório de Procedimentos</h1>
          <div class="subtitle">Sistema FisiMaster</div>
        </div>
        
        <div class="fisio-info">
          <h2>Fisioterapeuta: ${fisioterapeutaName}</h2>
        </div>
        
        <div class="period-info">
          <h3>📅 Período do Relatório</h3>
          <div class="period-dates">
            <strong>De:</strong> ${formatDate(reportData.startDate)} 
            <strong>até</strong> ${formatDate(reportData.endDate)}
          </div>
        </div>
        
        <div class="stats-grid">
          <div class="stat-card procedures">
            <h4>Total de Procedimentos</h4>
            <p class="stat-value">${reportData.totalProcedimentos}</p>
          </div>
          
          <div class="stat-card patients">
            <h4>Total de Pacientes</h4>
            <p class="stat-value">${reportData.totalPacientes}</p>
          </div>
          
          <div class="stat-card production">
            <h4>Produção Total</h4>
            <p class="stat-value">${formatCurrency(reportData.producaoTotal)}</p>
          </div>
        </div>
        
        <div class="detailed-section">
          <h3>📈 Detalhamento da Produção</h3>
          <div class="breakdown-grid">
            <div class="breakdown-card">
              <h4>Procedimentos Particulares</h4>
              <div class="breakdown-item">
                <span>Quantidade:</span>
                <strong>${reportData.totalParticular || 0}</strong>
              </div>
              <div class="breakdown-item">
                <span>Valor:</span>
                <strong>${formatCurrency(reportData.producaoParticular || 0)}</strong>
              </div>
            </div>
            
            <div class="breakdown-card">
              <h4>Procedimentos Plano de Saúde</h4>
              <div class="breakdown-item">
                <span>Quantidade:</span>
                <strong>${reportData.totalPlanoSaude || 0}</strong>
              </div>
              <div class="breakdown-item">
                <span>Valor:</span>
                <strong>${formatCurrency(reportData.producaoPlanoSaude || 0)}</strong>
              </div>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p>
            Relatório gerado automaticamente pelo sistema FisiMaster<br>
            Data de geração: ${formatDate(new Date())}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Gerar PDF do relatório
const generateReportPDF = async (reportData, fisioterapeutaName) => {
  let browser;
  
  try {
    console.log('🔄 Iniciando geração do PDF...');
    
    // Configurar puppeteer para ambiente de produção
    const browserOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    };

    // Em ambiente de produção (como Render), usar executablePath
    if (process.env.NODE_ENV === 'production') {
      browserOptions.executablePath = '/usr/bin/google-chrome-stable';
    }

    browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();
    
    // Gerar HTML do relatório
    const htmlContent = generateReportHTML(reportData, fisioterapeutaName);
    
    // Configurar a página
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Gerar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    console.log('✅ PDF gerado com sucesso!');
    return pdfBuffer;
    
  } catch (error) {
    console.error('❌ Erro ao gerar PDF:', error);
    throw new Error(`Falha na geração do PDF: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  generateReportPDF,
  generateReportHTML
};