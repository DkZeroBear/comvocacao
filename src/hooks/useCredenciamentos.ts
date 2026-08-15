import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { setorLabel } from "@/components/CredenciamentoForm";

export type Row = {
  id: string;
  created_at: string;
  tipo: string;
  setor: string | null;
  dias: string[];
  responsavel_nome: string;
  responsavel_whatsapp: string;
  nome_banda: string | null;
  horario_chegada: string | null;
  quantidade_pessoas: number;
  observacoes: string | null;
  eh_produtor: boolean | null;
  pode_contatar: boolean | null;
  membros: { nome: string; funcao: string }[];
  veiculos: { marca_modelo: string; cor: string; placa: string }[];
};

export const tipoKey = (
  r: Row
): "equipe" | "banda" | "prefeitura" | "comissao" | "outro" => {
  if (r.tipo === "Banda / Artista") return "banda";
  if (r.tipo === "Equipe") return "equipe";
  if (r.tipo === "Prefeitura / Convidados") return "prefeitura";
  if (r.tipo === "Comissão Organizadora") return "comissao";
  return "outro";
};

export const inDia = (r: Row, dia: string) =>
  (r.dias || []).some((d) => d.includes(dia) || d.toLowerCase().includes("ambos"));

export function useCredenciamentos() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroDia, setFiltroDia] = useState("todos");

  useEffect(() => {
    let active = true;

    const load = async (userId: string) => {
      const [{ data: roleData }, { data, error }] = await Promise.all([
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle(),
        supabase.from("credenciamentos").select("*").order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      if (!roleData) {
        toast.error("Acesso negado. Sua conta não tem permissão de admin.");
        await supabase.auth.signOut();
        navigate({ to: "/login" });
        return;
      }

      if (error) toast.error("Erro ao carregar credenciamentos");
      setRows((data as unknown as Row[]) || []);
      setLoading(false);
      setAuthChecked(true);
    };

    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        navigate({ to: "/login" });
        return;
      }
      load(data.user.id);
    });

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  const handleDelete = async (r: Row) => {
    const nome = r.nome_banda || r.responsavel_nome;
    if (!window.confirm(`Excluir cadastro de ${nome}?`)) return;
    const { error } = await supabase.from("credenciamentos").delete().eq("id", r.id);
    if (error) {
      toast.error("Erro ao excluir cadastro");
      return;
    }
    setRows((prev) => prev.filter((x) => x.id !== r.id));
    toast.success("Cadastro excluído");
  };

  const { totalEquipe, totalBanda, totalPrefeitura, totalComissao, countDia, totalVeiculos } =
    useMemo(() => {
      const totalEquipe = rows.filter((r) => tipoKey(r) === "equipe").length;
      const totalBanda = rows.filter((r) => tipoKey(r) === "banda").length;
      const totalPrefeitura = rows.filter((r) => tipoKey(r) === "prefeitura").length;
      const totalComissao = rows.filter((r) => tipoKey(r) === "comissao").length;
      const countDia = (dia: string) => rows.filter((r) => inDia(r, dia)).length;
      const totalVeiculos = rows.reduce((acc, r) => acc + (r.veiculos?.length || 0), 0);
      return { totalEquipe, totalBanda, totalPrefeitura, totalComissao, countDia, totalVeiculos };
    }, [rows]);

  const duplicatesById = useMemo(() => buildDuplicatesMap(rows), [rows]);



  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filtroTipo !== "todos" && tipoKey(r) !== filtroTipo) return false;
      if (filtroDia !== "todos" && !inDia(r, filtroDia)) return false;
      const q = busca.trim().toLowerCase();
      if (!q) return true;
      const haystack = [
        r.responsavel_nome,
        r.nome_banda || "",
        ...(r.membros || []).map((m) => m.nome),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, busca, filtroTipo, filtroDia]);

  const exportPdf = async () => {
    try {
      const { exportConvocacaoPdf } = await import("@/lib/pdf-export");
      await exportConvocacaoPdf(rows);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF");
    }
  };

  const exportContatos = async () => {
    if (
      !window.confirm(
        "Este documento contém todos os telefones de contato. Distribua apenas para a coordenação. Deseja continuar?"
      )
    )
      return;
    try {
      const { exportContatosPdf } = await import("@/lib/pdf-export");
      await exportContatosPdf(rows);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF de contatos");
    }
  };

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const main = rows.map((r) => ({
      ID: r.id,
      "Data de envio": new Date(r.created_at).toLocaleString("pt-BR"),
      Tipo: r.tipo,
      Setor: setorLabel(r.setor),
      "Dias de presença": (r.dias || []).join(", "),
      "Responsável - Nome": r.responsavel_nome,
      "Responsável - WhatsApp": r.responsavel_whatsapp,
      "É produtor(a)": r.eh_produtor === null ? "" : r.eh_produtor ? "Sim" : "Não",
      "Pode contatar": r.pode_contatar === null ? "" : r.pode_contatar ? "Sim" : "Não",
      "Nome da banda/artista": r.nome_banda || "",
      "Horário de chegada": r.horario_chegada || "",
      "Qtd. estimada de pessoas": r.quantidade_pessoas,
      Observações: r.observacoes || "",
      "Qtd. membros": r.membros?.length || 0,
      "Qtd. veículos": r.veiculos?.length || 0,
    }));

    const membros = rows.flatMap((r) =>
      (r.membros || []).map((m, i) => ({
        "ID Credenciamento": r.id,
        Tipo: r.tipo,
        "Banda/Responsável": r.nome_banda || r.responsavel_nome,
        "Membro #": i + 1,
        Nome: m.nome,
        "Função / Cargo": m.funcao,
      }))
    );

    const veiculos = rows.flatMap((r) =>
      (r.veiculos || []).map((v, i) => ({
        "ID Credenciamento": r.id,
        "Banda/Artista": r.nome_banda || r.responsavel_nome,
        "Veículo #": i + 1,
        "Marca / Modelo": v.marca_modelo,
        Cor: v.cor,
        Placa: v.placa,
      }))
    );

    const consolidado = rows.map((r) => {
      const membrosTxt = (r.membros || [])
        .map((m, i) => `${i + 1}. ${m.nome} (${m.funcao})`)
        .join(" | ");
      const veiculosTxt = (r.veiculos || [])
        .map((v, i) => `${i + 1}. ${v.marca_modelo} - ${v.cor} - ${v.placa}`)
        .join(" | ");
      return {
        ID: r.id,
        "Data de envio": new Date(r.created_at).toLocaleString("pt-BR"),
        Tipo: r.tipo,
        Setor: setorLabel(r.setor),
        "Dias de presença": (r.dias || []).join(", "),
        "Responsável - Nome": r.responsavel_nome,
        "Responsável - WhatsApp": r.responsavel_whatsapp,
        "É produtor(a)": r.eh_produtor === null ? "" : r.eh_produtor ? "Sim" : "Não",
        "Pode contatar": r.pode_contatar === null ? "" : r.pode_contatar ? "Sim" : "Não",
        "Nome da banda/artista": r.nome_banda || "",
        "Horário de chegada": r.horario_chegada || "",
        "Qtd. estimada de pessoas": r.quantidade_pessoas,
        Observações: r.observacoes || "",
        "Qtd. membros": r.membros?.length || 0,
        Membros: membrosTxt,
        "Qtd. veículos": r.veiculos?.length || 0,
        Veículos: veiculosTxt,
      };
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(consolidado), "Tudo Consolidado");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(main), "Credenciamentos");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membros), "Membros");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(veiculos), "Veículos");

    XLSX.writeFile(
      wb,
      `credenciamentos-comvocacao-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return {
    rows,
    filtered,
    loading,
    authChecked,
    busca,
    setBusca,
    filtroTipo,
    setFiltroTipo,
    filtroDia,
    setFiltroDia,
    totalEquipe,
    totalBanda,
    totalPrefeitura,
    totalComissao,
    countDia,
    totalVeiculos,
    handleLogout,
    handleDelete,
    exportXlsx,
    exportPdf,
    exportContatos,
  };
}
