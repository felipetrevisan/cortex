'use client'

import { buildComparativeReport } from '@cortex/shared/domain/comparative-report'
import { useMemo } from 'react'
import { useDiagnosticHistoryQuery } from './use-diagnostic-history-query'

export const useComparativeReport = () => {
	const historyQuery = useDiagnosticHistoryQuery()

	const report = useMemo(() => {
		const latest = historyQuery.data?.[0]?.cycle ?? null
		const previous = historyQuery.data?.[1]?.cycle ?? null
		return buildComparativeReport(latest, previous)
	}, [historyQuery.data])

	return {
		...historyQuery,
		report,
	}
}
