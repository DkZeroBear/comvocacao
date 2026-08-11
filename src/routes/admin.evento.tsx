import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft, LogOut, FileText } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useCredenciamentos } from "@/hooks/useCredenciamentos";
import { CredenciamentoCard } from "@/components/CredenciamentoCard";

export const Route = createFileRoute("/admin/evento")({
  head: () => ({
    meta: [
      { title: "Painel do Dia — ComVocação" },
      {
        name: "description",
        content:
          "Painel operacional do dia do evento ComVocação: contadores, busca e exportações rápidas.",
      },
      { property: "og:title", content: "Painel do Dia — ComVocação" },
      {
        property: "og:description",
        content: "Visão simplificada dos credenciamentos para uso no dia do evento.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PainelDoDia,
});

function Contador({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4 text-center">
      <p className="text-3xl sm:text-4xl font-bold tabular-nums">{value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-1">{label}</p>
    </Card>
  );
}

function PainelDoDia() {
  const {
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
    exportXlsx,
    exportPdf,
  } = useCredenciamentos();

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
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Link>
            <h1 className="text-xl sm:text-2xl font-bold">ComVocação — Painel do Dia</h1>
            <Link
              to="/admin"
              className="inline-block mt-2 text-sm text-muted-foreground hover:underline"
            >
              Painel completo (edição avançada)
            </Link>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Sair
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Contador label="Total geral" value={rows.length} />
          <Contador label="Equipe" value={totalEquipe} />
          <Contador label="Banda" value={totalBanda} />
          <Contador label="Prefeitura/Convidados" value={totalPrefeitura} />
          <Contador label="Comissão" value={totalComissao} />
          <Contador label="Dia 15" value={countDia("15")} />
          <Contador label="Dia 16" value={countDia("16")} />
          <Contador label="Veículos" value={totalVeiculos} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="text-center">
            <Button className="w-full h-12 text-base" onClick={exportPdf} disabled={!rows.length}>
              <FileText className="w-5 h-5 mr-2" /> Exportar PDF
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Lista pronta pra imprimir e levar na portaria
            </p>
          </div>
          <div className="text-center">
            <Button className="w-full h-12 text-base" onClick={exportXlsx} disabled={!rows.length}>
              <Download className="w-5 h-5 mr-2" /> Exportar Excel
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Planilha completa com todos os dados
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome..."
            className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            aria-label="Filtrar por tipo"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="todos">Todos os tipos</option>
            <option value="equipe">Equipe</option>
            <option value="banda">Banda / Artista</option>
            <option value="prefeitura">Prefeitura / Convidados</option>
            <option value="comissao">Comissão Organizadora</option>
          </select>
          <select
            value={filtroDia}
            onChange={(e) => setFiltroDia(e.target.value)}
            aria-label="Filtrar por dia"
            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
              <CredenciamentoCard key={r.id} r={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
