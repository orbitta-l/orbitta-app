import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
  useCallback,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Usuario,
  Avaliacao,
  PontuacaoAvaliacao,
  LideradoDashboard,
  calcularIdade,
  NivelMaturidade,
} from "@/types/mer";
import {
  MOCK_CARGOS,
  MOCK_COMPETENCIAS,
  MOCK_ESPECIALIZACOES,
  MOCK_CATEGORIAS,
} from "@/data/mockData";
import {
  getCurrentSession,
  loginWithEmail,
  logoutUser,
  subscribeToAuthChanges,
} from "@/services/authService";
import {
  getLeaderDashboardData,
  getLideradoDashboardData,
} from "@/services/teamService";
import {
  getMyProfileRow,
  updateFirstLoginStatusOnUsuarioTable,
} from "@/services/userService";
import {
  SaveEvaluationInput,
  saveEvaluationTransaction,
} from "@/services/evaluationService";

interface MemberXYData {
  liderado_id: number;
  x_tecnico: number | null;
  y_comp: number | null;
  quadrante: NivelMaturidade | "N/A";
}

interface AuthContextType {
  session: Session | null;
  profile: Usuario | null;
  isAuthenticated: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  // Dados do Líder
  liderados: Usuario[];
  avaliacoes: Avaliacao[];
  pontuacoes: PontuacaoAvaliacao[];
  teamData: LideradoDashboard[];
  isPrimeiroAcesso: boolean;
  fetchTeamData: () => Promise<void>;
  // Dados do Liderado
  lideradoDashboardData: LideradoDashboard | null;
  fetchLideradoDashboardData: (lideradoId: number) => Promise<void>;
  loading: boolean;
  saveEvaluation: (
    input: SaveEvaluationInput,
  ) => Promise<{
    success: boolean;
    maturidade?: NivelMaturidade | "N/A";
    error?: string;
  }>;
  updateFirstLoginStatus: (authUid: string) => Promise<{
    success: boolean;
    error?: string;
    updatedProfile?: Usuario | null;
  }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Usuario | null>(null);
  const [liderados, setLiderados] = useState<Usuario[]>([]);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);
  const [pontuacoes, setPontuacoes] = useState<PontuacaoAvaliacao[]>([]);
  const [memberXYData, setMemberXYData] = useState<MemberXYData[]>([]);
  const [lideradoDashboardData, setLideradoDashboardData] =
    useState<LideradoDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const isRecoveryFlow =
    location.pathname === "/set-new-password" &&
    (location.hash.includes("type=recovery") ||
      location.search.includes("type=recovery"));

  const fetchLideradoDashboardData = useCallback(async (lideradoId: number) => {
    const { data, error } = await getLideradoDashboardData(lideradoId);

    if (error || !data) {
      console.error("Erro ao buscar dados do dashboard do liderado:", error);
      setLideradoDashboardData(null);
      return;
    }

    const rawData = data as any;
    const profileData = rawData.profile;
    const ultimaAvaliacaoData = rawData.ultima_avaliacao;
    const competenciasData = rawData.competencias;

    const mappedLideradoDashboard: LideradoDashboard = {
      id_usuario: String(profileData.id_usuario),
      nome: profileData.nome,
      email: profileData.email,
      senha_hash: "",
      role: profileData.role,
      id_cargo: profileData.id_cargo,
      lider_id: null,
      sexo: profileData.sexo,
      data_nascimento: profileData.data_nascimento,
      ativo: profileData.ativo,
      avatar_url: profileData.avatar_url,
      idade: profileData.idade,
      cargo_nome: profileData.cargo_nome,
      first_login: profileData.first_login,
      ultima_avaliacao: ultimaAvaliacaoData
        ? {
            media_comportamental_1a4:
              ultimaAvaliacaoData.media_comportamental_1a4,
            media_tecnica_1a4: ultimaAvaliacaoData.media_tecnica_1a4,
            maturidade_quadrante: ultimaAvaliacaoData.maturidade_quadrante,
            data_avaliacao: new Date(
              `${ultimaAvaliacaoData.data_avaliacao}Z`,
            ),
          }
        : undefined,
      competencias: competenciasData
        ? competenciasData.map((c: any) => ({
            id_avaliacao: String(ultimaAvaliacaoData?.id_avaliacao || ""),
            id_competencia: String(c.id_competencia),
            pontuacao_1a4: c.pontuacao_1a4,
            peso_aplicado: c.peso_aplicado,
            nome_competencia: c.nome_competencia,
            tipo: c.tipo,
            categoria_nome: c.categoria_nome,
            especializacao_nome: c.especializacao_nome,
            nota_ideal: c.nota_ideal,
          }))
        : [],
      categoria_dominante: profileData.categoria_dominante,
      especializacao_dominante: profileData.especializacao_dominante,
    };

    setLideradoDashboardData(mappedLideradoDashboard);
  }, []);

  const fetchTeamData = useCallback(async (liderId: number) => {
    if (!liderId) return;

    const { data: dashboardData, error: dashboardError } =
      await getLeaderDashboardData(liderId);

    if (dashboardError || !dashboardData) {
      console.error(
        "Erro ao buscar dados do dashboard do líder:",
        dashboardError,
      );
      setLiderados([]);
      setAvaliacoes([]);
      setPontuacoes([]);
      setMemberXYData([]);
      return;
    }

    const rawData = dashboardData as any;

    const currentLiderados = (rawData.liderados || []).map((l: any) => ({
      ...l,
      id_usuario: String(l.id),
      lider_id: l.lider_id ? String(l.lider_id) : null,
    })) as Usuario[];
    setLiderados(currentLiderados);

    const formattedAvaliacoes = (rawData.avaliacoes || []).map((a: any) => ({
      ...a,
      id_avaliacao: String(a.id),
      lider_id: String(a.id_lider),
      liderado_id: String(a.id_liderado),
      id_cargo: String(a.cargo_referenciado),
      data_avaliacao: new Date(`${a.data_avaliacao}Z`),
      media_comportamental_1a4: a.media_comportamental,
      media_tecnica_1a4: a.media_tecnica,
      maturidade_quadrante: a.nivel_maturidade,
    })) as Avaliacao[];
    setAvaliacoes(formattedAvaliacoes);

    const formattedPontuacoes = (rawData.pontuacoes || []).map((p: any) => ({
      ...p,
      id_avaliacao: String(p.id_avaliacao),
      id_competencia: String(p.id_competencia),
      pontuacao_1a4: p.pontuacao,
      peso_aplicado: p.peso,
    })) as PontuacaoAvaliacao[];
    setPontuacoes(formattedPontuacoes);

    setMemberXYData((rawData.memberXYData || []) as MemberXYData[]);
  }, []);

  const updateFirstLoginStatus = useCallback(
    async (authUid: string) => {
      try {
        const result = await updateFirstLoginStatusOnUsuarioTable(authUid);
        if (!result.success) {
          throw new Error(
            result.error || "Falha ao atualizar status de primeiro login.",
          );
        }

        // Atualiza o estado de perfil de forma previsível e utilizável
        const updatedProfile: Usuario | null = profile ? { ...profile, first_login: false } : null;
        setProfile(updatedProfile);

        if (updatedProfile && updatedProfile.role === "LIDERADO") {
          await fetchLideradoDashboardData(Number(updatedProfile.id_usuario));
        }

        return { success: true, updatedProfile };
      } catch (e: any) {
        console.error("Erro ao atualizar status de primeiro login:", e);
        return { success: false, error: e.message };
      }
    },
    [fetchLideradoDashboardData],
  );

  useEffect(() => {
    const fetchProfileAndData = async (_user: User) => {
      const { data: profileData, error: profileError } =
        await getMyProfileRow();

      if (profileError || !profileData) {
        console.error(
          "Erro ao buscar perfil via RPC ou perfil não encontrado:",
          profileError,
        );
        setProfile(null);
        return;
      }

      const dbProfile = profileData as any;
      const appProfile: Usuario = {
        ...dbProfile,
        id_usuario: String(dbProfile.id),
        lider_id: dbProfile.lider_id ? String(dbProfile.lider_id) : null,
        first_login: dbProfile.first_login,
      };

      // Adiciona a lógica para associar o cargo de Tech Lead ao LÍDER
      if (appProfile.role === "LIDER") {
        appProfile.id_cargo = "cargo_tech_lead";
      }

      setProfile(appProfile);

      const targetDashboard =
        appProfile.role === "LIDER"
          ? "/dashboard-lider"
          : "/dashboard-liderado";
      const targetFirstLogin = "/set-new-password";
      const currentPath = location.pathname;

      if (appProfile.role === "LIDERADO" && appProfile.first_login) {
        if (currentPath !== targetFirstLogin && !isRecoveryFlow) {
          navigate(targetFirstLogin, { replace: true });
        }
      } else if (
        currentPath === "/login" ||
        currentPath === "/" ||
        (currentPath === "/set-new-password" && !isRecoveryFlow)
      ) {
        navigate(targetDashboard, { replace: true });
      }
    };

    const getInitialSession = async () => {
      setLoading(true);
      const { session } = await getCurrentSession();
      setSession(session || null);

      if (session) {
        await fetchProfileAndData(session.user);
      } else {
        setProfile(null);
        // não redireciona se estiver no fluxo de recuperação
        if (!isRecoveryFlow) {
          if (
            location.pathname.startsWith("/dashboard") ||
            location.pathname.startsWith("/team") ||
            location.pathname.startsWith("/evaluation") ||
            location.pathname.startsWith("/settings")
          ) {
            navigate("/", { replace: true });
          }
        }
      }
      setLoading(false);
    };

    getInitialSession();

    const { data: authListener } = subscribeToAuthChanges(
      async (_event, session) => {
        setSession(session);
        if (session) {
          await fetchProfileAndData(session.user);
        } else {
          setProfile(null);
          setLiderados([]);
          setAvaliacoes([]);
          setPontuacoes([]);
          setMemberXYData([]);
          setLideradoDashboardData(null);
          if (!isRecoveryFlow) {
            if (
              location.pathname !== "/" &&
              location.pathname !== "/login"
            ) {
              navigate("/", { replace: true });
            }
          }
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, isRecoveryFlow]);

  useEffect(() => {
    if (!profile || !profile.id_usuario) return;

    const isLeader = profile.role === "LIDER";
    const isLiderado = profile.role === "LIDERADO";
    const onLeaderRoutes =
      location.pathname.startsWith("/dashboard-lider") ||
      location.pathname.startsWith("/team") ||
      location.pathname.startsWith("/evaluation");
    const onLideradoRoutes =
      location.pathname.startsWith("/dashboard-liderado");

    if (isLeader && onLeaderRoutes) {
      fetchTeamData(Number(profile.id_usuario));
      setLideradoDashboardData(null);
    }

    if (isLiderado && !profile.first_login && onLideradoRoutes) {
      fetchLideradoDashboardData(Number(profile.id_usuario));
    }
  }, [profile, location.pathname, fetchTeamData, fetchLideradoDashboardData]);

  const saveEvaluation = async (input: SaveEvaluationInput) => {
    if (!session) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const result = await saveEvaluationTransaction(input);

    if (result.success) {
      if (profile?.role === "LIDER" && profile.id_usuario) {
        await fetchTeamData(Number(profile.id_usuario));
      }
      if (
        profile?.role === "LIDERADO" &&
        profile.id_usuario === input.lideradoId
      ) {
        await fetchLideradoDashboardData(Number(profile.id_usuario));
      }
    }

    return result;
  };

  const login = async (email: string, password: string) => {
    return await loginWithEmail(email, password);
  };

  const logout = async () => {
    await logoutUser();
  };

  const isPrimeiroAcesso = useMemo(() => {
    if (!profile || profile.role !== "LIDER") return false;
    return liderados.length === 0 || avaliacoes.length === 0;
  }, [profile, liderados, avaliacoes]);

  const teamData = useMemo((): LideradoDashboard[] => {
    if (!profile || profile.role !== "LIDER") return [];
    return liderados.map((liderado) => {
      const xyData = memberXYData.find(
        (d) => String(d.liderado_id) === liderado.id_usuario,
      );
      const ultimaAvaliacao = avaliacoes
        .filter((a) => a.liderado_id === liderado.id_usuario)
        .sort(
          (a, b) =>
            b.data_avaliacao.getTime() - a.data_avaliacao.getTime(),
        )[0];
      const cargo = MOCK_CARGOS.find(
        (c) => c.id_cargo === liderado.id_cargo,
      );
      let competenciasConsolidadas: LideradoDashboard["competencias"] = [];
      let categoria_dominante = "Não Avaliado";
      let especializacao_dominante = "Não Avaliado";

      if (ultimaAvaliacao) {
        const pontuacoesDaAvaliacao = pontuacoes.filter(
          (p) => p.id_avaliacao === ultimaAvaliacao.id_avaliacao,
        );
        competenciasConsolidadas = pontuacoesDaAvaliacao.map((p) => {
          const competencia = MOCK_COMPETENCIAS.find(
            (c) => c.id_competencia === p.id_competencia,
          );
          const especializacao = competencia?.id_especializacao
            ? MOCK_ESPECIALIZACOES.find(
                (e) =>
                  e.id_especializacao === competencia.id_especializacao,
              )
            : null;
          const categoria = especializacao
            ? MOCK_CATEGORIAS.find(
                (cat) => cat.id_categoria === especializacao.id_categoria,
              )
            : null;
          return {
            ...p,
            nome_competencia: competencia?.nome_competencia || "Desconhecida",
            tipo: competencia?.tipo || "TECNICA",
            categoria_nome:
              categoria?.nome_categoria ||
              (competencia?.tipo === "COMPORTAMENTAL"
                ? "Soft Skills"
                : "N/A"),
            especializacao_nome:
              especializacao?.nome_especializacao || "N/A",
          };
        });
        const hardSkills = competenciasConsolidadas.filter(
          (c) => c.tipo === "TECNICA",
        );
        if (hardSkills.length > 0) {
          const categoryScores = hardSkills.reduce(
            (acc, skill) => {
              if (skill.categoria_nome && skill.categoria_nome !== "N/A") {
                acc[skill.categoria_nome] =
                  (acc[skill.categoria_nome] || 0) +
                  skill.pontuacao_1a4;
              }
              return acc;
            },
            {} as Record<string, number>,
          );
          categoria_dominante = Object.keys(categoryScores).reduce(
            (a, b) => (categoryScores[a] > categoryScores[b] ? a : b),
            "Não Avaliado",
          );
          const specializationScores = hardSkills.reduce(
            (acc, skill) => {
              if (
                skill.especializacao_nome &&
                skill.especializacao_nome !== "N/A"
              ) {
                acc[skill.especializacao_nome] =
                  (acc[skill.especializacao_nome] || 0) +
                  skill.pontuacao_1a4;
              }
              return acc;
            },
            {} as Record<string, number>,
          );
          especializacao_dominante = Object.keys(
            specializationScores,
          ).reduce(
            (a, b) =>
              specializationScores[a] > specializationScores[b] ? a : b,
            "Não Avaliado",
          );
        }
      }
      return {
        ...liderado,
        idade: calcularIdade(liderado.data_nascimento),
        cargo_nome: cargo?.nome_cargo || "Não definido",
        ultima_avaliacao: xyData
          ? {
              media_comportamental_1a4: xyData.y_comp || 0,
              media_tecnica_1a4: xyData.x_tecnico || 0,
              maturidade_quadrante: xyData.quadrante,
              data_avaliacao:
                ultimaAvaliacao?.data_avaliacao || new Date(),
            }
          : undefined,
        competencias: competenciasConsolidadas,
        categoria_dominante,
        especializacao_dominante,
      };
    });
  }, [profile, liderados, avaliacoes, pontuacoes, memberXYData]);

  const value: AuthContextType = {
    session,
    profile,
    isAuthenticated: !!session,
    login,
    logout,
    liderados,
    avaliacoes,
    pontuacoes,
    teamData,
    lideradoDashboardData,
    isPrimeiroAcesso,
    loading,
    fetchTeamData: () =>
      profile?.id_usuario
        ? fetchTeamData(Number(profile.id_usuario))
        : Promise.resolve(),
    fetchLideradoDashboardData,
    saveEvaluation,
    updateFirstLoginStatus,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
