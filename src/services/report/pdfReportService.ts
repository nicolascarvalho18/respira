import { MoodRecord, User, Practice } from '../../types';
import { formatDate, formatDateTime } from '../../utils/date';
import { Platform } from 'react-native';

export interface ReportOptions {
  month?: number; // 0-11 (se undefined, gera de todos os meses disponíveis)
  year?: number;
  allMonths?: boolean;
  includeStats: boolean;
  includeEmotions: boolean;
  includePractices: boolean;
  includeNotes: boolean;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export class PdfReportService {
  generateHtmlReport(
    user: User,
    records: MoodRecord[],
    practices: Practice[],
    options: ReportOptions
  ): string {
    const isSingleMonth = !options.allMonths && options.month !== undefined && options.year !== undefined;

    // Agrupamento de registros por Mês/Ano
    type MonthGroup = {
      monthKey: string;
      monthIndex: number;
      year: number;
      label: string;
      records: MoodRecord[];
    };

    const monthGroups: MonthGroup[] = [];

    if (isSingleMonth && options.month !== undefined && options.year !== undefined) {
      const filtered = records.filter((r) => {
        const d = new Date(r.createdAt);
        return d.getMonth() === options.month && d.getFullYear() === options.year;
      }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      monthGroups.push({
        monthKey: `${options.year}-${options.month}`,
        monthIndex: options.month,
        year: options.year,
        label: `${MONTH_NAMES[options.month]} de ${options.year}`,
        records: filtered,
      });
    } else {
      // Todos os registros organizados cronologicamente
      if (records.length === 0) {
        const now = new Date();
        monthGroups.push({
          monthKey: `${now.getFullYear()}-${now.getMonth()}`,
          monthIndex: now.getMonth(),
          year: now.getFullYear(),
          label: `${MONTH_NAMES[now.getMonth()]} de ${now.getFullYear()}`,
          records: [],
        });
      } else {
        const sortedRecords = [...records].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        const map = new Map<string, MonthGroup>();

        sortedRecords.forEach((r) => {
          const d = new Date(r.createdAt);
          const m = d.getMonth();
          const y = d.getFullYear();
          const key = `${y}-${m}`;

          if (!map.has(key)) {
            map.set(key, {
              monthKey: key,
              monthIndex: m,
              year: y,
              label: `${MONTH_NAMES[m]} de ${y}`,
              records: [],
            });
          }
          map.get(key)!.records.push(r);
        });

        monthGroups.push(...Array.from(map.values()));
      }
    }

    // Totais globais
    const totalCheckinsAll = records.length;
    const avgMoodAll =
      totalCheckinsAll > 0
        ? (records.reduce((acc, r) => acc + r.mood, 0) / totalCheckinsAll).toFixed(1)
        : '0.0';
    const avgAnxietyAll =
      totalCheckinsAll > 0
        ? (records.reduce((acc, r) => acc + (r.anxietyLevel || 0), 0) / totalCheckinsAll).toFixed(1)
        : '0.0';

    const completedPracticesSum = practices.reduce(
      (acc, p) => acc + (p.completedCount || 0),
      0
    );

    const periodLabel = isSingleMonth && options.month !== undefined && options.year !== undefined
      ? `${MONTH_NAMES[options.month]} de ${options.year}`
      : monthGroups.length > 1
      ? `${monthGroups[0].label} a ${monthGroups[monthGroups.length - 1].label}`
      : monthGroups[0]?.label || 'Histórico Completo';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Relatório de Acompanhamento Emocional • Respira</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 36px 40px;
      color: #173D3B;
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 13px;
    }
    .header {
      border-bottom: 2.5px solid #2F7F7C;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-area {
      display: flex;
      flex-direction: column;
    }
    .logo {
      font-size: 26px;
      font-weight: 800;
      color: #2F7F7C;
      letter-spacing: -0.5px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .subtitle {
      font-size: 13px;
      color: #667775;
      margin-top: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 24px;
      background: #F7F9F7;
      border: 1px solid #DCE5E2;
      border-radius: 12px;
      padding: 14px 18px;
    }
    .meta-item strong {
      color: #173D3B;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .meta-item span {
      color: #2F7F7C;
      font-size: 13px;
      font-weight: 600;
      margin-left: 6px;
    }
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 26px;
    }
    .stat-card {
      border: 1px solid #DCE5E2;
      border-radius: 10px;
      padding: 12px 10px;
      text-align: center;
      background: #FAFCFB;
    }
    .stat-val {
      font-size: 22px;
      font-weight: 800;
      color: #2F7F7C;
    }
    .stat-lbl {
      font-size: 10px;
      color: #667775;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 3px;
      letter-spacing: 0.4px;
    }
    .month-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .month-title {
      font-size: 16px;
      font-weight: 800;
      color: #173D3B;
      border-left: 4px solid #2F7F7C;
      padding-left: 10px;
      margin-bottom: 12px;
      background: #E7F3EF;
      padding-top: 6px;
      padding-bottom: 6px;
      border-radius: 0 8px 8px 0;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #173D3B;
      border-left: 3px solid #79B8A4;
      padding-left: 8px;
      margin-bottom: 10px;
      margin-top: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    th {
      background: #E7F3EF;
      color: #173D3B;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #DCE5E2;
      font-weight: 700;
    }
    td {
      padding: 8px 10px;
      border: 1px solid #DCE5E2;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #FAFCFB;
    }
    .badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }
    .badge-mood {
      background: #E7F3EF;
      color: #2F7F7C;
    }
    .badge-anxiety {
      background: #FFF4EE;
      color: #D98968;
    }
    .empty-month-box {
      border: 1px dashed #C5D6D2;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      color: #667775;
      font-style: italic;
      background: #F7F9F7;
      margin-bottom: 16px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 14px;
      border-top: 1px solid #DCE5E2;
      font-size: 11px;
      color: #708885;
      text-align: center;
      line-height: 1.6;
    }
    @media print {
      body { padding: 12px; }
      @page { margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-area">
      <div class="logo">🌿 Respira</div>
      <div class="subtitle">Relatório Mensal de Acompanhamento Emocional</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#708885;">
      Emissão: <strong>${formatDateTime(new Date().toISOString())}</strong>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-item"><strong>Paciente / Usuário:</strong> <span>${user.name}</span></div>
    <div class="meta-item"><strong>Período Analisado:</strong> <span>${periodLabel}</span></div>
    <div class="meta-item"><strong>E-mail de Cadastro:</strong> <span>${user.email}</span></div>
    <div class="meta-item"><strong>Total de Check-ins:</strong> <span>${totalCheckinsAll} registros</span></div>
  </div>

  ${
    options.includeStats
      ? `
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-val">${totalCheckinsAll}</div>
      <div class="stat-lbl">Check-ins Totais</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${avgMoodAll} <span style="font-size:12px;color:#667775">/5</span></div>
      <div class="stat-lbl">Humor Médio</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${avgAnxietyAll} <span style="font-size:12px;color:#667775">/10</span></div>
      <div class="stat-lbl">Ansiedade Média</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">${completedPracticesSum}</div>
      <div class="stat-lbl">Práticas Concluídas</div>
    </div>
  </div>`
      : ''
  }

  <!-- Seções de Meses em Ordem Cronológica -->
  ${monthGroups
    .map((group) => {
      const hasRecords = group.records.length > 0;
      const groupAvgMood = hasRecords
        ? (group.records.reduce((acc, r) => acc + r.mood, 0) / group.records.length).toFixed(1)
        : '0.0';
      const groupAvgAnxiety = hasRecords
        ? (
            group.records.reduce((acc, r) => acc + (r.anxietyLevel || 0), 0) / group.records.length
          ).toFixed(1)
        : '0.0';

      return `
    <div class="month-section">
      <div class="month-title">📅 ${group.label} ${
        hasRecords
          ? `<span style="font-size:12px;font-weight:normal;color:#567571;margin-left:8px;">(${group.records.length} check-ins • Humor Médio: ${groupAvgMood}/5 • Ansiedade Média: ${groupAvgAnxiety}/10)</span>`
          : ''
      }</div>

      ${
        !hasRecords
          ? `<div class="empty-month-box">Nenhum registro disponível para este período.</div>`
          : `
      <table>
        <thead>
          <tr>
            <th style="width:18%">Data / Hora</th>
            <th style="width:12%">Humor</th>
            <th style="width:14%">Ansiedade</th>
            ${options.includeEmotions ? '<th>Emoções & Sintomas</th>' : ''}
            ${options.includeNotes ? '<th style="width:28%">Observações do Usuário</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${group.records
            .map(
              (rec) => `
            <tr>
              <td>${formatDate(rec.createdAt)}</td>
              <td><span class="badge badge-mood">${rec.mood}/5</span></td>
              <td><span class="badge badge-anxiety">${rec.anxietyLevel || 0}/10</span></td>
              ${
                options.includeEmotions
                  ? `<td>${(rec.emotions || []).join(', ') || 'Nenhum sintoma assinalado'}</td>`
                  : ''
              }
              ${options.includeNotes ? `<td>${rec.notes || '—'}</td>` : ''}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>`
      }
    </div>
    `;
    })
    .join('')}

  ${
    options.includePractices && practices.length > 0
      ? `
  <div class="section-title">🌿 Práticas de Respiração e Relaxamento Realizadas</div>
  <table>
    <thead>
      <tr>
        <th>Nome da Prática</th>
        <th>Categoria</th>
        <th>Duração</th>
        <th>Total Concluído</th>
      </tr>
    </thead>
    <tbody>
      ${practices
        .map(
          (p) => `
        <tr>
          <td><strong>${p.title}</strong></td>
          <td>${p.subtitle || p.category}</td>
          <td>${p.durationMinutes} minutos</td>
          <td><strong>${p.completedCount || 0} vezes</strong></td>
        </tr>
      `
        )
        .join('')}
    </tbody>
  </table>`
      : ''
  }

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
        }, 350);
      }
    }
  }
}

export const pdfReportService = new PdfReportService();
