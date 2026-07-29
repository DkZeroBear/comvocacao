import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";
import {
  CredenciamentoForm,
  buildPayload,
  emptyFormValues,
  maskPhone,
  type FormValues,
} from "@/components/CredenciamentoForm";

export const Route = createFileRoute("/admin/edit/$id")({
  component: AdminEdit,
});

type Row = {
  id: string;
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

function rowToFormValues(r: Row): FormValues {
  const isBanda = (r.tipo || "").toLowerCase().includes("banda");
  return {
    ...emptyFormValues,
    tipo: isBanda ? "banda" : "equipe",
    setor: isBanda ? "" : r.setor || "",
    dias: r.dias || [],
    responsavel_nome: isBanda ? r.responsavel_nome || "" : "",
    responsavel_whatsapp: isBanda ? maskPhone(r.responsavel_whatsapp || "") : "",
    eh_produtor: r.eh_produtor === null ? "" : r.eh_produtor ? "sim" : "nao",
    pode_contatar: r.pode_contatar === null ? "" : r.pode_contatar ? "sim" : "nao",
    quantidade_pessoas: isBanda ? r.quantidade_pessoas ?? "" : "",
    observacoes: r.observacoes || "",
    nome_banda: r.nome_banda || "",
    horario_chegada: r.horario_chegada || "",
    veiculos: r.veiculos || [],
    membros: r.membros?.length ? r.membros : [{ nome: "", funcao: "" }],
  };
}

function AdminEdit() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState<FormValues | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

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
        .eq("id", id)
        .maybeSingle();

      if (!active) return;
      if (error || !data) {
        toast.error("Cadastro não encontrado.");
        navigate({ to: "/admin" });
        return;
      }
      setValues(rowToFormValues(data as unknown as Row));
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
  }, [id, navigate]);

  const handleUpdate = async (v: FormValues) => {
    const { error } = await supabase
      .from("credenciamentos")
      .update(buildPayload(v))
      .eq("id", id);
    if (error) {
      toast.error("Erro ao salvar alterações");
      return;
    }
    toast.success("Cadastro atualizado");
    navigate({ to: "/admin" });
  };

  if (!authChecked || !values) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <header className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-sm text-muted-foreground hover:underline mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Link>
          <h1 className="text-2xl font-bold">Editar credenciamento</h1>
          <p className="text-sm text-muted-foreground">
            Alterações feitas aqui substituem os dados enviados pelo participante.
          </p>
        </header>

        <CredenciamentoForm
          mode="edit"
          defaultValues={values}
          submitLabel="Salvar alterações"
          onSubmit={handleUpdate}
        />
      </div>
    </div>
  );
}
