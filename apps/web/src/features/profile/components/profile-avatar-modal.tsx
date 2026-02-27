'use client'

import { Button } from '@cortex/ui/components/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import { Input } from '@cortex/ui/components/input'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2, Upload, XCircle } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AnimatedModalShell } from '@/components/animated-ui/animated-modal-shell'
import { UserAvatar } from '@/components/layout/user-avatar'
import { useAuth } from '@/features/auth/components/auth-provider'
import { queryKeys } from '@/lib/query/keys'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ProfileAvatarModalProps {
	open: boolean
	onOpenChange: (nextOpen: boolean) => void
	fullName: string
	currentAvatarUrl?: string | null
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const normalizeUrl = (value: string): string | null => {
	const trimmed = value.trim()
	if (!trimmed) return null

	try {
		const parsed = new URL(trimmed)
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return null
		}
		return parsed.toString()
	} catch {
		return null
	}
}

export const ProfileAvatarModal = ({
	open,
	onOpenChange,
	fullName,
	currentAvatarUrl,
}: ProfileAvatarModalProps) => {
	const { user } = useAuth()
	const queryClient = useQueryClient()
	const [avatarUrlInput, setAvatarUrlInput] = useState(
		currentAvatarUrl?.trim() || '',
	)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null)
	const [isSaving, setIsSaving] = useState(false)

	const previewUrl = useMemo(
		() =>
			filePreviewUrl ||
			avatarUrlInput.trim() ||
			currentAvatarUrl?.trim() ||
			null,
		[avatarUrlInput, currentAvatarUrl, filePreviewUrl],
	)

	useEffect(() => {
		if (!selectedFile) {
			setFilePreviewUrl(null)
			return
		}

		const objectUrl = URL.createObjectURL(selectedFile)
		setFilePreviewUrl(objectUrl)

		return () => URL.revokeObjectURL(objectUrl)
	}, [selectedFile])

	useEffect(() => {
		if (!open) return
		setAvatarUrlInput(currentAvatarUrl?.trim() || '')
		setSelectedFile(null)
		setFilePreviewUrl(null)
	}, [currentAvatarUrl, open])

	const ensureAuth = (): string => {
		if (!user?.id) throw new Error('Usuário não autenticado.')
		return user.id
	}

	const upsertAvatar = async (avatarUrl: string | null) => {
		const userId = ensureAuth()
		const supabase = getSupabaseClient()
		const fallbackName =
			fullName.trim() ||
			(user?.user_metadata.full_name as string | undefined) ||
			user?.email ||
			'Usuário'

		const { error } = await supabase.from('profiles').upsert(
			{
				user_id: userId,
				full_name: fallbackName,
				avatar_url: avatarUrl,
			},
			{ onConflict: 'user_id' },
		)

		if (error) throw new Error(error.message)

		await queryClient.invalidateQueries({
			queryKey: queryKeys.auth.profile(userId),
		})
	}

	const uploadAvatarFile = async (file: File): Promise<string> => {
		const userId = ensureAuth()
		const supabase = getSupabaseClient()
		const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
		const path = `${userId}/${Date.now()}-${safeName}`

		const { error } = await supabase.storage
			.from('profile-avatars')
			.upload(path, file, {
				upsert: true,
				contentType: file.type,
				cacheControl: '3600',
			})

		if (error) {
			throw new Error(
				`Falha ao enviar imagem para Storage (bucket profile-avatars). ${error.message}`,
			)
		}

		const { data } = supabase.storage.from('profile-avatars').getPublicUrl(path)
		return data.publicUrl
	}

	const handleSave = async () => {
		try {
			setIsSaving(true)
			let nextAvatarUrl: string | null = null

			if (selectedFile) {
				nextAvatarUrl = await uploadAvatarFile(selectedFile)
			} else {
				nextAvatarUrl = normalizeUrl(avatarUrlInput)
				if (avatarUrlInput.trim() && !nextAvatarUrl) {
					throw new Error('Informe uma URL válida (http ou https).')
				}
			}

			await upsertAvatar(nextAvatarUrl)
			toast.success('Foto de perfil atualizada.')
			onOpenChange(false)
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Não foi possível atualizar a foto.',
			)
		} finally {
			setIsSaving(false)
		}
	}

	const handleRemove = async () => {
		try {
			setIsSaving(true)
			await upsertAvatar(null)
			setAvatarUrlInput('')
			setSelectedFile(null)
			toast.success('Foto de perfil removida.')
			onOpenChange(false)
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Não foi possível remover a foto.',
			)
		} finally {
			setIsSaving(false)
		}
	}

	return (
		<AnimatedModalShell
			open={open}
			onOpenChange={onOpenChange}
			disabled={isSaving}
		>
			<Card className="overflow-hidden rounded-3xl border-border/75 bg-card shadow-[0_20px_50px_rgba(2,8,23,0.28)]">
				<CardHeader className="border-b border-border/70 bg-gradient-to-r from-primary/8 via-primary/4 to-transparent p-6">
					<CardTitle className="font-[var(--font-space)] text-xl">
						Atualizar foto de perfil
					</CardTitle>
					<CardDescription>
						Você pode enviar um arquivo ou informar uma URL de imagem pública.
					</CardDescription>
				</CardHeader>

				<CardContent className="space-y-5 p-6">
					<div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-muted/35 p-4">
						<UserAvatar name={fullName} avatarUrl={previewUrl} size="lg" />
						<div className="space-y-1">
							<p className="text-sm font-semibold">{fullName}</p>
							<p className="text-xs text-muted-foreground">
								Pré-visualização da foto no sistema.
							</p>
						</div>
					</div>

					<div className="space-y-2">
						<label htmlFor="avatar-upload" className="text-sm font-semibold">
							Upload da imagem
						</label>
						<Input
							id="avatar-upload"
							type="file"
							accept="image/*"
							onChange={(event) => {
								const file = event.target.files?.[0] ?? null
								if (!file) {
									setSelectedFile(null)
									return
								}

								if (!file.type.startsWith('image/')) {
									toast.error('Selecione apenas arquivos de imagem.')
									return
								}

								if (file.size > MAX_FILE_SIZE_BYTES) {
									toast.error('A imagem deve ter no máximo 5MB.')
									return
								}

								setSelectedFile(file)
							}}
						/>
						<p className="text-xs text-muted-foreground">
							Formatos aceitos: JPG, PNG, WEBP. Máximo 5MB.
						</p>
					</div>

					<div className="space-y-2">
						<label htmlFor="avatar-url-input" className="text-sm font-semibold">
							URL da imagem (opcional)
						</label>
						<Input
							id="avatar-url-input"
							placeholder="https://exemplo.com/minha-foto.jpg"
							value={avatarUrlInput}
							onChange={(event) => {
								setSelectedFile(null)
								setAvatarUrlInput(event.target.value)
							}}
						/>
					</div>

					<div className="flex flex-wrap items-center gap-2">
						<Button
							className="h-10 rounded-xl"
							onClick={handleSave}
							disabled={isSaving}
						>
							{isSaving ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Upload className="size-4" />
							)}
							Salvar foto
						</Button>
						<Button
							className="h-10 rounded-xl"
							variant="outline"
							onClick={handleRemove}
							disabled={isSaving}
						>
							<XCircle className="size-4" />
							Remover foto
						</Button>
					</div>
				</CardContent>
			</Card>
		</AnimatedModalShell>
	)
}
