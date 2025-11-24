import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"; 

// Tipos para clareza e segurança
type Sexo = "MASCULINO" | "FEMININO" | "OUTRO" | "NAO_BINARIO" | "NAO_INFORMADO";

interface CreateLideradoInput {
  nome: string;
  email: string;
  sexo: Sexo;
  id_cargo: string;
  data_nascimento: string;
}

interface Usuario {
  id: number;
  auth_user_id: string | null;
  role: "LIDER" | "LIDERADO" | "ADMIN";
}

// Variáveis de ambiente
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Função para gerar senha forte
function generateTempPassword(len = 14): string {
  const alphabet =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

serve(async (req) => {
  // Lidar com requisições OPTIONS (CORS preflight)
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("Edge Function 'create-liderado' iniciada.");

  try {
    if (req.method !== "POST") {
      console.error("Erro: Método não permitido. Recebido:", req.method);
      return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    let body: Partial<CreateLideradoInput>;
    try {
      body = (await req.json()) as Partial<CreateLideradoInput>;
      console.log("Corpo da requisição JSON recebido:", body);
    } catch (jsonError) {
      console.error("Erro ao parsear JSON da requisição:", jsonError);
      return Response.json({ error: "Corpo da requisição inválido (não é JSON válido)." }, { status: 400, headers: corsHeaders });
    }

    // 1. Autenticação do Líder (usando o token)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Erro: Cabeçalho de autorização ausente.");
      return Response.json({ error: "Não autenticado" }, { status: 401, headers: corsHeaders });
    }
    
    // Cliente Admin para operações privilegiadas (ignora RLS)
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    // Cliente para autenticação (usa ANON_KEY + JWT do usuário)
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
    const { data: leaderRow, error: leaderErr } = await admin
      .from("usuario")
      .select("id, role")
      .eq("auth_user_id", leaderAuthUid)
      .single();

    if (leaderErr || !leaderRow) {
      console.error("Erro ao buscar perfil do líder ou líder não encontrado:", leaderErr?.message || "Líder não encontrado.");
      return Response.json({ error: "Líder não encontrado no perfil de usuário ou erro de permissão." }, { status: 403, headers: corsHeaders });
    }
    if (leaderRow.role !== "LIDER" && leaderRow.role !== "ADMIN") {
      console.error("Erro: Permissão negada. Papel do usuário:", leaderRow.role);
      return Response.json({ error: "Permissão negada: Apenas líderes podem cadastrar" }, { status: 403, headers: corsHeaders });
    }
    console.log("Papel do líder verificado:", leaderRow.role);

    // Validação de entrada (simplificada)
    if (!body.nome || !body.email || !body.id_cargo || !body.data_nascimento || !body.sexo) {
        console.error("Erro: Dados de entrada incompletos.", body);
        return Response.json({ error: "Dados de entrada incompletos: nome, email, cargo, sexo e data de nascimento são obrigatórios." }, { status: 400, headers: corsHeaders });
    }

    // Verifica se o e-mail já existe na tabela de usuários (public.usuario)
    console.log("Verificando se o e-mail já está cadastrado no public.usuario...");
    const { data: existingUserInPublic, error: existingUserInPublicError } = await admin.from("usuario").select("id").eq("email", body.email).maybeSingle();
    if (existingUserInPublicError) {
      console.error("Erro ao verificar e-mail existente no public.usuario:", existingUserInPublicError);
      return Response.json({ error: "Erro ao verificar e-mail existente." }, { status: 500, headers: corsHeaders });
    }
    if (existingUserInPublic) {
      console.error("Erro: E-mail já cadastrado no public.usuario.");
      return Response.json({ error: "E-mail já cadastrado no sistema." }, { status: 409, headers: corsHeaders });
    }

    
    console.log("Verificando se o e-mail já está cadastrado no auth.users...");
    // ALTERAÇÃO AQUI: Substituindo admin.auth.admin.getUserByEmail por uma consulta direta
    const { data: existingAuthUser, error: existingAuthUserError } = await admin
      .from('auth.users')
      .select('id')
      .eq('email', body.email)
      .maybeSingle(); // maybeSingle retorna null se não encontrar, ou o objeto se encontrar

    if (existingAuthUserError) {
      console.error("Erro ao verificar e-mail existente no auth.users:", existingAuthUserError);
      return Response.json({ error: "Erro ao verificar e-mail no sistema de autenticação." }, { status: 500, headers: corsHeaders });
    }
    // Se existingAuthUser não for null, significa que um usuário com esse e-mail já existe
    if (existingAuthUser) {
      console.error("Erro: E-mail já cadastrado no sistema de autenticação.");
      return Response.json({ error: "E-mail já cadastrado no sistema de autenticação." }, { status: 409, headers: corsHeaders });
    }


    // 3. Cria o usuário no sistema de autenticação
    const tempPassword = generateTempPassword();
    console.log("Criando usuário no sistema de autenticação...");
    const { data: authUserResponse, error: authUserError } = await admin.auth.admin.createUser({
      email: body.email,
      password: tempPassword,
      email_confirm: true, // Confirma o e-mail automaticamente
      user_metadata: {
        full_name: body.nome,
        role: "LIDERADO",
        id_cargo: body.id_cargo,
        sexo: body.sexo,
        data_nascimento: body.data_nascimento,
      }
    });

    if (authUserError || !authUserResponse.user) {
      console.error("Falha ao criar o usuário no sistema de autenticação:", authUserError);
      return Response.json({ error: "Falha ao criar o usuário no sistema de autenticação." }, { status: 500, headers: corsHeaders });
    }
    const newAuthUserId = authUserResponse.user.id;
    console.log("Usuário de autenticação criado com ID:", newAuthUserId);

    // 4. Insere o perfil na tabela 'usuario'
    console.log("Inserindo perfil na tabela 'usuario'...");
    const { data: newUser, error: insertUserErr } = await admin
      .from("usuario")
      .insert({
        nome: body.nome,
        email: body.email,
        sexo: body.sexo,
        id_cargo: body.id_cargo,
        data_nascimento: body.data_nascimento,
        role: "LIDERADO",
        auth_user_id: newAuthUserId,
      })
      .select("id")
      .single();

    if (insertUserErr) {
      console.error("Falha ao inserir o perfil do usuário na tabela 'usuario':", insertUserErr);
      await admin.auth.admin.deleteUser(newAuthUserId); // Rollback
      return Response.json({ error: "Falha ao inserir o perfil do usuário." }, { status: 500, headers: corsHeaders });
    }
    const newLideradoId = (newUser as Usuario).id;
    console.log("Perfil do liderado inserido com ID:", newLideradoId);

    // 5. Cria o vínculo entre líder e liderado
    console.log("Criando vínculo entre líder e liderado...");
    const { error: linkErr } = await admin.from("lider_liderado").insert({
      lider_id: leaderRow.id,
      liderado_id: newLideradoId,
    });

    if (linkErr) {
      console.error("Falha ao vincular o liderado ao líder:", linkErr);
      await admin.auth.admin.deleteUser(newAuthUserId); // Rollback completo
      await admin.from("usuario").delete().eq("id", newLideradoId);
      return Response.json({ error: "Falha ao vincular o liderado ao líder." }, { status: 500, headers: corsHeaders });
    }
    console.log("Vínculo criado com sucesso.");

    // Sucesso
    console.log("Liderado criado com sucesso. Enviando resposta.");
    return Response.json({
      ok: true,
      liderado_id: newLideradoId,
      email: body.email,
      temporaryPassword: tempPassword, 
    }, { headers: corsHeaders });

  } catch (e: any) {
    console.error("Erro inesperado na Edge Function 'create-liderado':", e);
    return Response.json({ error: e?.message ?? "Erro inesperado no servidor." }, { status: 500, headers: corsHeaders });
  }
});