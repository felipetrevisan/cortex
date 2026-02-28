'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getSupabaseClient } from '@/lib/supabase/client'

const schema = z.object({
	fullName: z.string().trim().optional().or(z.literal('')),
	email: z.string().email('E-mail inválido'),
	password: z.string().min(6, 'A senha precisa ter no mínimo 6 caracteres'),
})

type AuthFormValues = z.infer<typeof schema>

type Mode = 'login' | 'register'

export const useAuthForm = () => {
	const [mode, setMode] = useState<Mode>('login')
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<AuthFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			email: '',
			password: '',
			fullName: '',
		},
	})

	const submit = form.handleSubmit(async (values) => {
		setIsSubmitting(true)
		setErrorMessage(null)

		if (
			mode === 'register' &&
			(!values.fullName || values.fullName.trim().length < 2)
		) {
			form.setError('fullName', {
				type: 'manual',
				message: 'Informe seu nome completo',
			})
			setIsSubmitting(false)
			return
		}

		const supabase = getSupabaseClient()

		const request =
			mode === 'login'
				? supabase.auth.signInWithPassword({
						email: values.email,
						password: values.password,
					})
				: supabase.auth.signUp({
						email: values.email,
						password: values.password,
						options: {
							data: {
								full_name: values.fullName,
							},
						},
					})

		const { data, error } = await request

		if (error) {
			setErrorMessage(error.message)
			setIsSubmitting(false)
			return
		}

		if (mode === 'register' && data.user) {
			await supabase.from('profiles').upsert({
				user_id: data.user.id,
				full_name: values.fullName || data.user.email || 'Novo usuário',
				email: data.user.email ?? values.email,
				auth_provider: 'email',
			})
		}

		setIsSubmitting(false)
	})

	const signInWithGoogle = async () => {
		setErrorMessage(null)
		const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
		const origin = configuredAppUrl?.length
			? configuredAppUrl.replace(/\/+$/, '')
			: window.location.origin

		const { error } = await getSupabaseClient().auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${origin}/auth/callback`,
			},
		})

		if (error) {
			setErrorMessage(error.message)
		}
	}

	return {
		mode,
		setMode,
		form,
		submit,
		isSubmitting,
		errorMessage,
		signInWithGoogle,
	}
}
