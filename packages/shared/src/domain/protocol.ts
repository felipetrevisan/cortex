export interface ProtocolActionBlock {
	block: 1 | 2 | 3
	title: string
	actions: string[]
}

export const PROTOCOL_REFLECTION_PROMPTS: ReadonlyArray<string> = [
	'Qual é a principal barreira real que está impedindo a conclusão do projeto hoje?',
	'Qual comportamento seu mais atrasa a execução quando surge pressão?',
	'O que você precisa simplificar nesta semana para recuperar tração?',
	'Qual decisão foi adiada e precisa ser tomada nas próximas 24 horas?',
	'Que sinal concreto mostrará que você está no caminho certo?',
] as const

export const PROTOCOL_ACTION_BLOCKS: ReadonlyArray<ProtocolActionBlock> = [
	{
		block: 1,
		title: 'Bloco 1 - Diagnóstico de Base',
		actions: [
			'Definir objetivo final em uma frase mensurável.',
			'Quebrar o projeto em três marcos com prazo.',
			'Eliminar uma frente paralela que drena foco.',
		],
	},
	{
		block: 2,
		title: 'Bloco 2 - Alinhamento Estrutural',
		actions: [
			'Priorizar três tarefas críticas da semana.',
			'Reservar bloco diário de execução sem interrupção.',
			'Criar revisão semanal de riscos e ajustes.',
		],
	},
	{
		block: 3,
		title: 'Bloco 3 - Consolidação de Execução',
		actions: [
			'Fechar pendência técnica de maior impacto.',
			'Formalizar rotina de acompanhamento de resultados.',
			'Registrar aprendizados e padronizar próximos ciclos.',
		],
	},
] as const

const isActionListCompleted = (items: boolean[]): boolean =>
	items.length > 0 && items.every(Boolean)

export const inferCurrentProtocolBlock = (
	block1Actions: boolean[],
	block2Actions: boolean[],
	block3Actions: boolean[],
): 1 | 2 | 3 => {
	if (!isActionListCompleted(block1Actions)) return 1
	if (!isActionListCompleted(block2Actions)) return 2
	if (!isActionListCompleted(block3Actions)) return 3
	return 3
}

export const isProtocolBlockUnlocked = (
	block: 1 | 2 | 3,
	block1Actions: boolean[],
	block2Actions: boolean[],
): boolean => {
	if (block === 1) return true
	if (block === 2) return isActionListCompleted(block1Actions)
	return (
		isActionListCompleted(block1Actions) && isActionListCompleted(block2Actions)
	)
}

export const isProtocolCompleted = (
	block1Actions: boolean[],
	block2Actions: boolean[],
	block3Actions: boolean[],
): boolean =>
	isActionListCompleted(block1Actions) &&
	isActionListCompleted(block2Actions) &&
	isActionListCompleted(block3Actions)
