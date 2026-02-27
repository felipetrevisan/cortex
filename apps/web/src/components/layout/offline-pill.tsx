'use client'

import { Wifi, WifiOff } from 'lucide-react'
import { useOfflineStatus } from '@/hooks/use-offline-status'

export const OfflinePill = () => {
	const { isOnline } = useOfflineStatus()

	return (
		<div
			className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
				isOnline
					? 'border-emerald-500 bg-emerald-200 !text-black shadow-[0_6px_18px_rgba(5,150,105,0.22)] dark:border-emerald-400/45 dark:bg-emerald-500/24 dark:!text-emerald-50 dark:shadow-none'
					: 'border-amber-500 bg-amber-200 !text-black shadow-[0_6px_18px_rgba(217,119,6,0.22)] dark:border-amber-400/45 dark:bg-amber-500/24 dark:!text-amber-50 dark:shadow-none'
			}`}
		>
			{isOnline ? (
				<Wifi className="size-3.5 !text-black dark:!text-emerald-50" />
			) : (
				<WifiOff className="size-3.5 !text-black dark:!text-amber-50" />
			)}
			<span className="font-semibold">
				{isOnline ? 'Online' : 'Offline (cache ativo)'}
			</span>
		</div>
	)
}
