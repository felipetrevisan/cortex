export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[]

export type Database = {
	__InternalSupabase: {
		PostgrestVersion: '14.1'
	}
	public: {
		Tables: {
			diagnostic_cycles: {
				Row: {
					created_at: string
					critical_pillar: string | null
					cycle_number: number
					general_index: number | null
					id: string
					niche_id: string | null
					phase1_completed_at: string | null
					phase2_completed_at: string | null
					phase2_general_index: number | null
					phase2_state_index: number | null
					phase2_technical_index: number | null
					pillar_clarity: number | null
					pillar_emotional: number | null
					pillar_execution: number | null
					pillar_structure: number | null
					protocol_completed_at: string | null
					reeval_45_completed_at: string | null
					reeval_90_completed_at: string | null
					started_at: string
					status: string
					strong_pillar: string | null
					updated_at: string
					user_id: string
				}
				Insert: {
					created_at?: string
					critical_pillar?: string | null
					cycle_number?: number
					general_index?: number | null
					id?: string
					niche_id?: string | null
					phase1_completed_at?: string | null
					phase2_completed_at?: string | null
					phase2_general_index?: number | null
					phase2_state_index?: number | null
					phase2_technical_index?: number | null
					pillar_clarity?: number | null
					pillar_emotional?: number | null
					pillar_execution?: number | null
					pillar_structure?: number | null
					protocol_completed_at?: string | null
					reeval_45_completed_at?: string | null
					reeval_90_completed_at?: string | null
					started_at?: string
					status?: string
					strong_pillar?: string | null
					updated_at?: string
					user_id: string
				}
				Update: {
					created_at?: string
					critical_pillar?: string | null
					cycle_number?: number
					general_index?: number | null
					id?: string
					niche_id?: string | null
					phase1_completed_at?: string | null
					phase2_completed_at?: string | null
					phase2_general_index?: number | null
					phase2_state_index?: number | null
					phase2_technical_index?: number | null
					pillar_clarity?: number | null
					pillar_emotional?: number | null
					pillar_execution?: number | null
					pillar_structure?: number | null
					protocol_completed_at?: string | null
					reeval_45_completed_at?: string | null
					reeval_90_completed_at?: string | null
					started_at?: string
					status?: string
					strong_pillar?: string | null
					updated_at?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: 'diagnostic_cycles_niche_id_fkey'
						columns: ['niche_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_niches'
						referencedColumns: ['id']
					},
				]
			}
			diagnostic_niches: {
				Row: {
					created_at: string
					description: string | null
					id: string
					is_active: boolean
					is_default: boolean
					name: string
					slug: string
					updated_at: string
				}
				Insert: {
					created_at?: string
					description?: string | null
					id?: string
					is_active?: boolean
					is_default?: boolean
					name: string
					slug: string
					updated_at?: string
				}
				Update: {
					created_at?: string
					description?: string | null
					id?: string
					is_active?: boolean
					is_default?: boolean
					name?: string
					slug?: string
					updated_at?: string
				}
				Relationships: []
			}
			diagnostic_phase_options: {
				Row: {
					created_at: string
					id: string
					is_active: boolean
					label: string
					order_index: number
					phase_id: string
					updated_at: string
					value: number
				}
				Insert: {
					created_at?: string
					id?: string
					is_active?: boolean
					label: string
					order_index?: number
					phase_id: string
					updated_at?: string
					value: number
				}
				Update: {
					created_at?: string
					id?: string
					is_active?: boolean
					label?: string
					order_index?: number
					phase_id?: string
					updated_at?: string
					value?: number
				}
				Relationships: [
					{
						foreignKeyName: 'diagnostic_phase_options_phase_id_fkey'
						columns: ['phase_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_phases'
						referencedColumns: ['id']
					},
				]
			}
			diagnostic_phase_questions: {
				Row: {
					created_at: string
					id: string
					is_active: boolean
					order_index: number
					phase_id: string
					prompt: string
					updated_at: string
				}
				Insert: {
					created_at?: string
					id?: string
					is_active?: boolean
					order_index?: number
					phase_id: string
					prompt: string
					updated_at?: string
				}
				Update: {
					created_at?: string
					id?: string
					is_active?: boolean
					order_index?: number
					phase_id?: string
					prompt?: string
					updated_at?: string
				}
				Relationships: [
					{
						foreignKeyName: 'diagnostic_phase_questions_phase_id_fkey'
						columns: ['phase_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_phases'
						referencedColumns: ['id']
					},
				]
			}
			diagnostic_phases: {
				Row: {
					block_number: number | null
					created_at: string
					id: string
					is_active: boolean
					niche_id: string
					order_index: number
					phase_type: string
					pillar: string | null
					title: string
					updated_at: string
				}
				Insert: {
					block_number?: number | null
					created_at?: string
					id?: string
					is_active?: boolean
					niche_id: string
					order_index?: number
					phase_type: string
					pillar?: string | null
					title: string
					updated_at?: string
				}
				Update: {
					block_number?: number | null
					created_at?: string
					id?: string
					is_active?: boolean
					niche_id?: string
					order_index?: number
					phase_type?: string
					pillar?: string | null
					title?: string
					updated_at?: string
				}
				Relationships: [
					{
						foreignKeyName: 'diagnostic_phases_niche_id_fkey'
						columns: ['niche_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_niches'
						referencedColumns: ['id']
					},
				]
			}
			phase1_responses: {
				Row: {
					created_at: string
					cycle_id: string
					id: string
					niche_id: string | null
					pillar: string
					question_number: number
					score: number
					user_id: string
				}
				Insert: {
					created_at?: string
					cycle_id: string
					id?: string
					niche_id?: string | null
					pillar: string
					question_number: number
					score: number
					user_id: string
				}
				Update: {
					created_at?: string
					cycle_id?: string
					id?: string
					niche_id?: string | null
					pillar?: string
					question_number?: number
					score?: number
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: 'phase1_responses_cycle_id_fkey'
						columns: ['cycle_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_cycles'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'phase1_responses_niche_id_fkey'
						columns: ['niche_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_niches'
						referencedColumns: ['id']
					},
				]
			}
			phase2_responses: {
				Row: {
					created_at: string
					cycle_id: string
					id: string
					niche_id: string | null
					question_number: number
					question_type: string
					score: number
					user_id: string
				}
				Insert: {
					created_at?: string
					cycle_id: string
					id?: string
					niche_id?: string | null
					question_number: number
					question_type: string
					score: number
					user_id: string
				}
				Update: {
					created_at?: string
					cycle_id?: string
					id?: string
					niche_id?: string | null
					question_number?: number
					question_type?: string
					score?: number
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: 'phase2_responses_cycle_id_fkey'
						columns: ['cycle_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_cycles'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'phase2_responses_niche_id_fkey'
						columns: ['niche_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_niches'
						referencedColumns: ['id']
					},
				]
			}
			profiles: {
				Row: {
					active_niche_id: string | null
					auth_provider: string
					avatar_url: string | null
					created_at: string
					deleted_at: string | null
					email: string | null
					full_name: string
					id: string
					is_deleted: boolean
					role: string
					updated_at: string
					user_id: string
				}
				Insert: {
					active_niche_id?: string | null
					auth_provider?: string
					avatar_url?: string | null
					created_at?: string
					deleted_at?: string | null
					email?: string | null
					full_name?: string
					id?: string
					is_deleted?: boolean
					role?: string
					updated_at?: string
					user_id: string
				}
				Update: {
					active_niche_id?: string | null
					auth_provider?: string
					avatar_url?: string | null
					created_at?: string
					deleted_at?: string | null
					email?: string | null
					full_name?: string
					id?: string
					is_deleted?: boolean
					role?: string
					updated_at?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: 'profiles_active_niche_id_fkey'
						columns: ['active_niche_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_niches'
						referencedColumns: ['id']
					},
				]
			}
			protocol_progress: {
				Row: {
					block1_actions: boolean[] | null
					block2_actions: boolean[] | null
					block3_actions: boolean[] | null
					completed_at: string | null
					created_at: string
					current_block: number
					cycle_id: string
					id: string
					niche_id: string | null
					reflections: Json | null
					updated_at: string
					user_id: string
				}
				Insert: {
					block1_actions?: boolean[] | null
					block2_actions?: boolean[] | null
					block3_actions?: boolean[] | null
					completed_at?: string | null
					created_at?: string
					current_block?: number
					cycle_id: string
					id?: string
					niche_id?: string | null
					reflections?: Json | null
					updated_at?: string
					user_id: string
				}
				Update: {
					block1_actions?: boolean[] | null
					block2_actions?: boolean[] | null
					block3_actions?: boolean[] | null
					completed_at?: string | null
					created_at?: string
					current_block?: number
					cycle_id?: string
					id?: string
					niche_id?: string | null
					reflections?: Json | null
					updated_at?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: 'protocol_progress_cycle_id_fkey'
						columns: ['cycle_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_cycles'
						referencedColumns: ['id']
					},
					{
						foreignKeyName: 'protocol_progress_niche_id_fkey'
						columns: ['niche_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_niches'
						referencedColumns: ['id']
					},
				]
			}
			user_niche_access: {
				Row: {
					created_at: string
					expires_at: string | null
					id: string
					niche_id: string
					order_id: string | null
					purchased_at: string
					source: string | null
					status: string
					updated_at: string
					user_id: string
				}
				Insert: {
					created_at?: string
					expires_at?: string | null
					id?: string
					niche_id: string
					order_id?: string | null
					purchased_at?: string
					source?: string | null
					status?: string
					updated_at?: string
					user_id: string
				}
				Update: {
					created_at?: string
					expires_at?: string | null
					id?: string
					niche_id?: string
					order_id?: string | null
					purchased_at?: string
					source?: string | null
					status?: string
					updated_at?: string
					user_id?: string
				}
				Relationships: [
					{
						foreignKeyName: 'user_niche_access_niche_id_fkey'
						columns: ['niche_id']
						isOneToOne: false
						referencedRelation: 'diagnostic_niches'
						referencedColumns: ['id']
					},
				]
			}
		}
		Views: {
			[_ in never]: never
		}
		Functions: {
			[_ in never]: never
		}
		Enums: {
			[_ in never]: never
		}
		CompositeTypes: {
			[_ in never]: never
		}
	}
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
	DefaultSchemaTableNameOrOptions extends
		| keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
				DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
			DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
			Row: infer R
		}
		? R
		: never
	: DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
				DefaultSchema['Views'])
		? (DefaultSchema['Tables'] &
				DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
				Row: infer R
			}
			? R
			: never
		: never

export type TablesInsert<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Insert: infer I
		}
		? I
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Insert: infer I
			}
			? I
			: never
		: never

export type TablesUpdate<
	DefaultSchemaTableNameOrOptions extends
		| keyof DefaultSchema['Tables']
		| { schema: keyof DatabaseWithoutInternals },
	TableName extends DefaultSchemaTableNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
		: never = never,
> = DefaultSchemaTableNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
			Update: infer U
		}
		? U
		: never
	: DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
		? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
				Update: infer U
			}
			? U
			: never
		: never

export type Enums<
	DefaultSchemaEnumNameOrOptions extends
		| keyof DefaultSchema['Enums']
		| { schema: keyof DatabaseWithoutInternals },
	EnumName extends DefaultSchemaEnumNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
		: never = never,
> = DefaultSchemaEnumNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
	: DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
		? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
		: never

export type CompositeTypes<
	PublicCompositeTypeNameOrOptions extends
		| keyof DefaultSchema['CompositeTypes']
		| { schema: keyof DatabaseWithoutInternals },
	CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
		schema: keyof DatabaseWithoutInternals
	}
		? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
		: never = never,
> = PublicCompositeTypeNameOrOptions extends {
	schema: keyof DatabaseWithoutInternals
}
	? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
	: PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
		? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
		: never

export const Constants = {
	public: {
		Enums: {},
	},
} as const
