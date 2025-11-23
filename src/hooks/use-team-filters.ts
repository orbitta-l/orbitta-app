import { useState, useMemo, useCallback } from "react";
import { LideradoDashboard, NivelMaturidade, SexoTipo } from "@/types/mer";
import { technicalTemplate } from "@/data/evaluationTemplates";

export interface ActiveFilters {
  maturity: NivelMaturidade[];
  category: string;
  specialization: string;
  competency: string;
  age: string;
  gender: SexoTipo | 'all';
}

const initialFilters: ActiveFilters = {
  maturity: [],
  category: 'all',
  specialization: 'all',
  competency: 'all',
  age: 'all',
  gender: 'all',
};

const AGE_RANGES: Record<string, { min: number, max: number }> = {
  '<21': { min: 0, max: 20 },
  '21-29': { min: 21, max: 29 },
  '30-39': { min: 30, max: 39 },
  '40+': { min: 40, max: 150 },
};

export function useTeamFilters(teamData: LideradoDashboard[], searchName: string) {
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(initialFilters);

  // Mapas para evitar recomputação pesada a cada filtro
  const categoryList = useMemo(
    () => technicalTemplate.map(c => ({ id: c.id_categoria, name: c.nome_categoria })),
    []
  );
  const categoryNameById = useMemo(
    () => new Map(categoryList.map(c => [c.id, c.name])),
    [categoryList]
  );
  const specializationMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    technicalTemplate.forEach(cat => {
      map.set(
        cat.id_categoria,
        cat.especializacoes.map((s) => ({
          id: s.id_especializacao,
          name: s.nome_especializacao,
        })),
      );
    });
    return map;
  }, []);
  const specializationNameById = useMemo(() => {
    const map = new Map<string, string>();
    technicalTemplate.forEach(cat => {
      cat.especializacoes.forEach(s => {
        map.set(s.id_especializacao, s.nome_especializacao);
      });
    });
    return map;
  }, []);
  const competencyMap = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    technicalTemplate.forEach(cat => {
      cat.especializacoes.forEach(s => {
        map.set(
          s.id_especializacao,
          s.competencias.map(comp => ({ id: comp.id_competencia, name: comp.nome_competencia })),
        );
      });
    });
    return map;
  }, []);
  const competencyNameById = useMemo(() => {
    const map = new Map<string, string>();
    technicalTemplate.forEach(cat => {
      cat.especializacoes.forEach(s => {
        s.competencias.forEach(comp => {
          map.set(comp.id_competencia, comp.nome_competencia);
        });
      });
    });
    return map;
  }, []);

  const resetFilters = useCallback(() => {
    setActiveFilters(initialFilters);
  }, []);

  const setFilter = useCallback(<K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const activeFilterCount = useMemo(() => {
    return Object.entries(activeFilters).filter(([key, value]) => {
      if (key === 'maturity') return Array.isArray(value) && value.length > 0;
      return value !== 'all' && value !== '';
    }).length;
  }, [activeFilters]);

  const filteredMembers = useMemo(() => {
    let members = teamData;

    if (searchName) {
      members = members.filter(member =>
        member.nome.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    members = members.filter(member => {
      const { ultima_avaliacao, sexo, idade, competencias } = member;
      const { maturity, category, specialization, competency, age, gender } = activeFilters;

      if (maturity.length > 0 && ultima_avaliacao) {
        // Garante que maturidade_quadrante é um NivelMaturidade antes de verificar a inclusão
        if (ultima_avaliacao.maturidade_quadrante !== 'N/A') {
            if (!maturity.includes(ultima_avaliacao.maturidade_quadrante)) return false;
        } else {
            // Se o filtro de maturidade está ativo, mas o membro não foi avaliado, ele não deve ser incluído.
            return false;
        }
      }

      if (gender !== 'all' && sexo !== gender) return false;

      if (age !== 'all') {
        const range = AGE_RANGES[age];
        if (idade < range.min || idade > range.max) return false;
      }

      if (ultima_avaliacao) {
        const categoryName = category !== 'all'
          ? categoryNameById.get(category)
          : 'all';
        const specializationName = specialization !== 'all'
          ? specializationNameById.get(specialization)
          : 'all';
        const competencyName = competency !== 'all'
          ? competencyNameById.get(competency)
          : 'all';

        if (categoryName && categoryName !== 'all' && !competencias.some(c => c.categoria_nome === categoryName)) return false;
        if (specializationName && specializationName !== 'all' && !competencias.some(c => c.especializacao_nome === specializationName)) return false;
        if (competencyName && competencyName !== 'all' && !competencias.some(c => c.nome_competencia === competencyName && c.pontuacao_1a4 > 0)) return false;
      
      } else {
        if (maturity.length > 0 || category !== 'all' || specialization !== 'all' || competency !== 'all') {
            return false;
        }
      }

      return true;
    });

    if (members.length === 0) {
      return [];
    }

    let talentId: string | null = null;
    let bestScore = -1;

    const { category, specialization, competency } = activeFilters;

    if (competency !== 'all') {
      members.forEach(member => {
        const comp = member.competencias.find(c => c.id_competencia === competency);
        const score = comp ? comp.pontuacao_1a4 : 0;
        if (score > bestScore) {
          bestScore = score;
          talentId = member.id_usuario;
        }
      });
    } else if (specialization !== 'all') {
      const specializationName = specializationNameById.get(specialization);
      if (specializationName) {
        members.forEach(member => {
          const relevantCompetencies = member.competencias.filter(c => c.especializacao_nome === specializationName);
          if (relevantCompetencies.length > 0) {
            const totalScore = relevantCompetencies.reduce((sum, c) => sum + c.pontuacao_1a4, 0);
            const avgScore = totalScore / relevantCompetencies.length;
            if (avgScore > bestScore) {
              bestScore = avgScore;
              talentId = member.id_usuario;
            }
          }
        });
      }
    } else if (category !== 'all') {
      const categoryName = categoryNameById.get(category);
      if (categoryName) {
        members.forEach(member => {
          const relevantCompetencies = member.competencias.filter(c => c.categoria_nome === categoryName);
          if (relevantCompetencies.length > 0) {
            const totalScore = relevantCompetencies.reduce((sum, c) => sum + c.pontuacao_1a4, 0);
            const avgScore = totalScore / relevantCompetencies.length;
            if (avgScore > bestScore) {
              bestScore = avgScore;
              talentId = member.id_usuario;
            }
          }
        });
      }
    } else {
      members.forEach(member => {
        if (member.ultima_avaliacao) {
          const combinedScore = (member.ultima_avaliacao.media_tecnica_1a4 + member.ultima_avaliacao.media_comportamental_1a4) / 2;
          if (combinedScore > bestScore) {
            bestScore = combinedScore;
            talentId = member.id_usuario;
          }
        }
      });
    }

    return members.map(member => ({
      ...member,
      isTalent: member.id_usuario === talentId && bestScore > 0,
    }));

  }, [teamData, searchName, activeFilters]);

  const filterOptions = useMemo(() => {
    const specializations =
      activeFilters.category !== 'all'
        ? specializationMap.get(activeFilters.category) || []
        : [];

    const competencies =
      activeFilters.specialization !== 'all'
        ? competencyMap.get(activeFilters.specialization) || []
        : [];

    return {
      categories: categoryList,
      specializations,
      competencies,
      ageRanges: Object.keys(AGE_RANGES),
      genders: ['FEMININO', 'MASCULINO', 'NAO_BINARIO', 'NAO_INFORMADO'] as SexoTipo[],
      maturities: ['M1', 'M2', 'M3', 'M4'] as NivelMaturidade[],
    };
  }, [activeFilters.category, activeFilters.specialization, categoryList, specializationMap, competencyMap]);

  return {
    activeFilters,
    setFilter,
    resetFilters,
    activeFilterCount,
    filteredMembers,
    filterOptions,
  };
}
