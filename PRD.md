# PRD ORBITTA – Versão 4.0

Responsável: Talita Amorim da silva

## 1. Visão Geral

O ORBITTA é uma plataforma digital voltada para líderes de equipe que desejam acompanhar o desenvolvimento técnico e comportamental de seus liderados.

Seu propósito é consolidar avaliações de competências em indicadores visuais de maturidade e evolução, auxiliando a tomada de decisão e o planejamento de desenvolvimento individual e coletivo.

Toda a estrutura de dados segue o **MER 4.0**, validado para integração com o **Supabase**, e toda a arquitetura de frontend foi construída para refletir esse modelo, respeitando a estrutura modular do projeto em React.

O sistema trabalha em um ciclo completo:

- Login e autenticação (papéis definidos: líder e liderado);
- Cadastro do primeiro liderado;
- Primeira avaliação;
- Alimentação automática dos gráficos e painéis da Home.


## 2. Arquitetura e Organização de Projeto

A arquitetura de código do ORBITTA reflete fielmente o modelo de dados.

O diretório `/src/pages` contém as telas principais, cada uma correspondendo a um fluxo funcional do sistema: **Login**, **Home**, **Evaluation**, **Team**, **Register** e **Settings**.

O diretório `/src/components` abriga componentes visuais de alto nível, como **CompetencyQuadrantChart**, **KnowledgeGapsSection**, **DistributionPieChart** e **RecentEvaluationsSection**, que são renderizados de acordo com as views e relações descritas no MER 4.0.

A lógica global de autenticação e papéis é controlada por `AuthContext.tsx`, que diferencia líderes e liderados e mantém o estado global do usuário.

As chamadas de dados utilizam `TanStack Query`, e os tipos de entidades estão descritos em `src/types/mer.ts`, garantindo compatibilidade direta com o banco Supabase e as Edge Functions que serão adicionadas futuramente.

---

## 3. Fluxo de Primeiro Acesso

Quando o líder realiza login pela primeira vez, ele é redirecionado à Home sem liderados e sem avaliações registradas.

A página é renderizada integralmente, mas todos os componentes de gráficos aparecem em **cinza neutro**, representando ausência de dados.

O sistema exibe mensagens orientativas, como:

“Cadastre seu primeiro liderado para começar.”

Nenhum dado é mockado nesse estado inicial. Essa abordagem garante que o comportamento da aplicação reflita o estado real do banco de dados, preservando a lógica de progressão visual e experiência limpa de primeiro uso.

---

## 4. Fluxo de Cadastro de Liderado

O líder acessa o botão “Adicionar Liderado” e preenche os campos de cadastro.

Os campos obrigatórios são: **nome**, **email**, **cargo**, **sexo** e **data de nascimento**.

A idade é calculada automaticamente no frontend e não é enviada ao backend.

Ao confirmar o cadastro, o frontend chama a função de criação de liderado. No futuro, isso será tratado por uma **Edge Function `create-liderado`**, que inserirá o registro na tabela `usuarios`, vinculando-o ao líder pelo campo `lider_id` e definindo o `role` como `LIDERADO`.

Após a criação, o novo liderado aparece na tela do líder com status “Pendente de Avaliação”.

---

## 5. Fluxo de Primeira Avaliação

Ao clicar no botão “Avaliar”, o líder é redirecionado para a rota `/evaluation/:id`.

Essa página carrega o template de competências técnicas e comportamentais associadas ao cargo do liderado.

Os dados são buscados do Supabase por meio da função `get-evaluation-template`.

A tela de avaliação exibe sliders que representam o nível atual de cada competência, variando de 1 a 4.

Conforme o líder ajusta as notas, o gráfico de radar é atualizado em tempo real, refletindo as médias comportamentais e técnicas.

Ao finalizar, o líder clica em “Salvar Avaliação Completa”.

Nesse momento, o frontend gera um único objeto JSON consolidado com as notas.

O envio desse objeto acionará, no backend, a **Edge Function `save-evaluation`**, responsável por:

1. Calcular as médias técnicas (eixo X) e comportamentais (eixo Y).
2. Determinar o nível de maturidade (M1 a M4).
3. Gravar os registros em `avaliacao` e `pontuacao_avaliacao`.
4. Atualizar as views `mv_ultima_avaliacao` e `mv_gaps_competencia`.

A transação é única e atômica, evitando inconsistências.

---

## 6. Fluxo de Atualização e Alimentação de Dados

Após a primeira avaliação, o frontend consulta as views agregadas para atualizar os componentes da Home.

Cada gráfico é alimentado por uma fonte distinta, conforme definido no MER 4.0:

- O **gráfico de quadrante** utiliza dados da última avaliação de cada liderado (view `mv_ultima_avaliacao`).
- O **gráfico de pizza** exibe a distribuição de maturidade (por M1, M2, M3 e M4).
- A **seção de gaps** mostra as menores e maiores médias de competências técnicas.
- A **seção de avaliações recentes** exibe as três últimas avaliações com data e nome do liderado.

Esse comportamento garante que o dashboard seja totalmente dinâmico e reativo ao progresso real da equipe.

---

## 7. Lógica Visual

Os gráficos possuem dois estados visuais:

- **Estado inativo:** quando não há avaliações registradas. Todos os componentes são exibidos em cinza claro e sem animações.
- **Estado ativo:** quando existem dados avaliativos. Os componentes recebem cores institucionais – azul principal (`#012873`) e laranja de destaque (`#E09F7D`).

Os líderes com primeiro acesso sempre visualizarão a interface completa, porém sem conteúdo colorido até que a primeira avaliação seja concluída.

---

## 8. Modelo de Dados MER 4.0

O modelo de dados define as relações fundamentais entre usuários, cargos, competências e avaliações.

A entidade **usuario** diferencia papéis de líder e liderado e armazena informações pessoais e de perfil.

A entidade **avaliacao** registra o resultado consolidado de cada sessão de avaliação, e **pontuacao_avaliacao** guarda o detalhamento de cada competência avaliada.

O **template_competencia** define quais competências pertencem a cada cargo.

As views **mv_ultima_avaliacao** e **mv_gaps_competencia** fornecem dados prontos para renderização no frontend.

Essas estruturas são espelhadas em `src/types/mer.ts`, garantindo a compatibilidade entre frontend e backend.

---

## 9. Requisitos Funcionais

O sistema deve:

- Permitir login e autenticação baseados em papéis.
- Possibilitar cadastro de liderados com cálculo automático de idade.
- Oferecer um processo de avaliação completo e validado.
- Calcular automaticamente médias e níveis de maturidade.
- Atualizar dashboards imediatamente após a primeira avaliação.
- Exibir gráficos cinza enquanto não há dados.
- Eliminar completamente dados mockados após a integração Supabase.

---

## 10. Requisitos Não Funcionais

A interface deve seguir o design system shadcn/ui, com Tailwind CSS e Radix UI para acessibilidade.

A renderização deve ser leve e reativa, utilizando TanStack Query e Context API para gerenciamento de estado.

Toda comunicação futura com o Supabase deverá ser feita via Edge Functions seguras.

O projeto deve manter modularidade e compatibilidade com futuras expansões, como histórico de ciclos de avaliação e suporte multi-organização.

---

## 11. Critérios de Aceite

- Ao acessar o sistema pela primeira vez, a Home deve estar totalmente cinza e sem dados.
- Após o cadastro de um liderado, o card correspondente deve aparecer imediatamente.
- Ao salvar a primeira avaliação, os gráficos devem se preencher automaticamente com cores e dados reais.
- Nenhum gráfico deve exibir informação simulada.
- O login deve ter fundo sólido e sem estrelas.

---