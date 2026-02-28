import { redirect } from 'next/navigation'
import { DashboardScreen } from '@/features/dashboard/components/dashboard-screen'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function HomePage() {
	const supabase = await createSupabaseServerClient()
	const { data } = await supabase.auth.getUser()

	if (data.user) return <DashboardScreen />

	redirect('/login')
}
