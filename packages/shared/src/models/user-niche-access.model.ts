import type { Tables } from '../supabase/database.types'

export type UserNicheAccessRow = Tables<'user_niche_access'>

export interface UserNicheAccessModel {
	id: string
	userId: string
	nicheId: string
	status: string
	source: string | null
	orderId: string | null
	purchasedAt: Date
	expiresAt: Date | null
	createdAt: Date
	updatedAt: Date
}

export interface AccessibleNicheModel {
	access: UserNicheAccessModel
	niche: {
		id: string
		name: string
		slug: string
		description: string | null
		isActive: boolean
	}
}

const toDate = (value: string | null): Date | null => {
	if (!value) return null
	return new Date(value)
}

export const mapUserNicheAccess = (
	row: UserNicheAccessRow,
): UserNicheAccessModel => ({
	id: row.id,
	userId: row.user_id,
	nicheId: row.niche_id,
	status: row.status,
	source: row.source,
	orderId: row.order_id,
	purchasedAt: new Date(row.purchased_at),
	expiresAt: toDate(row.expires_at),
	createdAt: new Date(row.created_at),
	updatedAt: new Date(row.updated_at),
})
