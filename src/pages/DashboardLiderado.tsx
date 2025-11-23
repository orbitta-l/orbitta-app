import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Calendar as CalendarIcon,
  ClipboardCheck,
  Filter,
  Lightbulb,
  LogOut,
  Target,
} from "lucide-react";
import { generateMaturitySummary } from "@/utils/summaryUtils";
import { StrategicSummaryCard } from "@/components/StrategicSummaryCard";
import { QuickInsights } from "@/components/QuickInsights";
import { softSkillTemplates } from "@/data/evaluationTemplates";
import { MOCK_COMPETENCIAS } from "@/data/mockData";

export default function DashboardLiderado() {
  const { profile, logout, lideradoDashboardData, loading } = useAuth();
  const navigate = useNavigate();

  const hasData = !!lideradoDashboardData && !!lideradoDashboardData.ultima_avaliacao;
  const nextLevelId = "cargo_especialista_i";
  const nextLevelName = "Especialista I";

  const [activeSkillTab, setActiveSkillTab] = useState<"all" | "soft" | "hard">("all");
  const [selectedHardCategory, setSelectedHardCategory] = useState<string>("all");

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const dashboardInsights = useMemo(() => {
    if (!hasData || !lideradoDashboardData || !lideradoDashboardData.ultima_avaliacao) {
      return {
        competenciasVersus: [],
        categoryPerformanceData: [],
        availableHardCategories: [],
        greatestStrength: null,
        biggestImprovementArea: null,
        strategicSummary: generateMaturitySummary("N/A"),
        maturityLevel: "N/A" as const,
        behavioralAnalysis: "Aguardando avaliação",
      };
    }

    // Lógica para gráficos
    const softSkillsData = lideradoDashboardData.competencias
      .filter((c) => c.tipo === "COMPORTAMENTAL")
      .map((c) => ({
        competency: c.nome_competencia,
        atual: c.pontuacao_1a4,
        ideal: c.nota_ideal || 4.0,
      }));

    const hardSkillsData = lideradoDashboardData.competencias
      .filter((c) => c.tipo === "TECNICA")
      .map((c) => ({
        competency: c.nome_competencia,
        atual: c.pontuacao_1a4,
        ideal: c.nota_ideal || 4.0,
        categoria: c.categoria_nome,
      }));

    let filteredData: { competency: string; atual: number; ideal: number }[] = [];
    if (activeSkillTab === "soft") filteredData = softSkillsData;
    else if (activeSkillTab === "hard")
      filteredData =
        selectedHardCategory === "all"
          ? hardSkillsData
          : hardSkillsData.filter((hs) => hs.categoria === selectedHardCategory);
    else filteredData = [...softSkillsData, ...hardSkillsData];

    const competenciasVersus = filteredData.filter(
      (c) => c.atual > 0 || filteredData.length === 1,
    );

    const categoryMap = new Map<string, { soma: number; count: number }>();
    hardSkillsData.forEach((comp) => {
      if (comp.categoria) {
        const existing = categoryMap.get(comp.categoria);
        if (existing) {
          existing.soma += comp.atual;
          existing.count += 1;
        } else {
          categoryMap.set(comp.categoria, { soma: comp.atual, count: 1 });
        }
      }
    });

    const categoryPerformanceData = Array.from(categoryMap.entries()).map(
      ([category, { soma, count }]) => ({ category, atual: soma / count, ideal: 4.0 }),
    );
    const availableHardCategories = Array.from(new Set(hardSkillsData.map((c) => c.categoria!)));

    // Lógica para Insights rápidos
    let greatestStrength: string | null = null;
    let biggestImprovementArea: string | null = null;
    if (lideradoDashboardData.competencias.length > 0) {
      const sortedByScore = [...lideradoDashboardData.competencias].sort(
        (a, b) => b.pontuacao_1a4 - a.pontuacao_1a4,
      );
      greatestStrength = sortedByScore[0].nome_competencia;

      const sortedByGap = [...lideradoDashboardData.competencias]
        .map((c) => ({ ...c, gap: (c.nota_ideal || 4.0) - c.pontuacao_1a4 }))
        .sort((a, b) => b.gap - a.gap);
      biggestImprovementArea = sortedByGap[0].nome_competencia;
    }

    let behavioralAnalysis: string = "N/A";
    if (softSkillsData.length > 0) {
      const avgActual = softSkillsData.reduce((sum, s) => sum + s.atual, 0) / softSkillsData.length;
      const avgIdeal = softSkillsData.reduce((sum, s) => sum + s.ideal, 0) / softSkillsData.length;
      if (avgActual >= avgIdeal) behavioralAnalysis = "Acima ou na média do ideal";
      else if (avgActual >= 2.5) behavioralAnalysis = "Em bom desenvolvimento";
      else behavioralAnalysis = "Abaixo da média do ideal";
    }

    const maturityLevel = lideradoDashboardData.ultima_avaliacao.maturidade_quadrante;
    const strategicSummary = generateMaturitySummary(maturityLevel);

    return {
      competenciasVersus,
      categoryPerformanceData,
      availableHardCategories,
      greatestStrength,
      biggestImprovementArea,
      strategicSummary,
      maturityLevel,
      behavioralAnalysis,
    };
  }, [hasData, lideradoDashboardData, activeSkillTab, selectedHardCategory]);

  const nextLevelProgress = useMemo(() => {
    const template = softSkillTemplates.find((t) => t.id_cargo === nextLevelId);

    if (!template || !lideradoDashboardData) {
      return {
        overallProgressPct: 0,
        focusAreas: [],
        competenciesProgress: [],
      };
    }

    const currentScores = new Map(
      lideradoDashboardData.competencias.map((c) => [c.id_competencia, c]),
    );

    const weightedCompetencies = template.competencias.filter((c) => (c.peso || 0) > 0);

    const competenciesProgress = weightedCompetencies.map((templateComp) => {
      const target = MOCK_COMPETENCIAS.find((c) => c.id_competencia === templateComp.id_competencia);
      const current = currentScores.get(templateComp.id_competencia);
      const currentScore = current?.pontuacao_1a4 ?? 0;
      const idealScore = templateComp.nota_ideal || 4;
      const progress = Math.min(currentScore / idealScore, 1);

      return {
        id: templateComp.id_competencia,
        name: target?.nome_competencia || "Competência",
        currentScore,
        idealScore,
        progress,
        weight: templateComp.peso || 1,
      };
    });

    const totalWeight = competenciesProgress.reduce((sum, comp) => sum + comp.weight, 0);
    const overallProgressPct =
      totalWeight === 0
        ? 0
        : Math.round(
            (competenciesProgress.reduce(
              (sum, comp) => sum + comp.progress * comp.weight,
              0,
            ) /
              totalWeight) *
              100,
          );

    const focusAreas = [...competenciesProgress]
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 3);

    return { overallProgressPct, focusAreas, competenciesProgress };
  }, [lideradoDashboardData, nextLevelId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Lightbulb className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meu Desenvolvimento</h1>
            <p className="text-sm text-muted-foreground">Bem-vindo(a), {profile?.nome || "Liderado"}</p>
          </div>
          <Button onClick={handleLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {!hasData ? (
          <Card className="p-8 text-center bg-muted/20">
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Você ainda não possui avaliações</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Aguarde seu líder realizar a primeira avaliação para visualizar seu progresso e plano de desenvolvimento.
              </p>
              <Card className="p-6 text-left bg-card mb-6">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-accent" />Como funciona a Metodologia Orbitta
                </h3>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">1.</span>
                    <p>Seu líder realiza uma avaliação abrangente das suas competências técnicas e comportamentais</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">2.</span>
                    <p>Você recebe um perfil de maturidade (M1 a M4) baseado no desempenho geral</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">3.</span>
                    <p>Visualize gaps de conhecimento comparando seu perfil atual com o ideal do cargo</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-primary">4.</span>
                    <p>Acompanhe seu plano de desenvolvimento personalizado com objetivos claros</p>
                  </div>
                </div>
              </Card>
              <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
                Voltar ao Início
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent" />Resumo Rápido
                </CardTitle>
                <CardDescription>Seus números essenciais em um só lugar.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-lg border border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">Competências avaliadas</p>
                    <p className="text-3xl font-bold text-foreground">
                      {lideradoDashboardData?.competencias.length || 0}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border border-border bg-muted/20">
                    <p className="text-sm text-muted-foreground">Última Avaliação</p>
                    <p className="text-lg font-semibold text-foreground">
                      {lideradoDashboardData?.ultima_avaliacao?.data_avaliacao
                        ? formatDistanceToNow(
                            lideradoDashboardData.ultima_avaliacao.data_avaliacao,
                            { addSuffix: true, locale: ptBR },
                          )
                        : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lideradoDashboardData?.ultima_avaliacao?.data_avaliacao
                        ? lideradoDashboardData.ultima_avaliacao.data_avaliacao.toLocaleDateString("pt-BR")
                        : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-primary/30 bg-gradient-to-r from-primary/10 via-background to-background shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start gap-4 flex-col md:flex-row">
                  <div>
                    <CardTitle className="text-lg text-muted-foreground">Plano de Voo (Soft Skills)</CardTitle>
                    <CardTitle className="text-2xl mt-1 flex items-center gap-2 text-foreground">
                      Seu Próximo Nível: <span className="text-primary">{nextLevelName}</span>
                    </CardTitle>
                    <CardDescription>Progresso nas competências comportamentais para o próximo nível. Hard Skills aparecem abaixo como estado técnico atual.</CardDescription>
                  </div>
                  <Badge variant="secondary" className="text-primary bg-primary/10">
                    Atual: {lideradoDashboardData?.cargo_nome || "Cargo"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
                <div className="grid sm:grid-cols-[1fr,1.2fr] gap-6 items-center">
                  <div className="relative h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart
                        innerRadius="70%"
                        outerRadius="90%"
                        data={[
                          {
                            name: "Progresso",
                            value: nextLevelProgress.overallProgressPct,
                            fill: "hsl(var(--primary))",
                          },
                        ]}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                        <RadialBar dataKey="value" cornerRadius={10} background />
                      </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-sm text-muted-foreground">Progresso geral</p>
                      <p className="text-4xl font-bold text-foreground">{nextLevelProgress.overallProgressPct}%</p>
                      <p className="text-xs text-muted-foreground">rumo a {nextLevelName}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-foreground">Foco principal para evoluir</h4>
                    {nextLevelProgress.focusAreas.map((area) => {
                      const missing = Math.max(0, (area.idealScore || 4) - (area.currentScore || 0)).toFixed(1);
                      return (
                        <div key={area.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card/70">
                          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                            {Math.round(area.progress * 100)}%
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground leading-tight">{area.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Falta cerca de {missing} pts para atingir o ideal de {area.idealScore.toFixed(1)}.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {nextLevelProgress.focusAreas.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aguardando dados da sua avaliação para criar um foco preciso.
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-foreground">Competências-chave de {nextLevelName}</h4>
                    <span className="text-xs text-muted-foreground">Baseado no template do cargo</span>
                  </div>
                  <div className="space-y-3">
                    {nextLevelProgress.competenciesProgress.map((comp) => (
                      <div key={comp.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-foreground">
                          <span className="font-medium">{comp.name}</span>
                          <span className="text-muted-foreground">
                            {comp.currentScore.toFixed(1)} / {comp.idealScore.toFixed(1)}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${Math.min(comp.progress * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {nextLevelProgress.competenciesProgress.length === 0 && (
                      <p className="text-sm text-muted-foreground">Ainda não há competências mapeadas para este cargo.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />Maturidade Atual
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {lideradoDashboardData?.ultima_avaliacao?.maturidade_quadrante || "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">{lideradoDashboardData?.cargo_nome || "Cargo"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />Competências Avaliadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-foreground">
                    {lideradoDashboardData?.competencias.length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">total de avaliações registradas</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />Última Avaliação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-foreground">
                    {lideradoDashboardData?.ultima_avaliacao?.data_avaliacao
                      ? formatDistanceToNow(lideradoDashboardData.ultima_avaliacao.data_avaliacao, { addSuffix: true, locale: ptBR })
                      : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lideradoDashboardData?.ultima_avaliacao?.data_avaliacao
                      ? lideradoDashboardData.ultima_avaliacao.data_avaliacao.toLocaleDateString("pt-BR")
                      : ""}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />Diagnóstico da Última Avaliação
                      </CardTitle>
                      <CardDescription>Veja seus gaps atuais no cargo e o que isso significa.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr] items-start">
                    <div className="shadow-inner rounded-xl border border-border p-3">
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                        <Tabs
                          value={activeSkillTab}
                          onValueChange={(v: any) => {
                            setActiveSkillTab(v);
                            setSelectedHardCategory("all");
                          }}
                          className="w-full md:w-auto"
                        >
                          <TabsList className="grid w-full md:w-[360px] grid-cols-3">
                            <TabsTrigger value="all">Todas</TabsTrigger>
                            <TabsTrigger value="soft">Comportamentais</TabsTrigger>
                            <TabsTrigger value="hard">Técnicas</TabsTrigger>
                          </TabsList>
                        </Tabs>
                        {activeSkillTab === "hard" && dashboardInsights.availableHardCategories.length > 0 && (
                          <Select value={selectedHardCategory} onValueChange={setSelectedHardCategory}>
                            <SelectTrigger className="w-full md:w-64">
                              <SelectValue placeholder="Filtrar por Categoria Técnica" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Todas as Categorias Técnicas</SelectItem>
                              {dashboardInsights.availableHardCategories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      <ResponsiveContainer width="100%" height={420}>
                        {dashboardInsights.competenciasVersus.length === 0 ? (
                          <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
                            <p className="text-muted-foreground text-center px-4">
                              Nenhuma competência selecionada ou dados insuficientes.
                            </p>
                          </div>
                        ) : (
                          <RadarChart data={dashboardInsights.competenciasVersus}>
                            <PolarGrid stroke="hsl(var(--border))" />
                            <PolarAngleAxis
                              dataKey="competency"
                              tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }}
                            />
                            <PolarRadiusAxis angle={90} domain={[0, 4]} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                            <Radar
                              name="Perfil Ideal"
                              dataKey="ideal"
                              stroke="hsl(var(--primary))"
                              fill="hsl(var(--primary))"
                              fillOpacity={0.2}
                              strokeWidth={2}
                            />
                            <Radar
                              name="Meu Perfil Atual"
                              dataKey="atual"
                              stroke="hsl(var(--accent))"
                              fill="hsl(var(--accent))"
                              fillOpacity={0.4}
                              strokeWidth={2}
                            />
                            <Legend wrapperStyle={{ paddingTop: "12px" }} iconType="circle" />
                          </RadarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-muted/40 border border-border">
                        <p className="text-sm text-muted-foreground mb-1">Maturidade Atual</p>
                        <p className="text-3xl font-bold text-foreground">
                          {lideradoDashboardData?.ultima_avaliacao?.maturidade_quadrante || "N/A"}
                        </p>
                        <p className="text-sm text-muted-foreground">{lideradoDashboardData?.cargo_nome || "Cargo"}</p>
                      </div>
                      <StrategicSummaryCard summaryText={dashboardInsights.strategicSummary} />
                      <QuickInsights
                        maturity={dashboardInsights.maturityLevel}
                        behavioralAnalysis={dashboardInsights.behavioralAnalysis}
                        strength={dashboardInsights.greatestStrength}
                        improvementArea={dashboardInsights.biggestImprovementArea}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="w-5 h-5 text-primary" />Análise Detalhada por Área
                    </CardTitle>
                    <CardDescription>Veja como está sua média em cada frente técnica.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  {dashboardInsights.categoryPerformanceData.length === 0 ? (
                    <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg">
                      <p className="text-muted-foreground text-center">Nenhum dado de categoria para exibir.</p>
                    </div>
                  ) : (
                    <BarChart data={dashboardInsights.categoryPerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="category" tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} />
                      <YAxis domain={[0, 4]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Bar dataKey="atual" fill="hsl(var(--accent))" name="Meu Nível" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="ideal" fill="hsl(var(--primary))" name="Nível Ideal" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
