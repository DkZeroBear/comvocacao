import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft, LogOut, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import * as XLSX from "xlsx";
import { exportConvocacaoPdf } from "@/lib/pdf-export";

export const Route = createFileRoute("/admin/")({
  component: Admin,
});

type Row = {
  id: string;
  created_at: string;
  tipo: string;
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

function Admin() {
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
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!active) return;

      if (!roleData) {
        toast.error("Acesso negado. Sua conta não tem permissão de admin.");
        await supabase.auth.signOut();
        navigate({ to: "/login" });
        return;
      }

      const { data, error } = await supabase
        .from("credenciamentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;
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

  const isBanda = (r: Row) => (r.tipo || "").toLowerCase().includes("banda");
  const inDia = (r: Row, dia: string) =>
    (r.dias || []).some((d) => d.includes(dia) || d.toLowerCase().includes("ambos"));

  const totalEquipe = rows.filter((r) => !isBanda(r)).length;
  const totalBanda = rows.filter((r) => isBanda(r)).length;
  const countDia = (dia: string) => rows.filter((r) => inDia(r, dia)).length;
  const totalVeiculos = rows.reduce((acc, r) => acc + (r.veiculos?.length || 0), 0);

  const filtered = rows.filter((r) => {
    if (filtroTipo === "equipe" && isBanda(r)) return false;
    if (filtroTipo === "banda" && !isBanda(r)) return false;
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



  const exportXlsx = () => {
    const main = rows.map((r) => ({
      ID: r.id,
      "Data de envio": new Date(r.created_at).toLocaleString("pt-BR"),
      Tipo: r.tipo,
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
        Função: m.funcao,
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

    // Aba consolidada: uma linha por credenciamento contendo TUDO
    const consolidado = rows.map((r) => {
      const membrosTxt = (r.membros || [])
        .map((m, i) => `${i + 1}. ${m.nome} (${m.funcao})`)
        .join(" | ");
      const veiculosTxt = (r.veiculos || [])
        .map(
          (v, i) =>
            `${i + 1}. ${v.marca_modelo} - ${v.cor} - ${v.placa}`
        )
        .join(" | ");
      return {
        ID: r.id,
        "Data de envio": new Date(r.created_at).toLocaleString("pt-BR"),
        Tipo: r.tipo,
        "Dias de presença": (r.dias || []).join(", "),
        "Responsável - Nome": r.responsavel_nome,
        "Responsável - WhatsApp": r.responsavel_whatsapp,
        "É produtor(a)":
          r.eh_produtor === null ? "" : r.eh_produtor ? "Sim" : "Não",
        "Pode contatar":
          r.pode_contatar === null ? "" : r.pode_contatar ? "Sim" : "Não",
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
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(consolidado),
      "Tudo Consolidado"
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(main), "Credenciamentos");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membros), "Membros");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(veiculos), "Veículos");

    XLSX.writeFile(
      wb,
      `credenciamentos-comvocacao-${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  if (!authChecked) {
    return (
      <div className="dark min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Verificando acesso...</p>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <Toaster richColors theme="dark" />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Link>
            <h1 className="text-2xl font-bold">Credenciamentos recebidos</h1>
            <p className="text-sm text-muted-foreground">
              {filtered.length !== rows.length
                ? `${filtered.length} de ${rows.length} credenciamentos`
                : `${rows.length} ${rows.length === 1 ? "credenciamento" : "credenciamentos"}`}{" "}
              · {totalEquipe} Equipe · {totalBanda} Banda · Dia 15: {countDia("15")} · Dia 16:{" "}
              {countDia("16")} · Qtd. veículos: {totalVeiculos}
            </p>

          </div>
          <div className="flex gap-2">
            <Button onClick={exportXlsx} disabled={!rows.length}>
              <Download className="w-4 h-4 mr-2" /> Exportar Excel
            </Button>
            <Button
              onClick={async () => {
                try {
                  await exportConvocacaoPdf(rows);
                } catch (e) {
                  console.error(e);
                  toast.error("Erro ao gerar PDF");
                }
              }}
              disabled={!rows.length}
            >
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por responsável, banda ou membro..."
            className="flex-1 min-w-[220px] h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            aria-label="Filtrar por tipo"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todos">Todos os tipos</option>
            <option value="equipe">Equipe</option>
            <option value="banda">Banda</option>
          </select>
          <select
            value={filtroDia}
            onChange={(e) => setFiltroDia(e.target.value)}
            aria-label="Filtrar por dia"
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todos">Todos os dias</option>
            <option value="15">Dia 15</option>
            <option value="16">Dia 16</option>
          </select>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Carregando...</p>
        ) : rows.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum credenciamento recebido ainda.
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Nenhum resultado para os filtros aplicados.
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => (
              <Card key={r.id} className="p-4 space-y-3">

                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <p className="font-semibold">
                      {r.nome_banda || r.responsavel_nome}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.tipo} · {(r.dias || []).join(", ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {r.responsavel_nome} · {r.responsavel_whatsapp} ·{" "}
                      {r.quantidade_pessoas} pessoas
                    </p>
                    {r.horario_chegada && (
                      <p className="text-sm text-muted-foreground">
                        Chegada: {r.horario_chegada}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Excluir cadastro"
                      onClick={() => handleDelete(r)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                </div>

                {r.membros && r.membros.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Membros ({r.membros.length})
                    </p>
                    <ul className="text-sm space-y-1">
                      {r.membros.map((m, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>{m.nome}</span>
                          <span className="text-muted-foreground">— {m.funcao}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.veiculos && r.veiculos.length > 0 && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      Veículos ({r.veiculos.length})
                    </p>
                    <ul className="text-sm space-y-1">
                      {r.veiculos.map((v, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-muted-foreground">{i + 1}.</span>
                          <span>{v.marca_modelo}</span>
                          <span className="text-muted-foreground">
                            — {v.cor} — {v.placa}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {r.observacoes && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                      Observações
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{r.observacoes}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
