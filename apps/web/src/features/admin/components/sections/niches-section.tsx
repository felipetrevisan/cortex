'use client'

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
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@cortex/ui/components/table'
import { cn } from '@cortex/ui/lib/cn'
import { BadgeCheck, Ban, Pencil, Plus, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAdminConfig } from '../../hooks/use-admin-config'
import {
	AnimatedActionButton,
	EmptyTableState,
	formatCurrencyFromCents,
	IconActionButton,
	parseCurrencyInputToCents,
	primaryCtaClassName,
	SectionToolbar,
	StatusBadge,
	TableShell,
} from '../admin-shared'

interface NicheFormValues {
	name: string
	description: string
	phase2ReevaluationDays: string
	newCycleDays: string
	repurchasePrice: string
	repurchaseCheckoutUrl: string
}

export const AdminNichesSection = () => {
	const config = useAdminConfig()
	const niches = config.configQuery.data?.niches ?? []
	const [isNicheModalOpen, setIsNicheModalOpen] = useState(false)
	const [editingNicheId, setEditingNicheId] = useState<string | null>(null)

	const nicheForm = useForm<NicheFormValues>({
		defaultValues: {
			name: '',
			description: '',
			phase2ReevaluationDays: '45',
			newCycleDays: '90',
			repurchasePrice: '',
			repurchaseCheckoutUrl: '',
		},
	})

	const resetNicheForm = () => {
		setEditingNicheId(null)
		nicheForm.reset({
			name: '',
			description: '',
			phase2ReevaluationDays: '45',
			newCycleDays: '90',
			repurchasePrice: '',
			repurchaseCheckoutUrl: '',
		})
	}

	const openEditNicheModal = (nicheId: string) => {
		const niche = niches.find((item) => item.id === nicheId)
		if (!niche) return

		setEditingNicheId(niche.id)
		nicheForm.reset({
			name: niche.name,
			description: niche.description ?? '',
			phase2ReevaluationDays: String(niche.phase2ReevaluationDays),
			newCycleDays: String(niche.newCycleDays),
			repurchasePrice:
				niche.repurchasePriceCents == null
					? ''
					: (niche.repurchasePriceCents / 100).toFixed(2).replace('.', ','),
			repurchaseCheckoutUrl: niche.repurchaseCheckoutUrl ?? '',
		})
		setIsNicheModalOpen(true)
	}

	if (config.configQuery.isLoading) return null

	return (
		<>
			<div className="space-y-4">
				<SectionToolbar
					title="Nichos cadastrados"
					description="Gerencie status e disponibilidade dos nichos."
					actionLabel="Adicionar novo"
					onAction={() => {
						resetNicheForm()
						setIsNicheModalOpen(true)
					}}
				/>

				<TableShell>
					<Table>
						<TableHeader className="bg-secondary/55">
							<TableRow className="hover:bg-secondary/55">
								<TableHead>Nome</TableHead>
								<TableHead>Slug</TableHead>
								<TableHead>Reavaliação</TableHead>
								<TableHead>Novo ciclo</TableHead>
								<TableHead>Recompra</TableHead>
								<TableHead>Status</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{niches.length === 0 ? (
								<EmptyTableState
									colSpan={7}
									message="Nenhum nicho cadastrado."
								/>
							) : (
								niches.map((niche) => (
									<TableRow key={niche.id}>
										<TableCell className="font-medium">{niche.name}</TableCell>
										<TableCell className="text-muted-foreground">
											{niche.slug}
										</TableCell>
										<TableCell>{niche.phase2ReevaluationDays} dias</TableCell>
										<TableCell>{niche.newCycleDays} dias</TableCell>
										<TableCell className="max-w-[240px]">
											<div className="space-y-1">
												<p className="font-medium">
													{formatCurrencyFromCents(niche.repurchasePriceCents)}
												</p>
												<p className="truncate text-xs text-muted-foreground">
													{niche.repurchaseCheckoutUrl || 'Sem link'}
												</p>
											</div>
										</TableCell>
										<TableCell>
											<StatusBadge active={niche.isActive} />
										</TableCell>
										<TableCell>
											<div className="flex justify-end gap-2">
												<IconActionButton
													icon={Pencil}
													label="Editar nicho"
													variant="outline"
													onClick={() => openEditNicheModal(niche.id)}
												/>
												<AnimatedActionButton
													size="sm"
													variant="default"
													icon={niche.isActive ? Ban : BadgeCheck}
													className={cn(
														'rounded-lg border-0 text-white',
														niche.isActive
															? 'bg-rose-600 hover:bg-rose-500'
															: 'bg-emerald-600 hover:bg-emerald-500',
													)}
													onClick={() =>
														config.updateNiche.mutate({
															id: niche.id,
															data: { is_active: !niche.isActive },
														})
													}
												>
													{niche.isActive ? 'Desativar' : 'Ativar'}
												</AnimatedActionButton>
											</div>
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableShell>
			</div>

			<Dialog
				open={isNicheModalOpen}
				onOpenChange={(isOpen) => {
					setIsNicheModalOpen(isOpen)
					if (!isOpen) resetNicheForm()
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingNicheId ? 'Editar nicho' : 'Adicionar nicho'}
						</DialogTitle>
						<DialogDescription>
							Configure nome, prazos do ciclo e oferta de recompra do nicho.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={nicheForm.handleSubmit(async (values) => {
							const payload = {
								name: values.name,
								description: values.description,
								phase2ReevaluationDays: Math.max(
									1,
									Number(values.phase2ReevaluationDays) || 45,
								),
								newCycleDays: Math.max(1, Number(values.newCycleDays) || 90),
								repurchasePriceCents: parseCurrencyInputToCents(
									values.repurchasePrice,
								),
								repurchaseCheckoutUrl: values.repurchaseCheckoutUrl,
							}

							if (editingNicheId) {
								await config.updateNiche.mutateAsync({
									id: editingNicheId,
									data: {
										name: payload.name.trim(),
										description: payload.description?.trim() || null,
										phase2_reevaluation_days: payload.phase2ReevaluationDays,
										new_cycle_days: payload.newCycleDays,
										repurchase_price_cents: payload.repurchasePriceCents,
										repurchase_checkout_url:
											payload.repurchaseCheckoutUrl?.trim() || null,
									},
								})
							} else {
								await config.createNiche.mutateAsync(payload)
							}

							resetNicheForm()
							setIsNicheModalOpen(false)
						})}
					>
						<Input
							placeholder="Nome do nicho"
							{...nicheForm.register('name', { required: true })}
						/>
						<Input
							placeholder="Descrição (opcional)"
							{...nicheForm.register('description')}
						/>
						<div className="grid gap-4 sm:grid-cols-2">
							<Input
								type="number"
								min={1}
								placeholder="Dias para reavaliação"
								{...nicheForm.register('phase2ReevaluationDays', {
									required: true,
								})}
							/>
							<Input
								type="number"
								min={1}
								placeholder="Dias para novo ciclo"
								{...nicheForm.register('newCycleDays', { required: true })}
							/>
						</div>
						<Input
							placeholder="Valor da recompra (ex.: 97,00)"
							{...nicheForm.register('repurchasePrice')}
						/>
						<Input
							type="url"
							placeholder="Link de pagamento/recompra"
							{...nicheForm.register('repurchaseCheckoutUrl')}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={editingNicheId ? Save : Plus}
								className={primaryCtaClassName}
								disabled={
									config.createNiche.isPending || config.updateNiche.isPending
								}
							>
								{editingNicheId ? 'Salvar alterações' : 'Salvar nicho'}
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}
