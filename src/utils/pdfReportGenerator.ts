export interface ReportData {
  title: string;
  subtitle: string;
  type: 'Monthly CFO' | 'Quarterly Boardroom' | 'Annual Statement' | 'Net Worth Certificate' | 'Tax Plan' | 'Portfolio Summary';
  generatedAt: string;
  user: { name: string; email: string };
  kpis: { label: string; value: string; detail?: string }[];
  summaryParagraph: string;
  recommendations: string[];
}

export function generateAndPrintPdfReport(data: ReportData) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF reports.');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${data.title} - TrackPay Executive Report</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
          body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background: #ffffff;
            color: #0f172a;
            margin: 0;
            padding: 40px;
            box-sizing: border-box;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #10b981;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .brand {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.5px;
          }
          .brand span {
            color: #10b981;
          }
          .meta {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .title-block {
            margin-bottom: 30px;
          }
          .title {
            font-size: 22px;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 6px 0;
          }
          .subtitle {
            font-size: 13px;
            color: #64748b;
            margin: 0;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .kpi-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 16px;
          }
          .kpi-label {
            font-size: 11px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
            margin-bottom: 4px;
          }
          .kpi-value {
            font-size: 20px;
            font-weight: 800;
            color: #10b981;
          }
          .kpi-detail {
            font-size: 10px;
            color: #94a3b8;
            margin-top: 4px;
          }
          .section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
            color: #0f172a;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
            margin-bottom: 12px;
          }
          .summary-text {
            font-size: 13px;
            line-height: 1.6;
            color: #334155;
            background: #f1f5f9;
            padding: 16px;
            border-radius: 12px;
            border-left: 4px solid #10b981;
          }
          .rec-list {
            padding-left: 20px;
            margin: 0;
            font-size: 12px;
            color: #334155;
            line-height: 1.8;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #94a3b8;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">Track<span>Pay</span> Enterprise OS</div>
          <div class="meta">
            <div><strong>Report Type:</strong> ${data.type}</div>
            <div><strong>Generated:</strong> ${data.generatedAt}</div>
            <div><strong>Account:</strong> ${data.user.name} (${data.user.email})</div>
          </div>
        </div>

        <div class="title-block">
          <h1 class="title">${data.title}</h1>
          <p class="subtitle">${data.subtitle}</p>
        </div>

        <div class="kpi-grid">
          ${data.kpis
            .map(
              (kpi) => `
            <div class="kpi-card">
              <div class="kpi-label">${kpi.label}</div>
              <div class="kpi-value">${kpi.value}</div>
              ${kpi.detail ? `<div class="kpi-detail">${kpi.detail}</div>` : ''}
            </div>
          `
            )
            .join('')}
        </div>

        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="summary-text">${data.summaryParagraph}</div>
        </div>

        <div class="section">
          <div class="section-title">Strategic Action Recommendations</div>
          <ul class="rec-list">
            ${data.recommendations.map((rec) => `<li>${rec}</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          <div>Verified TrackPay Financial Intelligence System • Confidential Document</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
