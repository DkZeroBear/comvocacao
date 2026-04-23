import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import logoComvocacao from "@/assets/comvocacao-logo.jpeg";

export const Route = createFileRoute("/")({
  component: Index,
});

type Tipo = "equipe" | "banda";

type FormValues = {
  tipo: Tipo | "";
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

const FUNCOES_EQUIPE = ["Comissão", "Apresentador(a)"];
const FUNCOES_BANDA = [
  "Cantor(a)",
  "Músico(a)",
  "Produção",
  "Técnica",
  "Fotógrafo/Videomaker",
  "Acompanhante",
];
const DIAS = ["Dia 15", "Dia 16", "Ambos os dias"];

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (!d) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

// Section header — sober uppercase label with underline
function SectionTitle({ children }: { children: React.ReactNode }) {
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
  type = "button",
}: {
  active: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  type?: "button";
}) {
  return (
    <button
      type={type}
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

function Index() {
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<FormValues>({
    defaultValues: {
      tipo: "",
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
    },
  });

  const tipo = form.watch("tipo");

  const membros = useFieldArray({ control: form.control, name: "membros" });
  const veiculos = useFieldArray({ control: form.control, name: "veiculos" });

  const onSubmit = async (values: FormValues) => {
    if (!values.tipo) return toast.error("Selecione o tipo de credenciamento.");
    if (!values.dias.length) return toast.error("Selecione ao menos um dia de presença.");

    const isBanda = values.tipo === "banda";

    if (isBanda) {
      if (!values.responsavel_nome.trim()) return toast.error("Informe o nome do responsável.");
      if (!values.responsavel_whatsapp.trim()) return toast.error("Informe o WhatsApp do responsável.");
      if (!values.eh_produtor) return toast.error("Informe se é produtor(a).");
      if (!values.pode_contatar) return toast.error("Informe se podemos entrar em contato.");
      if (!values.nome_banda.trim()) return toast.error("Informe o nome da banda ou artista.");
      if (!values.horario_chegada) return toast.error("Informe o horário previsto de chegada.");
      if (!values.quantidade_pessoas || Number(values.quantidade_pessoas) < 1)
        return toast.error("Informe a quantidade estimada de pessoas.");
    }

    const membrosFiltrados = values.membros.filter((m) => m.nome.trim());
    if (!membrosFiltrados.length) return toast.error("Adicione ao menos um membro.");

    const payload = {
      tipo: isBanda ? "Banda / Artista" : "Equipe Palco/Camarim",
      dias: values.dias,
      responsavel_nome: isBanda ? values.responsavel_nome.trim() : membrosFiltrados[0].nome,
      responsavel_whatsapp: isBanda ? values.responsavel_whatsapp.trim() : "—",
      eh_produtor: isBanda ? values.eh_produtor === "sim" : null,
      pode_contatar: isBanda ? values.pode_contatar === "sim" : null,
      quantidade_pessoas: isBanda ? Number(values.quantidade_pessoas) : membrosFiltrados.length,
      observacoes: isBanda ? values.observacoes.trim() || null : null,
      nome_banda: isBanda ? values.nome_banda.trim() : null,
      horario_chegada: isBanda ? values.horario_chegada : null,
      membros: membrosFiltrados,
      veiculos: isBanda ? values.veiculos.filter((v) => v.placa.trim() || v.marca_modelo.trim()) : [],
    };

    const { error } = await supabase.from("credenciamentos").insert(payload);
    if (error) {
      toast.error("Erro ao enviar. Tente novamente.");
      return;
    }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full text-center space-y-5 p-8 rounded-2xl border border-border bg-card">
          <div className="mx-auto w-14 h-14 rounded-full bg-foreground/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">Credenciamento enviado</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Credenciamento enviado com sucesso. A organização entrará em contato se necessário.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              form.reset();
              setSubmitted(false);
            }}
          >
            Novo credenciamento
          </Button>
        </div>
      </div>
    );
  }

  const funcoes = tipo === "equipe" ? FUNCOES_EQUIPE : FUNCOES_BANDA;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header card */}
        <header className="mb-10 rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm">
          <div className="flex items-start gap-5">
            <img
              src={logoComvocacao}
              alt="Comvocação"
              className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-border"
            />
            <div className="min-w-0">
              <h1 className="text-2xl tracking-tight text-foreground font-extrabold sm:text-4xl">
                Comvocação
              </h1>
              <p className="text-sm sm:text-base mt-0.5 text-secondary font-medium">
                Festa em prol das vocações sacerdotais
              </p>
              <p className="text-sm mt-3 leading-relaxed text-secondary">
                Preencha os dados com atenção. As informações serão utilizadas pela organização do evento.
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* Tipo de credenciamento — cards */}
          <section className="space-y-4">
            <SectionTitle>Tipo de credenciamento</SectionTitle>
            <Controller
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { value: "equipe", title: "Equipe", sub: "Palco / Camarim" },
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

          {/* Dias — pills */}
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
                  field.onChange(
                    next.includes(v) ? next.filter((x) => x !== v) : [...next, v]
                  );
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

          {/* Equipe flow — apenas membros */}
          {tipo === "equipe" && (
            <section className="space-y-4">
              <SectionTitle>Membros da equipe</SectionTitle>
              <div className="space-y-3">
                {membros.fields.map((f, i) => (
                  <div key={f.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Membro {i + 1}
                      </span>
                      {membros.fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => membros.remove(i)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">Nome completo</Label>
                        <Input
                          placeholder="Nome completo"
                          {...form.register(`membros.${i}.nome`)}
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Função</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-input text-foreground px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                          {...form.register(`membros.${i}.funcao`)}
                        >
                          <option value="">Selecione...</option>
                          {FUNCOES_EQUIPE.map((fn) => (
                            <option key={fn} value={fn}>
                              {fn}
                            </option>
                          ))}
                        </select>
                      </div>
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
          )}

          {/* Banda flow */}
          {tipo === "banda" && (
            <>
              {/* Responsável */}
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
                    <Input
                      placeholder="Seu nome"
                      {...form.register("responsavel_nome")}
                    />
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

              {/* Banda */}
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

              {/* Veículos */}
              <section className="space-y-4">
                <SectionTitle>Veículos</SectionTitle>
                <div className="space-y-3">
                  {veiculos.fields.map((f, i) => (
                    <div key={f.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Veículo {i + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => veiculos.remove(i)}
                        >
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
                          <Input
                            placeholder="Ex: Prata"
                            {...form.register(`veiculos.${i}.cor`)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Placa</Label>
                          <Controller
                            control={form.control}
                            name={`veiculos.${i}.placa`}
                            render={({ field }) => (
                              <Input
                                placeholder="ABC-1234"
                                maxLength={8}
                                value={field.value}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value.toUpperCase().slice(0, 8)
                                  )
                                }
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

              {/* Membros */}
              <section className="space-y-4">
                <SectionTitle>Membros da banda / equipe artística</SectionTitle>
                <div className="space-y-3">
                  {membros.fields.map((f, i) => (
                    <div key={f.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          Membro {i + 1}
                        </span>
                        {membros.fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => membros.remove(i)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">Nome completo</Label>
                          <Input
                            placeholder="Nome completo"
                            {...form.register(`membros.${i}.nome`)}
                          />
                        </div>
                        <div>
                          <Label className="text-sm">Função</Label>
                          <select
                            className="flex h-9 w-full rounded-md border border-input bg-input text-foreground px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
                            {...form.register(`membros.${i}.funcao`)}
                          >
                            <option value="">Selecione...</option>
                            {funcoes.map((fn) => (
                              <option key={fn} value={fn}>
                                {fn}
                              </option>
                            ))}
                          </select>
                        </div>
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

              {/* Informações gerais */}
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
            {form.formState.isSubmitting ? "Enviando..." : "Enviar credenciamento"}
          </Button>

          <div className="text-center pt-2">
            <Link
              to="/admin"
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground"
            >
              admin
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
