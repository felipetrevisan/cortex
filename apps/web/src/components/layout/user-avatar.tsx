'use client'

import { cn } from '@cortex/ui/lib/cn'
import Image from 'next/image'
import { useMemo, useState } from 'react'

type AvatarSize = 'sm' | 'md' | 'lg'

interface UserAvatarProps {
	name: string
	avatarUrl?: string | null | undefined
	size?: AvatarSize
	className?: string
}

const sizeClass: Record<AvatarSize, string> = {
	sm: 'size-8 text-xs',
	md: 'size-10 text-sm',
	lg: 'size-12 text-base',
}

const getInitials = (name: string): string => {
	const parts = name.trim().split(/\s+/).filter(Boolean)

	if (parts.length === 0) return 'US'

	const first = parts.at(0) ?? ''
	const last = parts.at(-1) ?? ''

	if (parts.length === 1) return first.slice(0, 2).toUpperCase()
	return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export const UserAvatar = ({
	name,
	avatarUrl,
	size = 'md',
	className,
}: UserAvatarProps) => {
	const [failedUrl, setFailedUrl] = useState<string | null>(null)
	const safeAvatarUrl = avatarUrl?.trim() || ''
	const initials = useMemo(() => getInitials(name), [name])
	const showImage = safeAvatarUrl.length > 0 && failedUrl !== safeAvatarUrl

	return (
		<span
			className={cn(
				'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/70 bg-primary/12 font-semibold text-primary',
				sizeClass[size],
				className,
			)}
			role="img"
			aria-label={showImage ? `Foto de ${name}` : `Avatar de ${name}`}
			title={name}
		>
			{showImage ? (
				<Image
					src={safeAvatarUrl}
					alt=""
					fill
					sizes="48px"
					unoptimized
					className="object-cover"
					onError={() => setFailedUrl(safeAvatarUrl)}
				/>
			) : (
				<span>{initials}</span>
			)}
		</span>
	)
}
