import { MoodRecord, User, Practice } from '../../types';
import { formatDate, formatDateTime } from '../../utils/date';
import { Platform } from 'react-native';

export interface ReportOptions {
  month?: number; // 0-11
  year?: number;
  allMonths?: boolean;
  includeMoodSummary?: boolean;
  includeSymptoms?: boolean;
  includePractices?: boolean;
  includeDiaryNotes?: boolean;
  // Aliases de retrocompatibilidade:
  includeStats?: boolean;
  includeEmotions?: boolean;
  includeNotes?: boolean;
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export class PdfReportService {
  generateHtmlReport(
    user: User,
    records: MoodRecord[],
    practices: Practice[],
    options: ReportOptions
  ): string {
    const isSingleMonth = !options.allMonths && options.month !== undefined && options.year !== undefined;

    // Normalizar opções
    const showMoodSummary = options.includeMoodSummary ?? options.includeStats ?? true;
    const showSymptoms = options.includeSymptoms ?? options.includeEmotions ?? true;
    const showPractices = options.includePractices ?? true;
    const showDiaryNotes = options.includeDiaryNotes ?? options.includeNotes ?? false;

    type MonthGroup = {
      monthKey: string;
      monthIndex: number;
      year: number;
      label: string;
      records: MoodRecord[];
    };

    const monthGroups: MonthGroup[] = [];

    if (isSingleMonth && options.month !== undefined && options.year !== undefined) {
      // Primeiro dia do mês às 00:00:00.000
      const startOfMonth = new Date(options.year, options.month, 1, 0, 0, 0, 0).getTime();
      // Primeiro dia do próximo mês às 00:00:00.000 (calcula automaticamente anos bissextos em Fev)
      const startOfNextMonth = new Date(options.year, options.month + 1, 1, 0, 0, 0, 0).getTime();

      const filtered = records
        .filter((r) => {
          const t = new Date(r.createdAt).getTime();
          return t >= startOfMonth && t < startOfNextMonth;
        })
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      monthGroups.push({
        monthKey: `${options.year}-${options.month}`,
        monthIndex: options.month,
        year: options.year,
        label: `${MONTH_NAMES[options.month]} de ${options.year}`,
        records: filtered,
      });
    } else {
      // Histórico Completo: agrupado cronologicamente por mês
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

    // Totais calculados
    const totalRecordsFiltered = monthGroups.reduce((acc, g) => acc + g.records.length, 0);
    const allFilteredRecords = monthGroups.flatMap((g) => g.records);

    const avgMood =
      totalRecordsFiltered > 0
        ? (allFilteredRecords.reduce((acc, r) => acc + r.mood, 0) / totalRecordsFiltered).toFixed(1)
        : '0.0';

    const avgAnxiety =
      totalRecordsFiltered > 0
        ? (
            allFilteredRecords.reduce((acc, r) => acc + (r.anxietyLevel || 0), 0) /
            totalRecordsFiltered
          ).toFixed(1)
        : '0.0';

    const completedPracticesSum = practices.reduce(
      (acc, p) => acc + (p.completedCount || 0),
      0
    );

    const periodLabel =
      isSingleMonth && options.month !== undefined && options.year !== undefined
        ? `${MONTH_NAMES[options.month]} de ${options.year}`
        : monthGroups.length > 1
        ? `${monthGroups[0].label} a ${monthGroups[monthGroups.length - 1].label}`
        : monthGroups[0]?.label || 'Histórico Completo';

    const userName = user.name || 'Usuário';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório de Acompanhamento • Respira</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      padding: 40px 48px;
      color: #17332F;
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 13px;
    }
    .header {
      border-bottom: 2px solid #247B74;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo-area {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 800;
      color: #247B74;
      letter-spacing: -0.5px;
    }
    .doc-title {
      font-size: 14px;
      color: #5F706C;
      font-weight: 600;
      margin-top: 4px;
    }
    .emission-info {
      text-align: right;
      font-size: 11px;
      color: #8C9E9B;
    }
    .emission-info strong {
      color: #17332F;
    }
    .meta-box {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      background: #F8FAF9;
      border: 1px solid #DDE6E3;
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 24px;
    }
    .meta-item {
      font-size: 12px;
    }
    .meta-item strong {
      color: #5F706C;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.3px;
    }
    .meta-item span {
      color: #17332F;
      font-weight: 600;
      margin-left: 6px;
      font-size: 13px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 28px;
    }
    .stat-card {
      background: #F8FAF9;
      border: 1px solid #DDE6E3;
      border-radius: 10px;
      padding: 14px 10px;
      text-align: center;
    }
    .stat-number {
      font-size: 24px;
      font-weight: 800;
      color: #247B74;
    }
    .stat-label {
      font-size: 11px;
      color: #5F706C;
      text-transform: uppercase;
      font-weight: 700;
      margin-top: 4px;
      letter-spacing: 0.3px;
    }
    .month-section {
      margin-bottom: 32px;
      page-break-inside: avoid;
    }
    .month-header {
      font-size: 15px;
      font-weight: 700;
      color: #17332F;
      border-left: 4px solid #247B74;
      padding: 6px 12px;
      background: #EAF7F3;
      border-radius: 0 8px 8px 0;
      margin-bottom: 14px;
    }
    .month-header-sub {
      font-size: 12px;
      font-weight: normal;
      color: #5F706C;
      margin-left: 8px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 12px;
    }
    th {
      background: #EAF7F3;
      color: #17332F;
      text-align: left;
      padding: 9px 12px;
      border: 1px solid #DDE6E3;
      font-weight: 700;
    }
    td {
      padding: 9px 12px;
      border: 1px solid #DDE6E3;
      vertical-align: top;
    }
    tr:nth-child(even) td {
      background: #FAFCFB;
    }
    .badge {
      display: inline-block;
      padding: 3px 7px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
    }
    .badge-mood {
      background: #EAF7F3;
      color: #176B61;
    }
    .badge-anxiety {
      background: #FFF3EB;
      color: #C85A32;
    }
    .empty-box {
      border: 1px dashed #B8CDC8;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      color: #5F706C;
      font-style: italic;
      background: #F8FAF9;
      margin-bottom: 16px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #17332F;
      border-left: 3px solid #247B74;
      padding-left: 10px;
      margin-top: 24px;
      margin-bottom: 12px;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #DDE6E3;
      font-size: 11px;
      color: #708885;
      text-align: center;
      line-height: 1.6;
    }
    @media print {
      body { padding: 12px; }
      @page { margin: 1.2cm; }
    }
  </style>
</head>
<body>
  <!-- Cabeçalho -->
  <div class="header">
    <div class="logo-area">
      <div class="brand-title">🌿 Respira</div>
      <div class="doc-title">Relatório de acompanhamento</div>
    </div>
    <div class="emission-info">
      Data de geração: <strong>${formatDateTime(new Date().toISOString())}</strong>
    </div>
  </div>

  <!-- Metadados -->
  <div class="meta-box">
    <div class="meta-item"><strong>Usuário:</strong> <span>${userName}</span></div>
    <div class="meta-item"><strong>Período:</strong> <span>${periodLabel}</span></div>
    <div class="meta-item"><strong>E-mail:</strong> <span>${user.email || '—'}</span></div>
    <div class="meta-item"><strong>Registros:</strong> <span>${totalRecordsFiltered} ${totalRecordsFiltered === 1 ? 'registro' : 'registros'}</span></div>
  </div>

  <!-- Resumo Estatístico de Humor e Ansiedade -->
  ${
    showMoodSummary
      ? `
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-number">${totalRecordsFiltered}</div>
      <div class="stat-label">Check-ins</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${avgMood}<span style="font-size:13px;color:#5F706C">/5</span></div>
      <div class="stat-label">Humor Médio</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${avgAnxiety}<span style="font-size:13px;color:#5F706C">/10</span></div>
      <div class="stat-label">Ansiedade Média</div>
    </div>
    <div class="stat-card">
      <div class="stat-number">${completedPracticesSum}</div>
      <div class="stat-label">Práticas Realizadas</div>
    </div>
  </div>`
      : ''
  }

  <!-- Registros por Mês -->
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
      <div class="month-header">
        📅 ${group.label}
        ${
          hasRecords && showMoodSummary
            ? `<span class="month-header-sub">(${group.records.length} check-in(s) • Humor: ${groupAvgMood}/5 • Ansiedade: ${groupAvgAnxiety}/10)</span>`
            : ''
        }
      </div>

      ${
        !hasRecords
          ? `<div class="empty-box">Não houve registros neste período.</div>`
          : `
      <table>
        <thead>
          <tr>
            <th style="width:20%">Data / Hora</th>
            ${showMoodSummary ? '<th style="width:14%">Humor</th><th style="width:14%">Ansiedade</th>' : ''}
            ${showSymptoms ? '<th>Sintomas & Emoções</th>' : ''}
            ${showDiaryNotes ? '<th style="width:30%">Anotações do Diário</th>' : ''}
          </tr>
        </thead>
        <tbody>
          ${group.records
            .map(
              (rec) => `
            <tr>
              <td>${formatDate(rec.createdAt)}</td>
              ${
                showMoodSummary
                  ? `<td><span class="badge badge-mood">${rec.mood}/5</span></td>
                     <td><span class="badge badge-anxiety">${rec.anxietyLevel || 0}/10</span></td>`
                  : ''
              }
              ${
                showSymptoms
                  ? `<td>${(rec.emotions || []).join(', ') || 'Nenhum sintoma assinalado'}</td>`
                  : ''
              }
              ${showDiaryNotes ? `<td>${rec.notes || '—'}</td>` : ''}
            </tr>`
            )
            .join('')}
        </tbody>
      </table>`
      }
    </div>`;
    })
    .join('')}

  <!-- Práticas Realizadas -->
  ${
    showPractices && practices.length > 0
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
        </tr>`
        )
        .join('')}
    </tbody>
  </table>`
      : ''
  }

  <!-- Rodapé -->
  <div class="footer">
    Este documento possui finalidade informativa e de acompanhamento pessoal. Ele não representa diagnóstico médico ou psicológico e não substitui avaliação, diagnóstico ou acompanhamento profissional de saúde.
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
