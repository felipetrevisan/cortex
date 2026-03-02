'use client'

import type { TablesInsert } from '@cortex/shared/supabase/database.types'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@cortex/ui/components/dialog'
import { Input } from '@cortex/ui/components/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@cortex/ui/components/select'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@cortex/ui/components/table'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useAdminConfig } from '../../hooks/use-admin-config'
import {
	AnimatedActionButton,
	EmptyTableState,
	phaseTypeOptions,
	pillarOptions,
	primaryCtaClassName,
	SectionToolbar,
	StatusBadge,
	selectTriggerClassName,
	TableShell,
} from '../admin-shared'

interface PhaseFormValues {
	nicheId: string
	title: string
	phaseType: TablesInsert<'diagnostic_phases'>['phase_type']
	pillar: string
	blockNumber: string
	orderIndex: number
}

export const AdminPhasesSection = () => {
	const config = useAdminConfig()
	const niches = config.configQuery.data?.niches ?? []
	const phases = config.configQuery.data?.phases ?? []
	const nicheNameById = new Map(niches.map((niche) => [niche.id, niche.name]))
	const orderedPhases = [...phases].sort((a, b) => a.orderIndex - b.orderIndex)
	const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false)
	const phaseForm = useForm<PhaseFormValues>({
		defaultValues: {
			nicheId: '',
			title: '',
			phaseType: 'phase1',
			pillar: 'none',
			blockNumber: '',
			orderIndex: 1,
		},
	})

	if (config.configQuery.isLoading) return null

	return (
		<>
			<div className="space-y-4">
				<SectionToolbar
					title="Fases cadastradas"
					description="Associe fase, pilar e ordem do fluxo."
					actionLabel="Adicionar novo"
					onAction={() => setIsPhaseModalOpen(true)}
				/>

				<TableShell>
					<Table>
						<TableHeader className="bg-secondary/55">
							<TableRow className="hover:bg-secondary/55">
								<TableHead>Título</TableHead>
								<TableHead>Nicho</TableHead>
								<TableHead>Tipo</TableHead>
								<TableHead>Pilar</TableHead>
								<TableHead>Bloco</TableHead>
								<TableHead>Ordem</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{orderedPhases.length === 0 ? (
								<EmptyTableState
									colSpan={7}
									message="Nenhuma fase cadastrada."
								/>
							) : (
								orderedPhases.map((phase) => (
									<TableRow key={phase.id}>
										<TableCell className="font-medium">{phase.title}</TableCell>
										<TableCell>
											{nicheNameById.get(phase.nicheId) ?? '-'}
										</TableCell>
										<TableCell>{phase.phaseType}</TableCell>
										<TableCell>{phase.pillar ?? '-'}</TableCell>
										<TableCell>{phase.blockNumber ?? '-'}</TableCell>
										<TableCell>{phase.orderIndex}</TableCell>
										<TableCell>
											<StatusBadge active={phase.isActive} />
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableShell>
			</div>

			<Dialog open={isPhaseModalOpen} onOpenChange={setIsPhaseModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Adicionar fase</DialogTitle>
						<DialogDescription>
							Defina tipo, pilar e ordem da fase.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={phaseForm.handleSubmit(async (values) => {
							await config.createPhase.mutateAsync({
								niche_id: values.nicheId,
								title: values.title.trim(),
								phase_type: values.phaseType,
								pillar: values.pillar === 'none' ? null : values.pillar || null,
								block_number: values.blockNumber
									? Number(values.blockNumber)
									: null,
								order_index: Number(values.orderIndex),
								is_active: true,
							})
							phaseForm.reset({
								nicheId: '',
								title: '',
								phaseType: 'phase1',
								pillar: 'none',
								blockNumber: '',
								orderIndex: 1,
							})
							setIsPhaseModalOpen(false)
						})}
					>
						<Controller
							control={phaseForm.control}
							name="nicheId"
							rules={{ required: true }}
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									{...(field.value ? { value: field.value } : {})}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione o nicho" />
									</SelectTrigger>
									<SelectContent>
										{niches.map((niche) => (
											<SelectItem key={niche.id} value={niche.id}>
												{niche.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							placeholder="Título da fase"
							{...phaseForm.register('title', { required: true })}
						/>
						<Controller
							control={phaseForm.control}
							name="phaseType"
							rules={{ required: true }}
							render={({ field }) => (
								<Select value={field.value} onValueChange={field.onChange}>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione o tipo da fase" />
									</SelectTrigger>
									<SelectContent>
										{phaseTypeOptions.map((phaseType) => (
											<SelectItem key={phaseType.value} value={phaseType.value}>
												{phaseType.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Controller
							control={phaseForm.control}
							name="pillar"
							render={({ field }) => (
								<Select
									value={field.value || 'none'}
									onValueChange={field.onChange}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione o pilar" />
									</SelectTrigger>
									<SelectContent>
										{pillarOptions.map((pillar) => (
											<SelectItem key={pillar.value} value={pillar.value}>
												{pillar.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							type="number"
							placeholder="Nº do bloco (1..3 para protocolo)"
							{...phaseForm.register('blockNumber')}
						/>
						<Input
							type="number"
							placeholder="Ordem da fase"
							{...phaseForm.register('orderIndex', { valueAsNumber: true })}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={Plus}
								className={primaryCtaClassName}
								disabled={config.createPhase.isPending}
							>
								Salvar fase
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}
