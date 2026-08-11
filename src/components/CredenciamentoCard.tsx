import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { setorLabel } from "@/components/CredenciamentoForm";
import { tipoKey, type Row } from "@/hooks/useCredenciamentos";

export function CredenciamentoCard({ r, actions }: { r: Row; actions?: ReactNode }) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="font-semibold flex items-center gap-2 flex-wrap">
            {r.nome_banda || r.responsavel_nome}
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
