import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type Tipo = "equipe" | "banda" | "prefeitura" | "comissao";

export type FormValues = {
  tipo: Tipo | "";
  setor: string;
  dias: string[];
  responsavel_nome: string;
  responsavel_whatsapp: string;
  eh_produtor: "sim" | "nao" | "";
  pode_contatar: "sim" | "nao" | "";
  quantidade_pessoas: number | "";
  observacoes: string;
  nome_banda: string;
  horario_chegada: string;
  veiculos: { marca_modelo: string; cor: string; placa: string }[];
  membros: { nome: string; funcao: string }[];
};

export const TIPOS = [
  { value: "equipe", title: "Equipe", sub: "Setor e equipes de apoio ao evento" },
  { value: "banda", title: "Banda / Artista", sub: "Músicos e equipe artística" },
  {
    value: "prefeitura",
    title: "Prefeitura / Convidados",
    sub: "Autoridades e convidados oficiais",
  },
  {
    value: "comissao",
    title: "Comissão Organizadora",
    sub: "Membros da comissão do evento",
  },
] as const;

export function tipoLabel(value?: string | null) {
  return TIPOS.find((t) => t.value === value)?.title ?? "";
}

export const SETORES = [
  { value: "palco", label: "Equipe Palco" },
  { value: "camarim", label: "Equipe Camarim" },
  { value: "press", label: "Equipe Press" },
  { value: "tecnica", label: "Equipe Técnica" },
] as const;

export function setorLabel(value?: string | null) {
  return SETORES.find((s) => s.value === value)?.label ?? "";
}

export const FUNCOES_BANDA = [
  "Cantor(a)",
  "Músico(a)",
  "Produção",
  "Técnica",
  "Fotógrafo/Videomaker",
  "Acompanhante",
];

export const FUNCOES_POR_SETOR: Record<string, string[]> = {
  palco: ["Apoio (Staff)", "Apresentador(a)"],
  camarim: ["Apoio (Staff)"],
  tecnica: ["Som", "Iluminação", "Transmissão/Streaming", "Apoio técnico"],
  press: ["Fotógrafo(a)", "Videomaker", "Apoio (Staff)"],
};

export const FUNCOES_PREFEITURA = [
  "Prefeito",
  "Vice",
  "Vereador(a)",
  "Assessoria",
  "Convidado(a)",
];

/** Opções e rótulo do campo de função/cargo conforme tipo e setor. */
export function funcaoConfig(tipo: string, setor: string): { label: string; opcoes: string[] | null } {
  if (tipo === "banda") return { label: "Função", opcoes: FUNCOES_BANDA };
  if (tipo === "equipe") return { label: "Função", opcoes: FUNCOES_POR_SETOR[setor] ?? [] };
  if (tipo === "prefeitura") return { label: "Cargo", opcoes: FUNCOES_PREFEITURA };
  return { label: "Função", opcoes: null };
}

export const DIAS = ["Dia 15", "Dia 16", "Ambos os dias"];


export const emptyFormValues: FormValues = {
  tipo: "",
  setor: "",
  dias: [],
  responsavel_nome: "",
  responsavel_whatsapp: "",
  eh_produtor: "",
  pode_contatar: "",
  quantidade_pessoas: "",
  observacoes: "",
  nome_banda: "",
  horario_chegada: "",
  veiculos: [],
  membros: [{ nome: "", funcao: "" }],
};


export function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Monta o payload de banco a partir dos valores do formulário. */
export function buildPayload(values: FormValues) {
  const isBanda = values.tipo === "banda";
  const membrosFiltrados = values.membros.filter((m) => m.nome.trim());
  return {
    tipo: tipoLabel(values.tipo),
    setor: values.tipo === "equipe" ? values.setor || null : null,
    dias: values.dias,
    responsavel_nome: isBanda
      ? values.responsavel_nome.trim()
      : membrosFiltrados[0]?.nome ?? "",
    responsavel_whatsapp: isBanda ? values.responsavel_whatsapp.trim() : "—",
    eh_produtor: isBanda ? values.eh_produtor === "sim" : null,
    pode_contatar: isBanda ? values.pode_contatar === "sim" : null,
    quantidade_pessoas: isBanda ? Number(values.quantidade_pessoas) : membrosFiltrados.length,
    observacoes: values.observacoes.trim() || null,
    nome_banda: isBanda ? values.nome_banda.trim() : null,
    horario_chegada: isBanda ? values.horario_chegada : null,
    membros: membrosFiltrados,
    veiculos: values.veiculos.filter((v) => v.placa.trim() || v.marca_modelo.trim()),
  };
}


export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h2 className="text-xs tracking-[0.15em] uppercase font-bold text-muted-foreground">
        {children}
      </h2>
      <div className="h-px bg-border" />
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-5 py-2 rounded-full text-sm font-medium border transition",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-card text-foreground border-border hover:bg-muted"
      )}
    >
      {children}
    </button>
  );
}

type Props = {
  mode: "create" | "edit";
  defaultValues?: FormValues;
  onSubmit: (values: FormValues) => Promise<void>;
  submitLabel?: string;
};

export function CredenciamentoForm({ mode, defaultValues, onSubmit, submitLabel }: Props) {
  const form = useForm<FormValues>({
    defaultValues: defaultValues ?? emptyFormValues,
  });

  const tipo = form.watch("tipo");
  const membros = useFieldArray({ control: form.control, name: "membros" });
  const veiculos = useFieldArray({ control: form.control, name: "veiculos" });

  const setor = form.watch("setor");
  const { label: funcaoLabel, opcoes: funcoes } = funcaoConfig(tipo, setor);


  const handleSubmit = async (values: FormValues) => {
    if (!values.tipo) return toast.error("Selecione o tipo de credenciamento.");
    if (!values.dias.length) return toast.error("Selecione ao menos um dia de presença.");

    const isBanda = values.tipo === "banda";

    if (isBanda) {
      if (!values.responsavel_nome.trim()) return toast.error("Informe o nome do responsável.");
      if (!values.responsavel_whatsapp.trim())
        return toast.error("Informe o WhatsApp do responsável.");
      if (!values.eh_produtor) return toast.error("Informe se é produtor(a).");
      if (!values.pode_contatar) return toast.error("Informe se podemos entrar em contato.");
      if (!values.nome_banda.trim()) return toast.error("Informe o nome da banda ou artista.");
      if (!values.horario_chegada) return toast.error("Informe o horário previsto de chegada.");
      if (!values.quantidade_pessoas || Number(values.quantidade_pessoas) < 1)
        return toast.error("Informe a quantidade estimada de pessoas.");
    } else if (values.tipo === "equipe" && !values.setor) {
      return toast.error("Selecione o setor da equipe.");
    }


    if (!values.membros.filter((m) => m.nome.trim()).length)
      return toast.error("Adicione ao menos um membro.");

    await onSubmit(values);
  };

  const veiculosSection = (
    <section className="space-y-4">
      <SectionTitle>Veículos</SectionTitle>
      <div className="space-y-3">
        {veiculos.fields.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Veículo {i + 1}
              </span>
              <Button type="button" variant="ghost" size="sm" onClick={() => veiculos.remove(i)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div>
              <Label className="text-sm">Marca / Modelo</Label>
              <Input
                placeholder="Ex: Volkswagen Gol"
                {...form.register(`veiculos.${i}.marca_modelo`)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Cor</Label>
                <Input placeholder="Ex: Prata" {...form.register(`veiculos.${i}.cor`)} />
              </div>
              <div>
                <Label className="text-sm">Placa</Label>
                <Controller
                  control={form.control}
                  name={`veiculos.${i}.placa`}
                  render={({ field }) => (
                    <Input
                      placeholder="ABC-1234 ou ABC1D23"
                      maxLength={8}
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 8))}
                    />
                  )}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => veiculos.append({ marca_modelo: "", cor: "", placa: "" })}
      >
        <Plus className="w-4 h-4 mr-1" /> Adicionar veículo
      </Button>
    </section>
  );

  const membrosSection = (titulo: string, opcoes: string[] | null, rotulo = "Função") => (
    <section className="space-y-4">
      <SectionTitle>{titulo}</SectionTitle>
      <div className="space-y-3">
        {membros.fields.map((f, i) => (
          <div key={f.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Membro {i + 1}
              </span>
              {membros.fields.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => membros.remove(i)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-sm">Nome completo</Label>
                <Input placeholder="Nome completo" {...form.register(`membros.${i}.nome`)} />
              </div>
              {opcoes && (
                <div>
                  <Label className="text-sm">{rotulo}</Label>
                  <select
                    className="flex h-9 w-full rounded-md border border-input bg-input text-foreground px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                    {...form.register(`membros.${i}.funcao`)}
                  >
                    <option value="">Selecione...</option>
                    {opcoes.map((fn) => (
                      <option key={fn} value={fn}>
                        {fn}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => membros.append({ nome: "", funcao: "" })}
      >
        <Plus className="w-4 h-4 mr-1" /> Adicionar membro
      </Button>
    </section>
  );

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-10">
      {/* Local do evento */}
      <section className="space-y-3">
        <SectionTitle>Local</SectionTitle>
        <a
          href="https://www.google.com/maps/search/?api=1&query=Concha+Ac%C3%BAstica+da+FITO+Av+das+Flores+701+Osasco+SP"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-accent hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <MapPin className="shrink-0 mt-0.5 text-primary" size={22} aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-foreground font-semibold">Concha Acústica da FITO</p>
            <p className="text-sm text-secondary mt-0.5">
              Av. das Flores, 701 — Jardim das Flores, Osasco - SP
            </p>
            <p className="text-xs text-primary mt-1 font-medium">Abrir no Google Maps →</p>
          </div>
        </a>
      </section>

      {/* Tipo de credenciamento */}
      <section className="space-y-4">
        <SectionTitle>Tipo de credenciamento</SectionTitle>
        <Controller
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { value: "equipe", title: "Equipe", sub: "Setor e equipes de apoio ao evento" },
                { value: "banda", title: "Banda / Artista", sub: "Músicos e equipe artística" },
              ].map((opt) => {
                const active = field.value === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => field.onChange(opt.value)}
                    className={cn(
                      "text-left p-5 rounded-xl border transition bg-card border-border",
                      active
                        ? "border-foreground ring-1 ring-foreground"
                        : "border-border hover:border-foreground/40"
                    )}
                  >
                    <div className="font-semibold text-foreground">{opt.title}</div>
                    <div className="text-sm mt-0.5 text-secondary">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          )}
        />
      </section>

      {/* Setor (apenas Equipe) */}
      {tipo === "equipe" && (
        <section className="space-y-4">
          <SectionTitle>Setor</SectionTitle>
          <div>
            <Label className="text-sm">
              Setor da equipe <span className="text-destructive">*</span>
            </Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-input text-foreground px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
              {...form.register("setor")}
            >
              <option value="">Selecione...</option>
              {SETORES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </section>
      )}



      {/* Dias */}
      <section className="space-y-4">
        <SectionTitle>Dias de presença</SectionTitle>
        <Controller
          control={form.control}
          name="dias"
          render={({ field }) => {
            const toggle = (v: string) => {
              if (v === "Ambos os dias") {
                field.onChange(field.value.includes(v) ? [] : [v]);
                return;
              }
              const next = field.value.filter((x) => x !== "Ambos os dias");
              field.onChange(next.includes(v) ? next.filter((x) => x !== v) : [...next, v]);
            };
            return (
              <div className="flex flex-wrap gap-2">
                {DIAS.map((d) => (
                  <Pill key={d} active={field.value.includes(d)} onClick={() => toggle(d)}>
                    {d}
                  </Pill>
                ))}
              </div>
            );
          }}
        />
      </section>

      {/* Equipe */}
      {tipo === "equipe" && membrosSection("Membros da equipe", FUNCOES_EQUIPE)}
      {tipo === "equipe" && veiculosSection}

      {/* Banda */}
      {tipo === "banda" && (
        <>
          <section className="space-y-4">
            <SectionTitle>Responsável pelo cadastro</SectionTitle>
            <div className="rounded-md border border-foreground/30 bg-foreground/5 px-4 py-3 text-sm">
              Quem está preenchendo este formulário em nome da banda ou artista.
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">
                  Nome completo <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="Seu nome" {...form.register("responsavel_nome")} />
              </div>
              <div>
                <Label className="text-sm">
                  WhatsApp <span className="text-destructive">*</span>
                </Label>
                <Controller
                  control={form.control}
                  name="responsavel_whatsapp"
                  render={({ field }) => (
                    <Input
                      inputMode="tel"
                      placeholder="(00) 00000-0000"
                      value={field.value}
                      onChange={(e) => field.onChange(maskPhone(e.target.value))}
                    />
                  )}
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">
                É produtor(a)? <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={form.control}
                name="eh_produtor"
                render={({ field }) => (
                  <div className="flex gap-2 mt-1.5">
                    <Pill active={field.value === "sim"} onClick={() => field.onChange("sim")}>
                      Sim
                    </Pill>
                    <Pill active={field.value === "nao"} onClick={() => field.onChange("nao")}>
                      Não
                    </Pill>
                  </div>
                )}
              />
            </div>
            <div>
              <Label className="text-sm">
                Podemos entrar em contato com este número caso necessário?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Controller
                control={form.control}
                name="pode_contatar"
                render={({ field }) => (
                  <div className="flex gap-2 mt-1.5">
                    <Pill active={field.value === "sim"} onClick={() => field.onChange("sim")}>
                      Sim
                    </Pill>
                    <Pill active={field.value === "nao"} onClick={() => field.onChange("nao")}>
                      Não
                    </Pill>
                  </div>
                )}
              />
            </div>
          </section>

          <section className="space-y-4">
            <SectionTitle>Banda / Artista</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">
                  Nome da banda ou artista <span className="text-destructive">*</span>
                </Label>
                <Input placeholder="Ex: Banda Aurora" {...form.register("nome_banda")} />
              </div>
              <div>
                <Label className="text-sm">
                  Horário previsto de chegada <span className="text-destructive">*</span>
                </Label>
                <Input type="time" {...form.register("horario_chegada")} />
              </div>
            </div>
          </section>

          {veiculosSection}

          {membrosSection("Membros da banda / equipe artística", funcoes)}

          <section className="space-y-4">
            <SectionTitle>Informações gerais</SectionTitle>
            <div>
              <Label className="text-sm">
                Quantidade estimada de pessoas <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={1}
                placeholder="Ex: 12"
                {...form.register("quantidade_pessoas")}
              />
            </div>
            <div>
              <Label className="text-sm">Observações</Label>
              <Textarea
                rows={4}
                placeholder="Possui alguma restrição alimentar ou informação que seja útil à organização ser informada previamente?"
                {...form.register("observacoes")}
              />
            </div>
          </section>
        </>
      )}

      <Button
        type="submit"
        variant="outline"
        className="w-full h-12 text-base bg-card text-foreground border-border hover:bg-card hover:text-foreground"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting
          ? "Enviando..."
          : submitLabel ?? "Enviar credenciamento"}
      </Button>

      {mode === "create" && (
        <div className="text-center pt-2">
          <Link to="/admin" className="text-xs text-muted-foreground/60 hover:text-muted-foreground">
            admin
          </Link>
        </div>
      )}
    </form>
  );
}
