import { notFound } from 'next/navigation'
import { DiagnosticResultScreen } from '@/features/results/components/diagnostic-result-screen'
import {
	isResultPhaseSlug,
	type ResultPhaseSlug,
} from '@/features/results/lib/result-routes'

interface ResultPageProps {
	params: Promise<{
		cycleId: string
		phase: string
	}>
}

export default async function DiagnosticResultPage({
	params,
}: ResultPageProps) {
	const { cycleId, phase } = await params

	if (!isResultPhaseSlug(phase)) {
		notFound()
	}

	return (
		<DiagnosticResultScreen
			cycleId={cycleId}
			phase={phase as ResultPhaseSlug}
		/>
	)
}
