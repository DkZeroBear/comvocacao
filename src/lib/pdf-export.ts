import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logoAsset from "@/assets/comvocacao-logo-2026.png.asset.json";

export type Membro = { nome: string; funcao: string; whatsapp?: string };
export type Veiculo = { marca_modelo: string; cor: string; placa: string };

export type Credenciamento = {
  id: string;
  created_at: string;
  tipo: string;
  setor?: string | null;
  dias: string[];
  responsavel_nome: string;
  responsavel_whatsapp: string;
  nome_banda: string | null;
  horario_chegada: string | null;
  quantidade_pessoas: number;
  observacoes: string | null;
  eh_produtor: boolean | null;
  pode_contatar: boolean | null;
  membros: Membro[];
  veiculos: Veiculo[];
};

// Paleta
const COLOR_TITLE = "#1E1208";
const COLOR_SUBTITLE = "#5C4A2A";
const COLOR_LABEL = "#8C7A5A";
const COLOR_TEXT = "#3D2E14";
const COLOR_BORDER = "#C8BC9E";
const COLOR_HEADER_BG = "#F7F2E8";

const DAYS = ["Dia 15", "Dia 16"] as const;
type Day = (typeof DAYS)[number];

function isInDay(r: Credenciamento, day: Day): boolean {
  const dias = r.dias || [];
  if (dias.includes("Ambos os dias")) return true;
  return dias.includes(day);
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch(logoAsset.url);
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawHeader(
  doc: jsPDF,
  logo: string | null,
  title: string,
  subtitle: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerHeight = 22;

  // Fundo do header
  doc.setFillColor(COLOR_HEADER_BG);
  doc.rect(margin, 10, pageWidth - margin * 2, headerHeight, "F");
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(margin, 10, pageWidth - margin * 2, headerHeight, "S");

  // Logo
  if (logo) {
    try {
      doc.addImage(logo, "PNG", margin + 3, 12, 18, 18);
    } catch {
      /* ignore */
    }
  }

  // Título e subtítulo (à direita)
  doc.setTextColor(COLOR_TITLE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, pageWidth - margin - 3, 19, { align: "right" });

  doc.setTextColor(COLOR_SUBTITLE);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(subtitle, pageWidth - margin - 3, 27, { align: "right" });
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setTextColor(COLOR_TITLE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(text, 14, y);
  doc.setDrawColor(COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.line(14, y + 1.5, doc.internal.pageSize.getWidth() - 14, y + 1.5);
  return y + 7;
}

function ensureSpace(doc: jsPDF, y: number, needed: number, redrawHeader: () => void): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 15) {
    doc.addPage();
    redrawHeader();
    return 40;
  }
  return y;
}

function rgbFromHex(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function tableTheme() {
  return {
    theme: "grid" as const,
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: rgbFromHex(COLOR_TEXT),
      lineColor: rgbFromHex(COLOR_BORDER),
      lineWidth: 0.2,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: rgbFromHex(COLOR_HEADER_BG),
      textColor: rgbFromHex(COLOR_TITLE),
      fontStyle: "bold" as const,
      lineColor: rgbFromHex(COLOR_BORDER),
      lineWidth: 0.2,
    },
  };
}

const SETORES_PDF: Array<{ value: string; label: string }> = [
  { value: "palco", label: "Equipe Palco" },
  { value: "camarim", label: "Equipe Camarim" },
  { value: "tecnica", label: "Equipe Técnica" },
  { value: "press", label: "Equipe Press" },
];

const getFinalY = (doc: jsPDF) =>
  (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

/**
 * Renderiza um grupo de registros (equipe/setor, prefeitura, comissão):
 * tabela de membros + veículos + qtd. estimada x cadastrada + observações.
 * `funcaoHeader` = null omite a coluna de função/cargo.
 */
function renderGrupo(
  doc: jsPDF,
  yStart: number,
  drawHead: () => void,
  label: string,
  registros: Credenciamento[],
  funcaoHeader: string | null
): number {
  let y = ensureSpace(doc, yStart, 20, drawHead);
  y = sectionTitle(doc, label, y);

  const membrosBody = registros.flatMap((r) =>
    (r.membros || []).map((m) =>
      funcaoHeader ? [m.nome || "—", m.funcao || "—"] : [m.nome || "—"]
    )
  );
  if (membrosBody.length > 0) {
    autoTable(doc, {
      ...tableTheme(),
      startY: y,
      head: [funcaoHeader ? ["Nome completo", funcaoHeader] : ["Nome completo"]],
      body: membrosBody,
      margin: { left: 14, right: 14 },
      didDrawPage: drawHead,
    });
    y = getFinalY(doc) + 6;
  }

  const veics = registros.flatMap((r) => r.veiculos || []);
  if (veics.length > 0) {
    y = ensureSpace(doc, y, 18, drawHead);
    autoTable(doc, {
      ...tableTheme(),
      startY: y,
      head: [["Marca / Modelo", "Cor", "Placa"]],
      body: veics.map((v) => [v.marca_modelo || "—", v.cor || "—", v.placa || "—"]),
      margin: { left: 14, right: 14 },
      didDrawPage: drawHead,
    });
    y = getFinalY(doc) + 6;
  }

  // Quantidade estimada x cadastrada
  y = ensureSpace(doc, y, 8, drawHead);
  const qtdEst = registros.reduce((a, r) => a + (r.quantidade_pessoas ?? 0), 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_LABEL);
  doc.text("Qtd. estimada:", 16, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT);
  doc.text(String(qtdEst), 46, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(COLOR_LABEL);
  doc.text("Qtd. cadastrada:", 84, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(COLOR_TEXT);
  doc.text(String(membrosBody.length), 119, y);
  y += 6;

  // Observações
  const obs = registros
    .map((r) => r.observacoes?.trim())
    .filter(Boolean)
    .join(" | ");
  if (obs) {
    y = ensureSpace(doc, y, 12, drawHead);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_LABEL);
    doc.text("Observações / Restrições alimentares:", 16, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT);
    const obsLines = doc.splitTextToSize(obs, doc.internal.pageSize.getWidth() - 32);
    y = ensureSpace(doc, y, obsLines.length * 4 + 4, drawHead);
    doc.text(obsLines, 16, y);
    y += obsLines.length * 4;
  }
  return y + 6;
}

function renderOrganizationView(
  doc: jsPDF,
  logo: string | null,
  day: Day,
  rows: Credenciamento[]
) {
  const dayRows = rows.filter((r) => isInDay(r, day));
  const equipes = dayRows.filter((r) => r.tipo === "Equipe");
  const bandas = dayRows.filter((r) => r.tipo === "Banda / Artista");
  const prefeitura = dayRows.filter((r) => r.tipo === "Prefeitura / Convidados");
  const comissao = dayRows.filter((r) => r.tipo === "Comissão Organizadora");

  const drawHead = () =>
    drawHeader(doc, logo, "ComVocação", day);

  drawHead();
  let y = 40;

  // Equipes agrupadas por setor
  const semSetor = equipes.filter((r) => !r.setor);
  const grupos = [
    ...SETORES_PDF.map((s) => ({
      label: s.label,
      registros: equipes.filter((r) => r.setor === s.value),
    })),
    { label: "Equipe (setor não informado)", registros: semSetor },
  ].filter((g) => g.registros.length > 0);

  for (const grupo of grupos) {
    y = renderGrupo(doc, y, drawHead, grupo.label, grupo.registros, "Função");
  }





  // Bandas / Artistas
  y = ensureSpace(doc, y, 12, drawHead);
  y = sectionTitle(doc, "Bandas / Artistas", y);

  if (bandas.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(COLOR_LABEL);
    doc.text("Nenhuma banda/artista cadastrada para este dia.", 14, y);
  }

  for (const b of bandas) {
    y = ensureSpace(doc, y, 50, drawHead);

    // Bloco da banda
    const pageWidth = doc.internal.pageSize.getWidth();
    const blockX = 14;
    const blockW = pageWidth - 28;

    // Título da banda
    doc.setFillColor(COLOR_HEADER_BG);
    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(0.3);
    doc.rect(blockX, y, blockW, 8, "FD");
    doc.setTextColor(COLOR_TITLE);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(b.nome_banda || "—", blockX + 3, y + 5.5);
    y += 11;

    // Info da banda — labels + values
    const infoLines: Array<[string, string]> = [
      ["Horário de chegada", b.horario_chegada || "—"],
      ["Responsável", b.responsavel_nome || "—"],
      ["WhatsApp", b.responsavel_whatsapp || "—"],
      [
        "É produtor(a)",
        b.eh_produtor === null ? "—" : b.eh_produtor ? "Sim" : "Não",
      ],
      [
        "Pode ser contatado",
        b.pode_contatar === null ? "—" : b.pode_contatar ? "Sim" : "Não",
      ],
    ];
    doc.setFontSize(9);
    for (const [label, value] of infoLines) {
      y = ensureSpace(doc, y, 5, drawHead);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(COLOR_LABEL);
      doc.text(`${label}:`, blockX + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(COLOR_TEXT);
      doc.text(value, blockX + 42, y);
      y += 5;
    }

    // Quantidade estimada x cadastrados (lado a lado)
    y = ensureSpace(doc, y, 7, drawHead);
    const qtdEst = b.quantidade_pessoas ?? 0;
    const qtdCad = (b.membros || []).length;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_LABEL);
    doc.text("Qtd. estimada:", blockX + 2, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT);
    doc.text(String(qtdEst), blockX + 32, y);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(COLOR_LABEL);
    doc.text("Qtd. cadastrada:", blockX + 70, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT);
    doc.text(String(qtdCad), blockX + 105, y);
    y += 6;

    // Tabela de membros
    if ((b.membros || []).length > 0) {
      y = ensureSpace(doc, y, 18, drawHead);
      autoTable(doc, {
        ...tableTheme(),
        startY: y,
        head: [["Nome completo", "Função"]],
        body: b.membros.map((m) => [m.nome || "—", m.funcao || "—"]),
        margin: { left: blockX, right: 14 },
        tableWidth: blockW,
        didDrawPage: drawHead,
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    }

    // Tabela de veículos
    if ((b.veiculos || []).length > 0) {
      y = ensureSpace(doc, y, 18, drawHead);
      autoTable(doc, {
        ...tableTheme(),
        startY: y,
        head: [["Marca / Modelo", "Cor", "Placa"]],
        body: b.veiculos.map((v) => [
          v.marca_modelo || "—",
          v.cor || "—",
          v.placa || "—",
        ]),
        margin: { left: blockX, right: 14 },
        tableWidth: blockW,
        didDrawPage: drawHead,
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
    }

    // Observações / restrições alimentares
    y = ensureSpace(doc, y, 12, drawHead);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(COLOR_LABEL);
    doc.text("Observações / Restrições alimentares:", blockX + 2, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(COLOR_TEXT);
    const obsText = b.observacoes?.trim() || "—";
    const lines = doc.splitTextToSize(obsText, blockW - 4);
    y = ensureSpace(doc, y, lines.length * 4 + 4, drawHead);
    doc.text(lines, blockX + 2, y);
    y += lines.length * 4 + 6;

    // Linha separadora entre bandas
    doc.setDrawColor(COLOR_BORDER);
    doc.setLineWidth(0.2);
    doc.line(blockX, y, blockX + blockW, y);
    y += 6;
  }

  // Prefeitura / Convidados
  if (prefeitura.length > 0) {
    y = renderGrupo(doc, y, drawHead, "Prefeitura / Convidados", prefeitura, "Cargo");
  }

  // Comissão Organizadora
  if (comissao.length > 0) {
    y = renderGrupo(doc, y, drawHead, "Comissão Organizadora", comissao, null);
  }
}


function renderSecurityView(
  doc: jsPDF,
  logo: string | null,
  day: Day,
  rows: Credenciamento[]
) {
  const drawHead = () =>
    drawHeader(doc, logo, "ComVocação — Controle de Acesso", day);

  doc.addPage();
  drawHead();

  type Person = {
    nome: string;
    funcao: string;
    grupo: string;
  };

  const people: Person[] = [];
  for (const r of rows.filter((r) => isInDay(r, day))) {
    const grupo =
      r.tipo === "Banda / Artista"
        ? r.nome_banda || "Banda / Artista"
        : r.tipo === "Equipe"
          ? SETORES_PDF.find((s) => s.value === r.setor)?.label || "Equipe"
          : r.tipo === "Prefeitura / Convidados"
            ? "Prefeitura / Convidados"
            : r.tipo === "Comissão Organizadora"
              ? "Comissão Organizadora"
              : r.tipo || "—";

    for (const m of r.membros || []) {
      people.push({
        nome: m.nome || "—",
        funcao: m.funcao || "—",
        grupo,
      });
    }
  }

  people.sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );

  const body = people.map((p) => [p.nome, p.funcao, p.grupo, ""]);

  autoTable(doc, {
    ...tableTheme(),
    startY: 40,
    head: [["Nome completo", "Função", "Banda / Equipe", "Credenciado"]],
    body: body.length
      ? body
      : [["—", "—", "—", ""]],
    styles: {
      ...tableTheme().styles,
      fontSize: 11,
      cellPadding: 4,
      minCellHeight: 9,
    },
    headStyles: {
      ...tableTheme().headStyles,
      fontSize: 11,
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 45 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 25, halign: "center" },
    },
    didParseCell: (data) => {
      // Quadrado de checkbox na coluna "Credenciado"
      if (data.section === "body" && data.column.index === 3) {
        data.cell.text = [];
      }
    },
    didDrawCell: (data) => {
      if (data.section === "body" && data.column.index === 3) {
        const size = 5;
        const cx = data.cell.x + data.cell.width / 2 - size / 2;
        const cy = data.cell.y + data.cell.height / 2 - size / 2;
        doc.setDrawColor(COLOR_TEXT);
        doc.setLineWidth(0.4);
        doc.rect(cx, cy, size, size, "S");
      }
    },
    margin: { left: 14, right: 14, top: 40 },
    didDrawPage: drawHead,
  });
}

export async function exportConvocacaoPdf(rows: Credenciamento[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const logo = await loadLogoDataUrl();

  // Dia 15 — Organização
  renderOrganizationView(doc, logo, "Dia 15", rows);
  // Dia 15 — Segurança
  renderSecurityView(doc, logo, "Dia 15", rows);

  // Dia 16 — Organização
  doc.addPage();
  renderOrganizationView(doc, logo, "Dia 16", rows);
  // Dia 16 — Segurança
  renderSecurityView(doc, logo, "Dia 16", rows);

  doc.save("credenciamento-comvocacao.pdf");
}
