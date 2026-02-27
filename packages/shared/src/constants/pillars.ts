export type PillarKey = 'clarity' | 'structure' | 'execution' | 'emotional'

export const PILLARS: ReadonlyArray<{
	key: PillarKey
	title: string
	colorToken: string
}> = [
	{
		key: 'clarity',
		title: 'Clareza Estratégica',
		colorToken: 'pillar-clarity',
	},
	{
		key: 'structure',
		title: 'Estrutura de Projeto',
		colorToken: 'pillar-structure',
	},
	{
		key: 'execution',
		title: 'Execução Consistente',
		colorToken: 'pillar-execution',
	},
	{
		key: 'emotional',
		title: 'Autogestão Emocional',
		colorToken: 'pillar-emotional',
	},
] as const

export const REEVALUATION_WINDOWS = {
	firstDays: 45,
	secondDays: 90,
} as const
