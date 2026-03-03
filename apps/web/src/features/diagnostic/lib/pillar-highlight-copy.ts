import type { PillarKey } from '@cortex/shared/constants/pillars'

export const getSimplePillarLabel = (pillar: PillarKey | null): string => {
	switch (pillar) {
		case 'clarity':
			return 'Direção'
		case 'structure':
			return 'Organização'
		case 'execution':
			return 'Constância'
		case 'emotional':
			return 'Equilíbrio'
		default:
			return '-'
	}
}

export const getStrongPillarDescription = (
	pillar: PillarKey | null,
	value: number,
): string => {
	if (!pillar)
		return 'Este pilar representa sua principal força estrutural no momento.'

	if (value >= 85) {
		return 'Este pilar é altamente consistente e funciona como alavanca estrutural. Ele pode sustentar crescimento, desde que os demais pilares estejam alinhados.'
	}

	return 'Este pilar representa sua principal força estrutural no momento. Ele sustenta decisões, comportamento e organização do ciclo atual, funcionando como base de apoio para os demais pilares.'
}

export const getCriticalPillarDescription = (
	pillar: PillarKey | null,
	value: number,
): string => {
	if (!pillar)
		return 'Este pilar concentra a principal vulnerabilidade do ciclo atual.'

	if (value < 40) {
		return 'Este pilar representa um ponto crítico da estrutura. Ele limita desempenho, gera instabilidade e compromete a consistência do sistema como um todo.'
	}

	if (value <= 59) {
		return 'Este pilar concentra a principal vulnerabilidade do ciclo atual. Ele exige maior esforço para manter estabilidade e tende a impactar previsibilidade quando não recebe atenção específica.'
	}

	return 'Embora seja o pilar com menor pontuação relativa, ainda opera em zona funcional. Ajustes pontuais são suficientes para elevar equilíbrio estrutural.'
}
