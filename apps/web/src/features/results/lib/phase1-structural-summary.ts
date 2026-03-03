import type { PillarKey } from '@cortex/shared/constants/pillars'

export interface StructuralInsight {
	id: 'asymmetry' | 'risk' | 'coherence'
	title: string
	status: string
	valueLabel: string
	description: string
}

export interface Phase1FinalSummary {
	scenario: 'green' | 'yellow' | 'red'
	title: string
	description: string
}

const getAsymmetryScore = (values: number[]): number =>
	Math.max(...values) - Math.min(...values)

export const getAsymmetryInsight = (
	values: number[],
): Pick<StructuralInsight, 'status' | 'valueLabel' | 'description'> => {
	const highest = Math.max(...values)
	const lowest = Math.min(...values)
	const asymmetry = highest - lowest

	if (asymmetry <= 15) {
		return {
			status: 'Estrutura Coesa',
			valueLabel: `${asymmetry} pontos`,
			description:
				'Os pilares apresentam baixa dispersão estrutural. Isso indica integração funcional entre os componentes, com distribuição equilibrada de força. A tendência é estabilidade operacional, com menor necessidade de compensação entre áreas.',
		}
	}

	if (asymmetry <= 30) {
		return {
			status: 'Leve Assimetria',
			valueLabel: `${asymmetry} pontos`,
			description:
				'Há variação mensurável entre pilares, ainda dentro de zona funcional. O arranjo opera com leve desbalanceamento, exigindo ajustes pontuais para preservar consistência.',
		}
	}

	if (asymmetry <= 50) {
		return {
			status: 'Assimetria Moderada',
			valueLabel: `${asymmetry} pontos`,
			description:
				'A diferença entre os pilares é significativa. O funcionamento ocorre por meio de compensações internas, e não por integração plena. Esse padrão eleva o custo operacional e reduz eficiência global.',
		}
	}

	return {
		status: 'Alta Assimetria',
		valueLabel: `${asymmetry} pontos`,
		description:
			'A dispersão entre pilares é elevada. As áreas operam em níveis substancialmente distintos, caracterizando desequilíbrio sistêmico. Esse padrão compromete previsibilidade e favorece ciclos recorrentes de instabilidade.',
	}
}

export const getOperationalRiskInsight = (
	values: number[],
): Pick<StructuralInsight, 'status' | 'valueLabel' | 'description'> => {
	const lowest = Math.min(...values)
	const asymmetry = Math.max(...values) - lowest

	if (lowest >= 60 && asymmetry <= 30) {
		return {
			status: 'Risco Baixo',
			valueLabel: `Base mínima ${lowest}%`,
			description:
				'O arranjo atual sustenta funcionamento estável. A probabilidade de ruptura de desempenho é reduzida, salvo sob estresse externo significativo.',
		}
	}

	if (lowest >= 40 && asymmetry <= 50) {
		return {
			status: 'Risco Moderado',
			valueLabel: `Base mínima ${lowest}%`,
			description:
				'Há vulnerabilidade identificável. Sob aumento de exigência ou pressão contextual, tende a ocorrer oscilação mensurável de desempenho.',
		}
	}

	return {
		status: 'Risco Alto',
		valueLabel: `Base mínima ${lowest}%`,
		description:
			'A configuração apresenta fragilidade relevante. A combinação entre baixa base funcional e alta dispersão amplia o risco de inconsistência recorrente e perda de previsibilidade.',
	}
}

export const getCoherenceInsight = (
	values: number[],
): Pick<StructuralInsight, 'status' | 'valueLabel' | 'description'> => {
	const average = values.reduce((sum, value) => sum + value, 0) / values.length
	const meanDeviation =
		values.reduce((sum, value) => sum + Math.abs(value - average), 0) /
		values.length
	const roundedDeviation = Math.round(meanDeviation)

	if (meanDeviation <= 10) {
		return {
			status: 'Alta Coerência',
			valueLabel: `Desvio médio ${roundedDeviation}`,
			description:
				'Há alinhamento interno consistente. Os pilares operam de forma interdependente, favorecendo eficiência e estabilidade.',
		}
	}

	if (meanDeviation <= 20) {
		return {
			status: 'Coerência Moderada',
			valueLabel: `Desvio médio ${roundedDeviation}`,
			description:
				'O alinhamento é parcial. Embora exista integração funcional, a variação entre áreas exige compensação contínua para manutenção de desempenho.',
		}
	}

	return {
		status: 'Estrutura Fragmentada',
		valueLabel: `Desvio médio ${roundedDeviation}`,
		description:
			'Observa-se fragmentação estrutural. As áreas não convergem em intensidade funcional, aumentando fricção interna e elevando o esforço necessário para sustentar consistência.',
	}
}

const getPillarTextLabel = (pillar: PillarKey | null): string => {
	switch (pillar) {
		case 'clarity':
			return 'direção'
		case 'structure':
			return 'organização'
		case 'execution':
			return 'constância'
		case 'emotional':
			return 'equilíbrio emocional'
		default:
			return 'organização'
	}
}

export const getPhase1FinalSummary = (input: {
	strongPillar: PillarKey | null
	criticalPillar: PillarKey | null
	riskStatus: string
	asymmetry: number
}): Phase1FinalSummary => {
	const strong = getPillarTextLabel(input.strongPillar)
	const weak = getPillarTextLabel(input.criticalPillar)

	if (input.riskStatus === 'Risco Alto' || input.asymmetry > 50) {
		return {
			scenario: 'red',
			title: 'Cenário — Ciclo de Instabilidade Estrutural',
			description: `O desempenho atual está sendo limitado por ${weak}, mesmo havendo força relevante em ${strong}. A diferença entre essas áreas gera desequilíbrio, dificultando consistência e manutenção de resultados.\n\nSe o padrão permanecer inalterado, a tendência é repetição de ciclos de esforço intenso seguidos de instabilidade. A prioridade estratégica é estabilizar ${weak}, permitindo que a força existente em ${strong} deixe de compensar fragilidades e passe a sustentar crescimento estruturado.`,
		}
	}

	if (input.riskStatus === 'Risco Moderado' || input.asymmetry > 30) {
		return {
			scenario: 'yellow',
			title: 'Cenário — Desequilíbrio Controlável',
			description: `Existe capacidade instalada, principalmente em ${strong}, mas o desempenho depende de compensações causadas pela fragilidade em ${weak}. Isso gera esforço adicional e oscilação em momentos de maior exigência.\n\nSem intervenção direcionada, o padrão tende a se repetir: avanço sustentado por esforço seguido de perda de ritmo. O foco estratégico está em fortalecer ${weak} para reduzir a necessidade de compensação e permitir que ${strong} opere como alavanca real de crescimento.`,
		}
	}

	return {
		scenario: 'green',
		title: 'Cenário — Estabilidade com Potencial de Evolução',
		description: `Seu sistema apresenta uma base consistente, com destaque para ${strong}. Existe equilíbrio geral entre as áreas, e o ponto que mais pede atenção é ${weak}. Esse ajuste não representa fragilidade estrutural, mas uma oportunidade clara de refinamento.\n\nSe mantido como está, o funcionamento tende a continuar estável, porém abaixo do potencial máximo. Trabalhar especificamente ${weak} permitirá que a força já existente em ${strong} sustente um novo nível de desempenho, com menos esforço e maior previsibilidade.`,
	}
}

export const buildStructuralInsights = (pillars: Record<PillarKey, number>) => {
	const values = Object.values(pillars)
	const asymmetry = getAsymmetryInsight(values)
	const risk = getOperationalRiskInsight(values)
	const coherence = getCoherenceInsight(values)

	return [
		{
			id: 'asymmetry' as const,
			title: 'Índice de Assimetria Estrutural',
			...asymmetry,
		},
		{
			id: 'risk' as const,
			title: 'Nível de Risco Operacional',
			...risk,
		},
		{
			id: 'coherence' as const,
			title: 'Coerência Interna do Sistema',
			...coherence,
		},
	]
}

export const getPhase1AsymmetryScore = (pillars: Record<PillarKey, number>) =>
	getAsymmetryScore(Object.values(pillars))
