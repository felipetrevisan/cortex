import type { Tables } from '../supabase/database.types'

export type AdminUserRow = Tables<'profiles'>

export type UserRole = 'admin' | 'user'

export interface AdminUserModel {
	id: string
	userId: string
	fullName: string
	email: string | null
	role: UserRole
	avatarUrl: string | null
	authProvider: string
	isDeleted: boolean
	deletedAt: Date | null
	createdAt: Date
	updatedAt: Date
}

const normalizeRole = (value: string): UserRole => {
	const normalized = value.trim().toLowerCase()
	return normalized === 'admin' ? 'admin' : 'user'
}

const normalizeProvider = (value: string | null): string => {
	if (!value) return 'email'
	const normalized = value.trim().toLowerCase()
	return normalized.length > 0 ? normalized : 'email'
}

export const mapAdminUser = (row: AdminUserRow): AdminUserModel => ({
	id: row.id,
	userId: row.user_id,
	fullName: row.full_name,
	email: row.email?.trim() || null,
	role: normalizeRole(row.role),
	avatarUrl: row.avatar_url?.trim() || null,
	authProvider: normalizeProvider(row.auth_provider),
	isDeleted: row.is_deleted,
	deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
	createdAt: new Date(row.created_at),
	updatedAt: new Date(row.updated_at),
})
