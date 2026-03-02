'use client'

import { Badge } from '@cortex/ui/components/badge'
import {
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@cortex/ui/components/card'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@cortex/ui/components/dialog'
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
import { cn } from '@cortex/ui/lib/cn'
import {
	ArrowUpDown,
	Ban,
	Crosshair,
	Plus,
	RefreshCw,
	RotateCcw,
	X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { SlidingNumber } from '@/components/animate-ui/components/sliding-number'
import { useAuth } from '@/features/auth/components/auth-provider'
import { useAdminConfig } from '../../hooks/use-admin-config'
import { useAdminUsers } from '../../hooks/use-admin-users'
import {
	AnimatedActionButton,
	EmptyTableState,
	formatDateTime,
	getProviderLabel,
	IconActionButton,
	primaryCtaClassName,
	SectionToolbar,
	StatusBadge,
	selectTriggerClassName,
	TableShell,
} from '../admin-shared'

interface ResetFlowTarget {
	userId: string
	userName: string
	nicheId: string
	nicheName: string
}

export const AdminUsersSection = () => {
	const { user } = useAuth()
	const config = useAdminConfig()
	const adminUsers = useAdminUsers()
	const users = adminUsers.usersQuery.data?.users ?? []
	const usersStats = adminUsers.usersQuery.data?.stats ?? {
		total: 0,
		active: 0,
		deleted: 0,
		byProvider: [],
	}
	const niches = config.configQuery.data?.niches ?? []
	const signedUserId = user?.id ?? null
	const [pendingUserNiches, setPendingUserNiches] = useState<
		Record<string, string>
	>({})
	const [resetFlowTarget, setResetFlowTarget] =
		useState<ResetFlowTarget | null>(null)

	const availableNichesForAssignment = useMemo(
		() => niches.filter((niche) => niche.isActive),
		[niches],
	)

	const setPendingNicheForUser = (userId: string, nicheId: string) => {
		setPendingUserNiches((current) => ({
			...current,
			[userId]: nicheId,
		}))
	}

	if (adminUsers.usersQuery.isLoading || config.configQuery.isLoading)
		return null

	return (
		<>
			<div className="space-y-6">
				<SectionToolbar
					title="Usuários cadastrados"
					description="Gerencie método de cadastro, role e soft delete."
					actionLabel="Atualizar lista"
					actionIcon={RefreshCw}
					onAction={() => {
						void adminUsers.usersQuery.refetch()
					}}
					actionDisabled={adminUsers.usersQuery.isFetching}
				/>

				<div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
					<Card className="rounded-2xl">
						<CardHeader className="pb-1">
							<CardDescription>Total de usuários</CardDescription>
							<CardTitle className="text-3xl">
								<SlidingNumber value={usersStats.total} />
							</CardTitle>
						</CardHeader>
					</Card>
					<Card className="rounded-2xl">
						<CardHeader className="pb-1">
							<CardDescription>Usuários ativos</CardDescription>
							<CardTitle className="text-3xl">
								<SlidingNumber value={usersStats.active} />
							</CardTitle>
						</CardHeader>
					</Card>
					<Card className="rounded-2xl">
						<CardHeader className="pb-1">
							<CardDescription>Usuários desativados</CardDescription>
							<CardTitle className="text-3xl">
								<SlidingNumber value={usersStats.deleted} />
							</CardTitle>
						</CardHeader>
					</Card>
					<Card className="rounded-2xl">
						<CardHeader className="pb-1">
							<CardDescription>Por método de cadastro</CardDescription>
							<div className="flex flex-wrap gap-2 pt-3">
								{usersStats.byProvider.length === 0 ? (
									<Badge variant="outline">Sem dados</Badge>
								) : (
									usersStats.byProvider.map((providerStat) => (
										<Badge
											key={providerStat.provider}
											variant="secondary"
											className="rounded-full px-2.5 py-1 text-xs"
										>
											{getProviderLabel(providerStat.provider)}:{' '}
											<SlidingNumber
												value={providerStat.total}
												className="font-semibold"
											/>
										</Badge>
									))
								)}
							</div>
						</CardHeader>
					</Card>
				</div>

				<TableShell>
					<Table>
						<TableHeader className="bg-secondary/55">
							<TableRow className="hover:bg-secondary/55">
								<TableHead>Nome</TableHead>
								<TableHead>E-mail</TableHead>
								<TableHead>Método</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Nichos</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Criado em</TableHead>
								<TableHead>Deletado?</TableHead>
								<TableHead className="text-right">Ações</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.length === 0 ? (
								<EmptyTableState
									colSpan={9}
									message="Nenhum usuário cadastrado."
								/>
							) : (
								users.map((userItem) => {
									const canEditUser = signedUserId !== userItem.userId
									const isActionPending =
										adminUsers.updateRole.isPending ||
										adminUsers.setSoftDelete.isPending ||
										adminUsers.assignNiche.isPending ||
										adminUsers.setActiveNiche.isPending ||
										adminUsers.revokeNiche.isPending ||
										adminUsers.resetDiagnosticFlow.isPending
									const selectedNicheId =
										pendingUserNiches[userItem.userId] ??
										(userItem.niches.length > 0
											? (userItem.activeNicheId ??
												userItem.niches[0]?.nicheId ??
												'')
											: (availableNichesForAssignment[0]?.id ?? '')) ??
										''
									const selectedAssignedNiche =
										userItem.niches.find(
											(niche) => niche.nicheId === selectedNicheId,
										) ??
										userItem.niches.find(
											(niche) => niche.nicheId === userItem.activeNicheId,
										) ??
										userItem.niches[0] ??
										null

									return (
										<TableRow key={userItem.id}>
											<TableCell className="font-medium">
												{userItem.fullName || 'Sem nome'}
											</TableCell>
											<TableCell>{userItem.email || '-'}</TableCell>
											<TableCell>
												<Badge variant="outline">
													{getProviderLabel(userItem.authProvider)}
												</Badge>
											</TableCell>
											<TableCell>
												<Badge
													variant={
														userItem.role === 'admin' ? 'default' : 'secondary'
													}
												>
													{userItem.role === 'admin' ? 'Admin' : 'Usuário'}
												</Badge>
											</TableCell>
											<TableCell className="min-w-[260px]">
												{userItem.niches.length > 0 ? (
													<div className="flex flex-col gap-3">
														<div className="flex flex-wrap gap-2">
															{userItem.niches.map((niche) => (
																<div
																	key={niche.accessId}
																	className={cn(
																		'inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs shadow-sm',
																		userItem.activeNicheId === niche.nicheId
																			? 'border-primary/45 bg-primary-soft text-primary'
																			: 'border-border/80 bg-secondary/55 text-secondary-foreground',
																	)}
																>
																	<span className="font-medium">
																		{niche.name}
																	</span>
																	{userItem.activeNicheId === niche.nicheId ? (
																		<Badge
																			variant="default"
																			className="rounded-full px-2 py-0.5 text-[10px]"
																		>
																			Ativo
																		</Badge>
																	) : null}
																	<IconActionButton
																		icon={X}
																		label={`Remover nicho ${niche.name}`}
																		variant="ghost"
																		className="size-6 rounded-full text-rose-500 hover:bg-rose-500/12 hover:text-rose-600"
																		disabled={!canEditUser || isActionPending}
																		onClick={() =>
																			adminUsers.revokeNiche.mutate({
																				accessId: niche.accessId,
																				userId: userItem.userId,
																				nicheId: niche.nicheId,
																			})
																		}
																	/>
																</div>
															))}
														</div>
														{userItem.niches.length > 1 ? (
															<div className="flex flex-wrap items-center gap-2">
																<Select
																	value={selectedNicheId}
																	onValueChange={(value) =>
																		setPendingNicheForUser(
																			userItem.userId,
																			value,
																		)
																	}
																>
																	<SelectTrigger
																		className={cn(
																			selectTriggerClassName,
																			'h-9 w-[180px] min-w-[180px]',
																		)}
																	>
																		<SelectValue placeholder="Definir nicho ativo" />
																	</SelectTrigger>
																	<SelectContent>
																		{userItem.niches.map((niche) => (
																			<SelectItem
																				key={niche.accessId}
																				value={niche.nicheId}
																			>
																				{niche.name}
																			</SelectItem>
																		))}
																	</SelectContent>
																</Select>
																<IconActionButton
																	icon={Crosshair}
																	label="Definir nicho ativo"
																	className="bg-tertiary text-tertiary-foreground hover:bg-tertiary/90"
																	disabled={
																		!canEditUser ||
																		isActionPending ||
																		!selectedNicheId ||
																		selectedNicheId === userItem.activeNicheId
																	}
																	onClick={() =>
																		adminUsers.setActiveNiche.mutate({
																			userId: userItem.userId,
																			nicheId: selectedNicheId,
																		})
																	}
																/>
															</div>
														) : null}
													</div>
												) : (
													<div className="flex flex-col gap-2">
														<Badge
															variant="outline"
															className="w-fit rounded-full px-2.5 py-1 text-xs"
														>
															Sem nichos liberados
														</Badge>
														<div className="flex flex-wrap items-center gap-2">
															<Select
																value={selectedNicheId}
																onValueChange={(value) =>
																	setPendingNicheForUser(userItem.userId, value)
																}
															>
																<SelectTrigger
																	className={cn(
																		selectTriggerClassName,
																		'h-9 w-[180px] min-w-[180px]',
																	)}
																>
																	<SelectValue placeholder="Selecionar nicho" />
																</SelectTrigger>
																<SelectContent>
																	{availableNichesForAssignment.map((niche) => (
																		<SelectItem key={niche.id} value={niche.id}>
																			{niche.name}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<IconActionButton
																icon={Plus}
																label="Liberar nicho"
																className={primaryCtaClassName}
																disabled={
																	!canEditUser ||
																	isActionPending ||
																	!selectedNicheId ||
																	availableNichesForAssignment.length === 0
																}
																onClick={() =>
																	adminUsers.assignNiche.mutate({
																		userId: userItem.userId,
																		nicheId: selectedNicheId,
																	})
																}
															/>
														</div>
													</div>
												)}
											</TableCell>
											<TableCell>
												<StatusBadge active={!userItem.isDeleted} />
											</TableCell>
											<TableCell>
												{formatDateTime(userItem.createdAt)}
											</TableCell>
											<TableCell>
												{formatDateTime(userItem.deletedAt)}
											</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<IconActionButton
														icon={RefreshCw}
														label={
															selectedAssignedNiche
																? `Resetar fluxo de ${selectedAssignedNiche.name}`
																: 'Resetar fluxo'
														}
														className="border-0 bg-amber-500 text-white hover:bg-amber-400"
														disabled={isActionPending || !selectedAssignedNiche}
														onClick={() => {
															if (!selectedAssignedNiche) return
															setResetFlowTarget({
																userId: userItem.userId,
																userName: userItem.fullName || 'Usuário',
																nicheId: selectedAssignedNiche.nicheId,
																nicheName: selectedAssignedNiche.name,
															})
														}}
													/>
													<IconActionButton
														icon={ArrowUpDown}
														label={
															userItem.role === 'admin'
																? 'Tornar usuário'
																: 'Tornar admin'
														}
														className="border-0 bg-tertiary text-tertiary-foreground hover:bg-tertiary/90"
														disabled={!canEditUser || isActionPending}
														onClick={() =>
															adminUsers.updateRole.mutate({
																userId: userItem.userId,
																role:
																	userItem.role === 'admin' ? 'user' : 'admin',
															})
														}
													/>
													<IconActionButton
														icon={userItem.isDeleted ? RotateCcw : Ban}
														label={userItem.isDeleted ? 'Restaurar' : 'Excluir'}
														className={cn(
															'border-0 text-white',
															userItem.isDeleted
																? 'bg-emerald-600 hover:bg-emerald-500'
																: 'bg-rose-600 hover:bg-rose-500',
														)}
														disabled={!canEditUser || isActionPending}
														onClick={() =>
															adminUsers.setSoftDelete.mutate({
																userId: userItem.userId,
																deleted: !userItem.isDeleted,
															})
														}
													/>
												</div>
											</TableCell>
										</TableRow>
									)
								})
							)}
						</TableBody>
					</Table>
				</TableShell>
			</div>

			<Dialog
				open={Boolean(resetFlowTarget)}
				onOpenChange={(isOpen) => {
					if (!isOpen) setResetFlowTarget(null)
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Resetar fluxo do usuário</DialogTitle>
						<DialogDescription>
							Esse reset remove ciclos, respostas e progresso do protocolo do
							nicho selecionado, mantendo conta, acesso e permissões.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
						<p>
							<span className="font-semibold">Usuário:</span>{' '}
							{resetFlowTarget?.userName ?? '-'}
						</p>
						<p>
							<span className="font-semibold">Nicho:</span>{' '}
							{resetFlowTarget?.nicheName ?? '-'}
						</p>
						<p className="text-muted-foreground">
							Use isso apenas para teste. O próximo acesso desse usuário vai
							recomeçar o processo do zero nesse nicho.
						</p>
					</div>
					<DialogFooter>
						<button
							type="button"
							className="inline-flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-accent"
							onClick={() => setResetFlowTarget(null)}
							disabled={adminUsers.resetDiagnosticFlow.isPending}
						>
							Cancelar
						</button>
						<AnimatedActionButton
							icon={RefreshCw}
							className="h-10 rounded-xl bg-amber-500 text-white shadow-sm transition-colors hover:bg-amber-400"
							disabled={
								adminUsers.resetDiagnosticFlow.isPending || !resetFlowTarget
							}
							onClick={async () => {
								if (!resetFlowTarget) return
								await adminUsers.resetDiagnosticFlow.mutateAsync({
									userId: resetFlowTarget.userId,
									nicheId: resetFlowTarget.nicheId,
								})
								setResetFlowTarget(null)
							}}
						>
							Resetar fluxo
						</AnimatedActionButton>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	)
}
