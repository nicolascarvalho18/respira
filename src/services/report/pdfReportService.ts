import { MoodRecord, User, Practice } from '../../types';
import { formatDate, formatDateTime } from '../../utils/date';
import { Platform } from 'react-native';

export interface ReportOptions {
  month: number; // 0-11
  year: number;
  includeStats: boolean;
  includeEmotions: boolean;
  includePractices: boolean;
  includeNotes: boolean;
}

export class PdfReportService {
  generateHtmlReport(
    user: User,
    records: MoodRecord[],
    practices: Practice[],
    options: ReportOptions
  ): string {
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    const filteredRecords = records.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === options.month && d.getFullYear() === options.year;
    });

    const totalCheckins = filteredRecords.length;
    const avgMood = totalCheckins > 0
      ? (filteredRecords.reduce((acc, r) => acc + r.mood, 0) / totalCheckins).toFixed(1)
      : '0.0';
    const avgAnxiety = totalCheckins > 0
      ? (filteredRecords.reduce((acc, r) => acc + (r.anxietyLevel || 0), 0) / totalCheckins).toFixed(1)
      : '0.0';

    const completedPracticesSum = practices.reduce((acc, p) => acc + (p.completedCount || 0), 0);

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório Mensal • Respira</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #173D3B;
      background: #FFFFFF;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #2F7F7C;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #2F7F7C;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 14px;
      color: #667775;
      margin-top: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
      background: #F7F9F7;
      border: 1px solid #DCE5E2;
      border-radius: 10px;
      padding: 14px 18px;
    }
    .meta-item strong {
      color: #173D3B;
      font-size: 13px;
    }
    .meta-item span {
      color: #567571;
      font-size: 13px;
      margin-left: 4px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .stat-card {
      border: 1px solid #DCE5E2;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
      background: #FFFFFF;
    }
    .stat-val {
      font-size: 20px;
      font-weight: 800;
      color: #2F7F7C;
    }
    .stat-lbl {
      font-size: 11px;
      color: #667775;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 2px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 800;
      border-left: 4px solid #2F7F7C;
      padding-left: 8px;
      margin-bottom: 14px;
      margin-top: 24px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 12px;
    }
    th {
      background: #E7F3EF;
      color: #173D3B;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #DCE5E2;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #DCE5E2;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #FAFCFB;
    }
    .footer {
      margin-top: 40px;
      padding-top: 14px;
      border-top: 1px solid #DCE5E2;
      font-size: 11px;
      color: #708885;
      text-align: center;
    }
    @media print {
      body { padding: 12px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">🌿 Respira</div>
    <div class="subtitle">Relatório Mensal de Acompanhamento Emocional</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><strong>Paciente / Usuário:</strong> <span>${user.name}</span></div>
    <div class="meta-item"><strong>Período Analisado:</strong> <span>${monthNames[options.month]} de ${options.year}</span></div>
    <div class="meta-item"><strong>E-mail:</strong> <span>${user.email}</span></div>
    <div class="meta-item"><strong>Data de Emissão:</strong> <span>${formatDateTime(new Date().toISOString())}</span></div>
  </div>

  ${options.includeStats ? `
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-val">${totalCheckins}</div>
      <div class="stat-lbl">Registros no Mês</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${avgMood} <span style="font-size:12px;color:#667775">/5</span></div>
      <div class="stat-lbl">Humor Médio</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${avgAnxiety} <span style="font-size:12px;color:#667775">/10</span></div>
      <div class="stat-lbl">Ansiedade Média</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${completedPracticesSum}</div>
      <div class="stat-lbl">Práticas Concluídas</div>
    </div>
  </div>` : ''}

  <div class="section-title">Detalhamento dos Check-ins de Humor e Ansiedade</div>
  <table>
    <thead>
      <tr>
        <th style="width:18%">Data / Hora</th>
        <th style="width:12%">Humor</th>
        <th style="width:14%">Ansiedade</th>
        <th>Emoções & Contexto</th>
        ${options.includeNotes ? '<th style="width:30%">Observações</th>' : ''}
      </tr>
    </thead>
    <tbody>
      ${filteredRecords.length === 0 ? `<tr><td colspan="${options.includeNotes ? 5 : 4}" style="text-align:center;padding:20px;color:#667775">Nenhum check-in registrado neste período.</td></tr>` : filteredRecords.map((rec) => `
        <tr>
          <td>${formatDate(rec.createdAt)}</td>
          <td><strong>${rec.mood}/5</strong></td>
          <td>${rec.anxietyLevel || 0}/10</td>
          <td>${(rec.emotions || []).join(', ') || 'Nenhum sintoma registrado'}</td>
          ${options.includeNotes ? `<td>${rec.notes || '—'}</td>` : ''}
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${options.includePractices ? `
  <div class="section-title">Práticas de Respiração e Relaxamento Realizadas</div>
  <table>
    <thead>
      <tr>
        <th>Prática</th>
        <th>Modalidade</th>
        <th>Duração</th>
        <th>Vezes Realizadas</th>
      </tr>
    </thead>
    <tbody>
      ${practices.map((p) => `
        <tr>
          <td><strong>${p.title}</strong></td>
          <td>${p.subtitle}</td>
          <td>${p.durationMinutes} minutos</td>
          <td>${p.completedCount || 0} vezes</td>
        </tr>
      `).join('')}
    </tbody>
  </table>` : ''}

  <div class="footer">
    <strong>Aviso Importante:</strong> Este relatório apresenta informações registradas pelo próprio usuário e não substitui avaliação, diagnóstico ou acompanhamento profissional de saúde.
  </div>
</body>
</html>`;
  }

  async exportOrPrintReport(htmlContent: string, fileName: string) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 300);
      }
    }
  }
}

export const pdfReportService = new PdfReportService();
