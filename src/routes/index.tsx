import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { CheckCircle2 } from "lucide-react";
import {
  CredenciamentoForm,
  buildPayload,
  type FormValues,
} from "@/components/CredenciamentoForm";
import logoComvocacao from "@/assets/comvocacao-logo-2026.png.asset.json";
import textura from "@/assets/comvocacao-textura.png.asset.json";
import comvocacaoBanner from "@/assets/comvocacao-banner-2026.png.asset.json";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const [submitted, setSubmitted] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const onSubmit = async (values: FormValues) => {
    const { error } = await supabase.from("credenciamentos").insert(buildPayload(values));
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
              setFormKey((k) => k + 1);
              setSubmitted(false);
            }}
          >
            Novo credenciamento
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-10 rounded-2xl border border-border overflow-hidden shadow-sm relative">
          <div
            className="absolute inset-0 opacity-25 bg-cover bg-center"
            style={{ backgroundImage: `url(${textura.url})` }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-card/80" aria-hidden />
          <div className="relative flex items-start gap-5 p-5 sm:p-7">

            <img
              src={logoComvocacao.url}
              alt="ComVocação"
              className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-border"
            />
            <div className="min-w-0">
              <h1 className="text-2xl tracking-tight text-foreground font-extrabold sm:text-4xl">
                ComVocação – 23 anos
              </h1>
              <p className="text-sm sm:text-base mt-0.5 text-secondary font-medium">
                Festa em prol das vocações sacerdotais
              </p>
              <p className="text-sm mt-3 leading-relaxed text-secondary">
                Preencha os dados com atenção. As informações serão utilizadas pela organização do
                evento.
              </p>
            </div>
          </div>
        </header>

        <CredenciamentoForm key={formKey} mode="create" onSubmit={onSubmit} />
      </div>
    </div>
  );
}
