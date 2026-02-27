import type { Tables } from '../supabase/database.types'

export type ProfileRow = Tables<'profiles'>

export interface ProfileModel {
	id: string
	userId: string
	fullName: string
	role: string
	avatarUrl: string | null
	activeNicheId: string | null
	createdAt: Date
	updatedAt: Date
}

export const mapProfile = (row: ProfileRow): ProfileModel => ({
	id: row.id,
	userId: row.user_id,
	fullName: row.full_name,
	role: row.role.trim().toLowerCase(),
	avatarUrl: row.avatar_url?.trim() || null,
	activeNicheId: row.active_niche_id,
	createdAt: new Date(row.created_at),
	updatedAt: new Date(row.updated_at),
})
