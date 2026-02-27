import type { PillarKey } from '@cortex/shared/constants/pillars'

export interface Phase1QuestionnairePillar {
	pillar: PillarKey
	title: string
	questions: string[]
}

export const PHASE1_RESPONSE_OPTIONS: ReadonlyArray<{
	value: number
	label: string
}> = [
	{ value: 1, label: 'Nunca' },
	{ value: 2, label: 'Raramente' },
	{ value: 3, label: 'Pouco frequente' },
	{ value: 4, label: 'Frequentemente' },
	{ value: 5, label: 'Quase sempre' },
	{ value: 6, label: 'Sempre' },
] as const

export const PHASE1_QUESTIONNAIRE: ReadonlyArray<Phase1QuestionnairePillar> = [
	{
		pillar: 'clarity',
		title: 'Clareza Estratégica',
		questions: [
			'Você define metas claras e mensuráveis para o projeto?',
			'Você consegue explicar o objetivo principal em uma frase?',
			'As prioridades semanais estão alinhadas com o objetivo final?',
			'Você revisa e ajusta a direção estratégica com frequência?',
			'Você sabe exatamente quais entregas definem sucesso do projeto?',
			'Você diferencia tarefas urgentes de tarefas realmente estratégicas?',
			'Você evita iniciar atividades que não contribuem para o objetivo final?',
			'Você revisa indicadores de avanço para corrigir rota rapidamente?',
			'Você possui critérios claros para decidir o que entra ou sai do escopo?',
			'Você comunica a visão do projeto de forma objetiva para outras pessoas?',
			'Você identifica rapidamente quando está desviando da meta principal?',
			'Você mantém foco no resultado final mesmo diante de novas ideias?',
		],
	},
	{
		pillar: 'structure',
		title: 'Estrutura de Projeto',
		questions: [
			'Você possui um plano com etapas e marcos bem definidos?',
			'As responsabilidades das tarefas estão organizadas de forma clara?',
			'Você usa um sistema de acompanhamento para o andamento do projeto?',
			'Existe uma rotina para revisar prazos e riscos do projeto?',
			'Você possui um cronograma realista com prazos intermediários?',
			'Você registra decisões importantes para evitar retrabalho?',
			'Você define dependências críticas antes de iniciar novas frentes?',
			'Você tem um processo claro para priorizar tarefas do dia?',
			'Você revisa recursos disponíveis antes de assumir novas entregas?',
			'Você antecipa gargalos operacionais com antecedência?',
			'Você mantém documentação mínima para continuidade do trabalho?',
			'Você consegue visualizar rapidamente o estágio atual do projeto?',
		],
	},
	{
		pillar: 'execution',
		title: 'Execução Consistente',
		questions: [
			'Você conclui as tarefas prioritárias com consistência semanal?',
			'Você consegue manter foco nas atividades mais importantes?',
			'Seu ritmo de trabalho sustenta avanço contínuo do projeto?',
			'Você finaliza o que começa antes de abrir novas frentes?',
			'Você inicia o dia pelas tarefas de maior impacto?',
			'Você reduz distrações durante os blocos de execução?',
			'Você mantém disciplina para cumprir o plano mesmo sem motivação?',
			'Você transforma objetivos em ações concretas no mesmo dia?',
			'Você evita acumular pendências pequenas ao longo da semana?',
			'Você revisa resultados e ajusta rapidamente após erros?',
			'Você mantém constância mesmo em semanas mais complexas?',
			'Você encerra ciclos de trabalho com entregas concluídas?',
		],
	},
	{
		pillar: 'emotional',
		title: 'Autogestão Emocional',
		questions: [
			'Você lida bem com frustração e imprevistos do processo?',
			'Você retoma o foco rapidamente após interrupções?',
			'Você mantém motivação estável durante fases difíceis?',
			'Você consegue regular ansiedade antes de decisões importantes?',
			'Você consegue agir mesmo quando há insegurança sobre o resultado?',
			'Você evita decisões impulsivas em momentos de pressão?',
			'Você identifica sinais de sobrecarga antes de travar a execução?',
			'Você mantém autoconfiança após falhas pontuais?',
			'Você consegue pedir ajuda quando percebe bloqueio emocional?',
			'Você consegue separar críticas ao projeto de críticas pessoais?',
			'Você mantém energia mental ao longo de ciclos longos?',
			'Você finaliza tarefas mesmo quando o entusiasmo diminui?',
		],
	},
] as const

export const TOTAL_PHASE1_QUESTIONS = PHASE1_QUESTIONNAIRE.reduce(
	(total, pillar) => total + pillar.questions.length,
	0,
)
