import React, { useState } from "react";
import { Plus, Search, Users, ArrowRight, Filter, X, Code, Smartphone, Brain, Cloud, Shield, Palette, Star, PersonStanding, CircleUserRound, CircleUser, HeartHandshake, UserRound, User as UserIcon, Mail } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useNavigate, createSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Progress } from "@/components/ui/progress";
import { z } from "zod";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LideradoDashboard, NivelMaturidade } from "@/types/mer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { MOCK_CARGOS } from "@/data/mockData";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { useTeamFilters, ActiveFilters } from "@/hooks/use-team-filters";
import { getGapColorClass } from "@/utils/colorUtils";

const categoryIcons: Record<string, React.ElementType> = {
  "Desenvolvimento Web": Code,
  "Desenvolvimento Mobile": Smartphone,
  "Ciência de Dados e IA": Brain,
  "Cloud e DevOps": Cloud,
  "Segurança da Informação": Shield,
  "UX/UI Design": Palette,
  "Soft Skills": HeartHandshake,
  "Não Avaliado": CircleUserRound,
};

const genderIcons: Record<string, React.ElementType> = {
  FEMININO: UserRound,
  MASCULINO: UserIcon,
  NAO_BINARIO: CircleUser,
  NAO_INFORMADO: CircleUserRound,
};

const getCategoryIcon = (categoryName: string): React.ElementType => categoryIcons[categoryName] || CircleUserRound;
const getGenderIcon = (gender: string): React.ElementType => genderIcons[gender] || UserIcon;
const getInitials = (name: string) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "";

const step1Schema = z.object({
  nome: z.string().min(2, "Nome é obrigatório"),
  email: z.string().email('E-mail inválido').min(1, "E-mail é obrigatório"),
  id_cargo: z.string().min(1, "Cargo é obrigatório"),
  sexo: z.enum(["FEMININO", "MASCULINO", "NAO_BINARIO", "NAO_INFORMADO"], { required_error: "Sexo é obrigatório" }),
  data_nascimento: z.string().min(1, "Data de nascimento é obrigatória").refine((val) => {
    const birthDate = new Date(val);
    const today = new Date();
    birthDate.setMinutes(birthDate.getMinutes() + birthDate.getTimezoneOffset());
    if (birthDate > today) return false;
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
    return age >= 14;
  }, "Data inválida ou idade mínima de 14 anos não atingida."),
});

type Step1Form = z.infer<typeof step1Schema>;

export default function Team() {
  const navigate = useNavigate();
  const { profile, teamData, fetchTeamData } = useAuth();
  const [searchName, setSearchName] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const [tempPassword, setTempPassword] = useState("");
  const [provisionedData, setProvisionedData] = useState<Step1Form | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [selectedMembersForComparison, setSelectedMembersForComparison] = useState<string[]>([]);

  const { activeFilters, setFilter, resetFilters, activeFilterCount, filteredMembers, filterOptions } = useTeamFilters(teamData, searchName);

  const { register, control, formState: { errors }, trigger, getValues, reset } = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    mode: "onBlur",
  });

  const handleSetFilter = <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => {
    setFilter(key, value);
    if (key === 'category') {
      setFilter('specialization', 'all');
      setFilter('competency', 'all');
    }
    if (key === 'specialization') {
      setFilter('competency', 'all');
    }
  };

  const handleMaturityChange = (value: NivelMaturidade) => {
    const current = activeFilters.maturity;
    const newMaturity = current.includes(value) ? current.filter(m => m !== value) : [...current, value];
    setFilter('maturity', newMaturity);
  };

  const handleToggleComparisonMode = () => {
    setIsComparisonMode(prev => !prev);
    setSelectedMembersForComparison([]);
  };

  const handleSelectMemberForComparison = (memberId: string) => {
    setSelectedMembersForComparison(prev => {
      if (prev.includes(memberId)) return prev.filter(id => id !== memberId);
      if (prev.length < 4) return [...prev, memberId];
      toast({ title: "Limite atingido", description: "Você pode comparar no máximo 4 liderados.", variant: "destructive" });
      return prev;
    });
  };

  const handleNavigateToCompare = () => {
    if (selectedMembersForComparison.length < 2) {
      toast({ title: "Selecione mais membros", description: "Você precisa de pelo menos 2 membros para comparar.", variant: "destructive" });
      return;
    }
    navigate({
      pathname: "/compare",
      search: createSearchParams({ members: selectedMembersForComparison.join(',') }).toString(),
    });
  };

  const handleNextStep = async () => {
    const isValid = await trigger();
    if (isValid) {
      setProvisionedData(getValues());
      setModalStep(2);
    }
  };

  const handleConclude = async () => {
    if (!provisionedData || !profile) return;
    setIsSubmitting(true);
    
    console.log("Frontend: Chamando Edge Function 'create-liderado' com dados:", provisionedData); // Log de depuração
    
    try {
      const { data, error } = await supabase.functions.invoke('create-liderado', { 
        body: { ...provisionedData },
        method: 'POST' // Força o método POST
      });
      if (error) throw new Error(error.message || "Ocorreu um erro desconhecido.");
      const responseData = data as { temporaryPassword?: string, error?: string };
      if (responseData?.temporaryPassword) {
        setTempPassword(responseData.temporaryPassword);
        toast({ title: "Liderado provisionado!", description: "Compartilhe a senha temporária com o novo membro." });
        await fetchTeamData();
        setModalStep(3);
      } else {
        throw new Error(responseData?.error || "Resposta da função incompleta ou sem senha.");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro no cadastro", description: err.message || "Erro inesperado no servidor." });
      console.error("Frontend: Erro ao invocar Edge Function:", err); // Log de erro no frontend
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setIsAddDialogOpen(false);
    setTimeout(() => {
      setModalStep(1);
      setTempPassword("");
      setProvisionedData(null);
      reset();
    }, 300);
  };

  const handleCopyPassword = async () => {
    if (!tempPassword) {
      toast({ variant: "destructive", title: "Nenhuma senha disponível para copiar." });
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tempPassword);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = tempPassword;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      toast({ title: "Senha temporária copiada" });
    } catch (err: any) {
      console.error("Falha ao copiar senha temporária:", err);
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Copie manualmente a senha exibida.",
      });
    }
  };

  const FilterSidebar = () => (
    <SheetContent side="right" className="w-full sm:max-w-sm">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-accent/80" strokeWidth={2.5} /> {/* Aplicando estilo aqui */}
          Filtros Avançados
        </SheetTitle>
        <SheetDescription>Refine a lista de liderados por critérios de desempenho e perfil.</SheetDescription>
      </SheetHeader>
      <div className="py-4 space-y-6">
        <div>
          <Label className="mb-2 block font-semibold text-foreground/80">Maturidade Geral</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.maturities.map(m => (
              <Button
                key={m}
                variant="outline"
                size="sm"
                className={`rounded-full border-primary ${activeFilters.maturity.includes(m) ? 'bg-primary-dark text-primary-foreground' : 'text-foreground'} text-xs px-3 py-1 transition-colors`}
                onClick={() => handleMaturityChange(m)}
              >
                {m}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block font-semibold text-foreground/80">Área Específica</Label>
          <Select value={activeFilters.category} onValueChange={(v) => {
            handleSetFilter('category', v);
            handleSetFilter('specialization', 'all');
            handleSetFilter('competency', 'all');
          }}>
            <SelectTrigger><SelectValue placeholder="Todas as áreas" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as áreas</SelectItem>
              {filterOptions.categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {activeFilters.category !== 'all' && (
          <div>
            <Label className="mb-2 block font-semibold text-foreground/80">Especialização</Label>
            <Select value={activeFilters.specialization} onValueChange={(v) => {
              handleSetFilter('specialization', v);
              handleSetFilter('competency', 'all');
            }} disabled={filterOptions.specializations.length === 0}>
              <SelectTrigger><SelectValue placeholder="Todas especializações" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas especializações</SelectItem>
                {filterOptions.specializations.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        {activeFilters.specialization !== 'all' && (
          <div>
            <Label className="mb-2 block font-semibold text-foreground/80">Competência</Label>
            <Select value={activeFilters.competency} onValueChange={(v) => handleSetFilter('competency', v)} disabled={filterOptions.competencies.length === 0}>
              <SelectTrigger><SelectValue placeholder="Todas competências" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas competências</SelectItem>
                {filterOptions.competencies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div>
          <Label className="mb-2 block font-semibold text-foreground/80">Idade</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.ageRanges.map(age => (
              <Button
                key={age}
                variant="outline"
                size="sm"
                className={`rounded-full border-primary ${activeFilters.age === age ? 'bg-primary-dark text-primary-foreground' : 'text-foreground'} text-xs px-3 py-1`}
                onClick={() => handleSetFilter('age', activeFilters.age === age ? 'all' : age)}
              >
                {age}
              </Button>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block font-semibold text-foreground/80">Gênero</Label>
          <div className="flex flex-wrap gap-2">
            {filterOptions.genders.map(gender => {
              const Icon = getGenderIcon(gender);
              return (
                <Button
                  key={gender}
                  variant="outline"
                  size="sm"
                  className={`rounded-full border-primary ${activeFilters.gender === gender ? 'bg-primary-dark text-primary-foreground' : 'text-foreground'} text-xs px-3 py-1 gap-2`}
                  onClick={() => handleSetFilter('gender', activeFilters.gender === gender ? 'all' : gender)}
                >
                  <Icon className="w-4 h-4" />
                  {gender}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </SheetContent>
  );

  const renderMemberCard = (member: LideradoDashboard & { isTalent: boolean }) => {
    const isEvaluated = !!member.ultima_avaliacao;
    const maturity = member.ultima_avaliacao?.maturidade_quadrante || 'N/A';
    const dominantCategory = member.categoria_dominante || 'Não Avaliado';
    const CategoryIcon = getCategoryIcon(dominantCategory);
    const isSelected = selectedMembersForComparison.includes(member.id_usuario);
    const topCompetencies = member.competencias.filter(c => c.pontuacao_1a4 > 0).sort((a, b) => b.pontuacao_1a4 - a.pontuacao_1a4).slice(0, 3);

    return (
      <Card key={member.id_usuario} className={cn("relative overflow-hidden w-full p-4 rounded-xl shadow-md transition-all duration-300 group", isComparisonMode ? "cursor-pointer hover:shadow-lg hover:border-primary/50" : "cursor-pointer hover:shadow-lg hover:-translate-y-1", isSelected && isComparisonMode && "border-2 border-primary ring-2 ring-primary/50")} onClick={() => isComparisonMode ? handleSelectMemberForComparison(member.id_usuario) : navigate(`/team/${member.id_usuario}`)}>
        {isComparisonMode && <div className="absolute top-3 right-3 z-10"><Checkbox checked={isSelected} onCheckedChange={() => handleSelectMemberForComparison(member.id_usuario)} className="w-5 h-5" /></div>}
        {member.isTalent && <Badge className="absolute top-0 left-0 rounded-br-lg rounded-tl-xl bg-yellow-500 text-yellow-900 font-bold px-3 py-1 text-xs z-10"><Star className="w-3 h-3 mr-1 fill-yellow-900" /> TALENTO</Badge>}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                {getInitials(member.nome)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0"><h3 className="font-semibold text-lg text-foreground truncate">{member.nome}</h3><p className="text-sm text-muted-foreground truncate">{member.cargo_nome}</p></div>
          </div>
          <Badge className={cn("text-sm font-semibold", isEvaluated ? "bg-primary/10 text-primary" : "bg-muted/50 text-muted-foreground")}>{maturity}</Badge>
        </div>
        <div className="space-y-2 text-sm"><div className="flex items-center text-muted-foreground"><Mail className="w-4 h-4 mr-2" /><span className="truncate">{member.email}</span></div><div className="flex items-center text-muted-foreground"><PersonStanding className="w-4 h-4 mr-2" /><span>{member.idade} anos</span></div></div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-medium text-muted-foreground">Área Dominante</span>{isEvaluated ? <Badge variant="secondary" className="text-xs gap-1"><CategoryIcon className="w-3 h-3" />{dominantCategory}</Badge> : <Badge variant="secondary" className="text-xs">Pendente de Avaliação</Badge>}</div>
          {isEvaluated && topCompetencies.length > 0 && <div className="mt-3"><span className="text-xs font-medium text-muted-foreground block mb-1">Top Competências:</span><div className="flex flex-wrap gap-1">{topCompetencies.map(comp => <Badge key={comp.id_competencia} className={cn("text-xs font-medium", getGapColorClass(comp.pontuacao_1a4))} variant="outline">{comp.nome_competencia.split(' ')[0]} ({comp.pontuacao_1a4.toFixed(1)})</Badge>)}</div></div>}
        </div>
      </Card>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <main className="flex-1 p-8 max-w-7xl mx-auto">
        <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2"><div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Users className="w-6 h-6 text-primary" /></div><h1 className="text-3xl font-bold text-foreground">Liderados</h1></div>
            <p className="text-muted-foreground mt-1">Gerencie e compare o desempenho dos membros da sua equipe.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}><DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Adicionar Liderado</Button></DialogTrigger><DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}><DialogHeader><DialogTitle>{modalStep === 1 && "Adicionar novo liderado"}{modalStep === 2 && "Confirmar dados"}{modalStep === 3 && "Liderado criado com sucesso!"}</DialogTitle><DialogDescription>{modalStep === 1 && "Preencha os dados para criar o acesso do novo membro."}{modalStep === 2 && "Revise os dados antes de confirmar a criação."}{modalStep === 3 && "Compartilhe a senha de acesso com o novo membro."}</DialogDescription></DialogHeader><Progress value={modalStep * 33.3} className="w-full my-4" />{modalStep === 1 && <div className="space-y-4 mt-4"><div><Label htmlFor="nome">Nome completo</Label><Input id="nome" placeholder="João da Silva" {...register("nome")} />{errors.nome && <p className="text-sm text-destructive mt-1">{errors.nome.message}</p>}</div><div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" placeholder="joao.silva@orbitta.com" {...register("email")} />{errors.email && <p className="text-sm text-destructive mt-1">{errors.email.message}</p>}</div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><Label htmlFor="id_cargo">Cargo</Label><Controller name="id_cargo" control={control} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent>{MOCK_CARGOS.filter(c => c.ativo).map(cargo => <SelectItem key={cargo.id_cargo} value={cargo.id_cargo}>{cargo.nome_cargo}</SelectItem>)}</SelectContent></Select>} />{errors.id_cargo && <p className="text-sm text-destructive mt-1">{errors.id_cargo.message}</p>}</div><div><Label htmlFor="sexo">Sexo</Label><Controller name="sexo" control={control} render={({ field }) => <Select onValueChange={field.onChange} value={field.value}><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="FEMININO">Feminino</SelectItem><SelectItem value="MASCULINO">Masculino</SelectItem><SelectItem value="NAO_BINARIO">Não Binário</SelectItem><SelectItem value="NAO_INFORMADO">Não Informado</SelectItem></SelectContent></Select>} />{errors.sexo && <p className="text-sm text-destructive mt-1">{errors.sexo.message}</p>}</div></div><div><Label htmlFor="data_nascimento">Data de Nascimento</Label><Input id="data_nascimento" type="date" {...register("data_nascimento")} />{errors.data_nascimento && <p className="text-sm text-destructive mt-1">{errors.data_nascimento.message}</p>}</div><Button onClick={handleNextStep} className="w-full gap-2">Avançar <ArrowRight className="w-4 h-4" /></Button></div>}{modalStep === 2 && provisionedData && <div className="space-y-4 mt-4"><div className="p-4 bg-muted rounded-lg space-y-2"><p><strong>Nome:</strong> {provisionedData.nome}</p><p><strong>Email:</strong> {provisionedData.email}</p><p><strong>Cargo:</strong> {MOCK_CARGOS.find(c => c.id_cargo === provisionedData.id_cargo)?.nome_cargo}</p><p><strong>Data de Nascimento:</strong> {new Date(provisionedData.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p></div><div className="flex justify-between"><Button variant="outline" onClick={() => setModalStep(1)} className="gap-2"><ArrowRight className="w-4 h-4" /> Voltar</Button><Button onClick={handleConclude} disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Confirmar e Criar"}</Button></div></div>}{modalStep === 3 && <div className="space-y-4 mt-4"><div className="p-4 bg-muted rounded-lg"><Label className="text-sm font-medium mb-2 block">Senha Temporária</Label><div className="flex items-center gap-2"><code className="flex-1 text-lg font-mono bg-background p-3 rounded border border-border">{tempPassword}</code><Button onClick={handleCopyPassword} size="sm">Copiar</Button></div></div><Button onClick={resetModal} className="w-full">Fechar</Button></div>}</DialogContent></Dialog>
        </div>
        
        {/* Container Centralizado para Busca e Filtros */}
        <div className="flex justify-center w-full">
          <div className="flex flex-col md:flex-row gap-4 mb-6 mt-10 w-full max-w-4xl">
            
            {/* Coluna de Busca e Limpar Filtros */}
            <div className="flex flex-col gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar liderado pelo nome..." 
                  value={searchName} 
                  onChange={(e) => setSearchName(e.target.value)} 
                  className="pl-10 w-full" 
                />
                {searchName && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-full px-3 hover:bg-transparent" 
                    onClick={() => setSearchName("")}
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
              
              {/* Botão Limpar Filtros - Agora com w-full e justificado à esquerda */}
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  className="gap-2 text-destructive hover:bg-destructive/10 w-full justify-start" 
                  onClick={resetFilters}
                >
                  <X className="w-4 h-4" />
                  Limpar Filtros ({activeFilterCount})
                </Button>
              )}
            </div>

            {/* Coluna de Ações (Filtros e Comparação) */}
            <div className="flex gap-3 md:justify-end">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="relative gap-2">
                    <Filter className="w-4 h-4 text-accent/80" strokeWidth={2.5} />
                    Filtros
                    {activeFilterCount > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center rounded-full">{activeFilterCount}</Badge>}
                  </Button>
                </SheetTrigger>
                <FilterSidebar />
              </Sheet>
              {isComparisonMode ? (
                <>
                  <Button variant="outline" onClick={handleToggleComparisonMode}>Cancelar</Button>
                  <Button onClick={handleNavigateToCompare} disabled={selectedMembersForComparison.length < 2 || selectedMembersForComparison.length > 4} className="gap-2">
                    Comparar ({selectedMembersForComparison.length})
                  </Button>
                </>
              ) : (
                <Button variant="secondary" onClick={handleToggleComparisonMode} className="gap-2">
                  <ArrowRight className="w-4 h-4" /> Versus
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {filteredMembers.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">{filteredMembers.map((member) => renderMemberCard(member))}</div> : <div className="text-center py-12"><p className="text-muted-foreground">{activeFilterCount > 0 ? "Nenhum liderado encontrado com os filtros selecionados." : "Nenhum liderado encontrado."}</p></div>}
      </main>
    </div>
  );
}
