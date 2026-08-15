import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setorLabel } from "@/components/CredenciamentoForm";
import { tipoKey, type Row } from "@/hooks/useCredenciamentos";

export function CredenciamentoCard({
  r,
  actions,
  duplicatas,
}: {
  r: Row;
  actions?: ReactNode;
  duplicatas?: Row[];
}) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="font-semibold flex items-center gap-2 flex-wrap">
            {r.nome_banda || r.responsavel_nome}
            {duplicatas && duplicatas.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-500 hover:bg-amber-500/20"
                    title="Possível duplicata — mesmo nome no mesmo dia"
                  >
                    <AlertTriangle className="w-3 h-3" /> Possível duplicata
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80 text-sm">
                  <p className="font-semibold mb-2">
                    Outros registros com o mesmo nome ({duplicatas.length})
                  </p>
                  <ul className="space-y-2">
                    {duplicatas.map((d) => (
                      <li key={d.id} className="border-b border-border pb-2 last:border-0 last:pb-0">
                        <p className="font-medium">{d.responsavel_nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {(d.dias || []).join(", ")} · Chegada: {d.horario_chegada || "—"} ·{" "}
                          {d.quantidade_pessoas} pessoas
                        </p>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Informativo — nada foi alterado ou mesclado.
                  </p>
                </PopoverContent>
              </Popover>
            )}
            {tipoKey(r) === "equipe" && r.setor && (
              <span className="text-xs font-medium uppercase tracking-wide rounded-full border border-border bg-muted px-2 py-0.5 text-muted-foreground">
                {setorLabel(r.setor)}
              </span>
            )}
          </p>

          <p className="text-sm text-muted-foreground">
            {r.tipo} · {(r.dias || []).join(", ")}
          </p>
          <p className="text-sm text-muted-foreground">
            {r.responsavel_nome} · {r.responsavel_whatsapp} · {r.quantidade_pessoas} pessoas
          </p>
          {r.horario_chegada && (
            <p className="text-sm text-muted-foreground">Chegada: {r.horario_chegada}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(r.created_at).toLocaleString("pt-BR")}
          </span>
          {actions}
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
  );
}
