import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("Edge Function 'delete-liderado' iniciada.");

  try {
    if (req.method !== "POST") {
      console.error("Erro: Método não permitido. Recebido:", req.method);
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    let body: { liderado_id: number };
    try {
      body = (await req.json()) as { liderado_id: number };
      console.log("Corpo da requisição JSON recebido:", body);
    } catch (jsonError) {
      console.error("Erro ao parsear JSON da requisição:", jsonError);
      return Response.json({ error: "Corpo da requisição inválido (não é JSON válido)." }, { status: 400, headers: corsHeaders });
    }

    const { liderado_id } = body;
    if (!liderado_id) {
      console.error("Erro: ID do liderado ausente no corpo da requisição.");
      return Response.json({ error: "ID do liderado é obrigatório." }, { status: 400, headers: corsHeaders });
    }

    // 1. Autenticação do Líder (usando o token)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Erro: Cabeçalho de autorização ausente.");
      return Response.json({ error: "Não autenticado" }, { status: 401, headers: corsHeaders });
    }
    
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const supabaseClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log("Tentando obter usuário autenticado...");
    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser();
    
    if (authErr || !user) {
      console.error("Erro ao obter usuário autenticado ou token inválido:", authErr?.message || "Usuário não encontrado.");
      return Response.json({ error: "Token inválido ou expirado" }, { status: 401, headers: corsHeaders });
    }
    const leaderAuthUid = user.id;
    console.log("Usuário autenticado (leaderAuthUid):", leaderAuthUid);

    // 2. Valida o papel do usuário que está fazendo a chamada (usando cliente admin para ignorar RLS)
    console.log("Verificando papel do líder no banco de dados...");
    const { data: leaderProfile, error: leaderProfileErr } = await admin
      .from("usuario")
      .select("id, role")
      .eq("auth_user_id", leaderAuthUid)
      .single();

    if (leaderProfileErr || !leaderProfile) {
      console.error("Erro ao buscar perfil do líder ou líder não encontrado:", leaderProfileErr?.message || "Líder não encontrado.");
      return Response.json({ error: "Líder não encontrado no perfil de usuário ou erro de permissão." }, { status: 403, headers: corsHeaders });
    }
    if (leaderProfile.role !== "LIDER" && leaderProfile.role !== "ADMIN") {
      console.error("Erro: Permissão negada. Papel do usuário:", leaderProfile.role);
      return Response.json({ error: "Permissão negada: Apenas líderes podem deletar liderados." }, { status: 403, headers: corsHeaders });
    }
    console.log("Papel do líder verificado:", leaderProfile.role);

    // 3. Verifica se o líder tem permissão para deletar este liderado específico
    console.log(`Verificando vínculo entre líder ${leaderProfile.id} e liderado ${liderado_id}...`);
    const { data: liderLideradoLink, error: linkErr } = await admin
      .from("lider_liderado")
      .select("id")
      .eq("lider_id", leaderProfile.id)
      .eq("liderado_id", liderado_id)
      .maybeSingle();

    if (linkErr || !liderLideradoLink) {
      console.error("Erro ao verificar vínculo líder-liderado ou vínculo não encontrado:", linkErr?.message || "Vínculo não encontrado.");
      return Response.json({ error: "Acesso negado: Você não é o líder deste liderado ou o vínculo não existe." }, { status: 403, headers: corsHeaders });
    }
    console.log("Vínculo líder-liderado verificado.");

    // 4. Obtém o auth_user_id do liderado para deletar o usuário de autenticação
    console.log(`Buscando auth_user_id para liderado ${liderado_id}...`);
    const { data: lideradoUser, error: lideradoUserErr } = await admin
      .from("usuario")
      .select("auth_user_id")
      .eq("id", liderado_id)
      .single();

    if (lideradoUserErr || !lideradoUser?.auth_user_id) {
      console.error("Erro ao buscar auth_user_id do liderado ou não encontrado:", lideradoUserErr?.message || "Auth user ID do liderado não encontrado.");
      return Response.json({ error: "Liderado não encontrado no sistema." }, { status: 404, headers: corsHeaders });
    }
    const lideradoAuthUid = lideradoUser.auth_user_id;
    console.log("Auth user ID do liderado:", lideradoAuthUid);

    // 5. Deleta o usuário do sistema de autenticação (isso acionará o CASCADE para public.usuario e suas dependências)
    console.log(`Deletando usuário de autenticação ${lideradoAuthUid}...`);
    const { error: deleteAuthUserErr } = await admin.auth.admin.deleteUser(lideradoAuthUid);

    if (deleteAuthUserErr) {
      console.error("Erro ao deletar usuário de autenticação:", deleteAuthUserErr);
      return Response.json({ error: "Falha ao deletar o usuário de autenticação." }, { status: 500, headers: corsHeaders });
    }
    console.log("Usuário de autenticação deletado com sucesso. As deleções em cascata devem ter ocorrido.");

    // Sucesso
    console.log("Liderado deletado com sucesso. Enviando resposta.");
    return Response.json({ ok: true }, { headers: corsHeaders });

  } catch (e: any) {
    console.error("Erro inesperado na Edge Function 'delete-liderado':", e);
    return Response.json({ error: e?.message ?? "Erro inesperado no servidor." }, { status: 500, headers: corsHeaders });
  }
});