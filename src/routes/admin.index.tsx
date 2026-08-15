import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowLeft, LogOut, FileText, Trash2, Pencil, LayoutDashboard } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { useCredenciamentos } from "@/hooks/useCredenciamentos";
import { CredenciamentoCard } from "@/components/CredenciamentoCard";

export const Route = createFileRoute("/admin/")({
  component: Admin,
});

function Admin() {
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
    handleDelete,
    exportXlsx,
    exportPdf,
    exportContatos,
    duplicatesById,

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
              · {totalEquipe} Equipe · {totalBanda} Banda · {totalPrefeitura} Prefeitura/Convidados ·{" "}
              {totalComissao} Comissão · Dia 15: {countDia("15")} · Dia 16:{" "}
              {countDia("16")} · Qtd. veículos: {totalVeiculos}
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportXlsx} disabled={!rows.length}>
              <Download className="w-4 h-4 mr-2" /> Exportar Excel
            </Button>
            <Button onClick={exportPdf} disabled={!rows.length}>
              <FileText className="w-4 h-4 mr-2" /> Exportar PDF
            </Button>
            <Button variant="outline" onClick={exportContatos} disabled={!rows.length}>
              <FileText className="w-4 h-4 mr-2" /> Exportar Contatos (uso restrito)
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/evento">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Painel do dia
              </Link>
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
            <option value="banda">Banda / Artista</option>
            <option value="prefeitura">Prefeitura / Convidados</option>
            <option value="comissao">Comissão Organizadora</option>
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
              <CredenciamentoCard
                key={r.id}
                r={r}
                actions={
                  <>
                    <Button variant="ghost" size="sm" aria-label="Editar cadastro" asChild>
                      <Link to="/admin/edit/$id" params={{ id: r.id }}>
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Excluir cadastro"
                      onClick={() => handleDelete(r)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
