import type { PillarKey } from '@cortex/shared/constants/pillars'

export interface Phase2Question {
	questionNumber: number
	title: string
	questionType: 'technical' | 'state'
}

type TechnicalQuestionBank = Record<PillarKey, ReadonlyArray<string>>

const TECHNICAL_QUESTION_BANK: TechnicalQuestionBank = {
	clarity: [
		'A meta principal está descrita em formato mensurável?',
		'O objetivo final tem prazo explícito e validado?',
		'Você possui critérios claros de sucesso para a conclusão?',
		'As prioridades da semana convergem para a meta central?',
		'Existe um indicador líder para acompanhar progresso antecipado?',
		'O escopo atual está protegido contra desvios frequentes?',
		'Você revisa semanalmente o alinhamento entre estratégia e execução?',
		'As decisões de prioridade seguem critérios objetivos?',
		'Você tem visibilidade das atividades que não geram valor?',
		'Há clareza sobre o que deve ser descartado neste ciclo?',
		'Os principais riscos estratégicos estão mapeados?',
		'Você consegue comunicar o plano de forma simples para terceiros?',
		'Existe definição explícita do que NÃO faz parte do projeto?',
		'Você converte aprendizado de ciclo anterior em ajuste estratégico?',
	],
	structure: [
		'Há um cronograma com marcos e responsáveis definidos?',
		'As dependências críticas entre tarefas estão documentadas?',
		'Você possui rotina fixa de revisão de planejamento?',
		'Existe critério claro para priorização diária de tarefas?',
		'Os riscos operacionais são monitorados ativamente?',
		'Você possui plano de contingência para atrasos relevantes?',
		'As tarefas possuem definição de pronto objetiva?',
		'Existe padronização mínima para registro de decisões?',
		'Você acompanha capacidade real antes de assumir novas demandas?',
		'Há organização clara de backlog por impacto e urgência?',
		'As reuniões (se houver) geram decisões acionáveis?',
		'Você revisa prazos com base em dados e não em expectativa?',
		'Existe processo para reduzir retrabalho recorrente?',
		'Você tem um painel único para visão do andamento do projeto?',
	],
	execution: [
		'Você mantém blocos de foco profundo durante a semana?',
		'As tarefas prioritárias são concluídas no prazo planejado?',
		'Você evita iniciar novas frentes antes de concluir as atuais?',
		'Existe disciplina para executar o plano mesmo sob pressão?',
		'Você mede produtividade por entregas concluídas?',
		'Você reduz interrupções e trocas de contexto no dia a dia?',
		'Há revisão objetiva dos resultados de cada semana?',
		'Você transforma objetivos em ações no mesmo ciclo de planejamento?',
		'Existe ritmo sustentável de execução sem picos de exaustão?',
		'Você encerra pendências críticas antes de abrir novas tarefas?',
		'Você mantém consistência de entrega em semanas difíceis?',
		'As falhas de execução geram ajustes imediatos de processo?',
		'Você utiliza checkpoints para garantir avanço real?',
		'Há cadência definida para validar progresso e qualidade?',
	],
	emotional: [
		'Você reconhece rapidamente gatilhos que travam sua execução?',
		'Você mantém clareza mental sob pressão de prazo?',
		'Você consegue retomar foco após frustrações?',
		'Você evita decisões impulsivas em momentos de ansiedade?',
		'Há rotina para regular energia e evitar sobrecarga?',
		'Você mantém autoconfiança após erros pontuais?',
		'Você consegue separar crítica técnica de crítica pessoal?',
		'Você mantém constância de ação mesmo sem motivação alta?',
		'Você pede apoio quando identifica bloqueio emocional?',
		'Você percebe cedo sinais de autossabotagem?',
		'Você consegue agir com desconforto sem paralisar?',
		'Você protege seu foco contra ruminação e excesso de preocupação?',
		'Você mantém perspectiva estratégica em momentos de tensão?',
		'Você encerra o dia com sensação de avanço, não de dispersão?',
	],
}

export const PHASE2_STATE_QUESTIONS: ReadonlyArray<Phase2Question> = [
	{
		questionNumber: 1,
		questionType: 'state',
		title: 'Hoje você sente que o projeto está sob controle?',
	},
	{
		questionNumber: 2,
		questionType: 'state',
		title: 'Seu nível atual de energia sustenta a execução diária?',
	},
	{
		questionNumber: 3,
		questionType: 'state',
		title: 'Você percebe progresso real nas últimas duas semanas?',
	},
	{
		questionNumber: 4,
		questionType: 'state',
		title: 'Sua rotina atual favorece consistência de entrega?',
	},
	{
		questionNumber: 5,
		questionType: 'state',
		title: 'Seu ambiente atual apoia foco e tomada de decisão?',
	},
	{
		questionNumber: 6,
		questionType: 'state',
		title: 'Você acredita estar próximo de concluir o projeto?',
	},
] as const

export const getPhase2TechnicalQuestions = (
	pillar: PillarKey,
): ReadonlyArray<Phase2Question> =>
	TECHNICAL_QUESTION_BANK[pillar].map((title, index) => ({
		questionNumber: index + 1,
		questionType: 'technical',
		title,
	}))

export const TOTAL_PHASE2_QUESTIONS = 20
