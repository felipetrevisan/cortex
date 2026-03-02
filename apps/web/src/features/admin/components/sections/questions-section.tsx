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
import { Pencil, Plus, Save } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useAdminConfig } from '../../hooks/use-admin-config'
import {
	AnimatedActionButton,
	EmptyTableState,
	IconActionButton,
	primaryCtaClassName,
	SectionToolbar,
	StatusBadge,
	selectTriggerClassName,
	TableShell,
} from '../admin-shared'

interface QuestionFormValues {
	phaseId: string
	prompt: string
	orderIndex: number
}

interface OptionFormValues {
	phaseId: string
	label: string
	value: number
	orderIndex: number
}

export const AdminQuestionsSection = () => {
	const config = useAdminConfig()
	const phases = config.configQuery.data?.phases ?? []
	const questions = config.configQuery.data?.questions ?? []
	const options = config.configQuery.data?.options ?? []
	const phaseNameById = useMemo(
		() => new Map(phases.map((phase) => [phase.id, phase.title])),
		[phases],
	)
	const orderedPhases = useMemo(
		() => [...phases].sort((a, b) => a.orderIndex - b.orderIndex),
		[phases],
	)
	const orderedQuestions = useMemo(
		() => [...questions].sort((a, b) => a.orderIndex - b.orderIndex),
		[questions],
	)
	const orderedOptions = useMemo(
		() => [...options].sort((a, b) => a.orderIndex - b.orderIndex),
		[options],
	)

	const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
	const [isOptionModalOpen, setIsOptionModalOpen] = useState(false)
	const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
		null,
	)

	const questionForm = useForm<QuestionFormValues>({
		defaultValues: {
			phaseId: '',
			prompt: '',
			orderIndex: 1,
		},
	})
	const optionForm = useForm<OptionFormValues>({
		defaultValues: {
			phaseId: '',
			label: '',
			value: 1,
			orderIndex: 1,
		},
	})

	const resetQuestionForm = () => {
		setEditingQuestionId(null)
		questionForm.reset({
			phaseId: '',
			prompt: '',
			orderIndex: 1,
		})
	}

	const openEditQuestionModal = (questionId: string) => {
		const question = questions.find((item) => item.id === questionId)
		if (!question) return

		setEditingQuestionId(question.id)
		questionForm.reset({
			phaseId: question.phaseId,
			prompt: question.prompt,
			orderIndex: question.orderIndex,
		})
		setIsQuestionModalOpen(true)
	}

	if (config.configQuery.isLoading) return null

	return (
		<>
			<div className="space-y-8">
				<div className="space-y-4">
					<SectionToolbar
						title="Perguntas cadastradas"
						description="Perguntas por fase com ordem definida."
						actionLabel="Adicionar novo"
						onAction={() => {
							resetQuestionForm()
							setIsQuestionModalOpen(true)
						}}
						actionDisabled={phases.length === 0}
					/>

					<TableShell>
						<Table>
							<TableHeader className="bg-secondary/55">
								<TableRow className="hover:bg-secondary/55">
									<TableHead>Pergunta</TableHead>
									<TableHead>Fase</TableHead>
									<TableHead>Ordem</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Ações</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orderedQuestions.length === 0 ? (
									<EmptyTableState
										colSpan={5}
										message="Nenhuma pergunta cadastrada."
									/>
								) : (
									orderedQuestions.map((question) => (
										<TableRow key={question.id}>
											<TableCell className="max-w-[520px] whitespace-normal">
												{question.prompt}
											</TableCell>
											<TableCell>
												{phaseNameById.get(question.phaseId) ?? '-'}
											</TableCell>
											<TableCell>{question.orderIndex}</TableCell>
											<TableCell>
												<StatusBadge active={question.isActive} />
											</TableCell>
											<TableCell>
												<div className="flex justify-end gap-2">
													<IconActionButton
														icon={Pencil}
														label="Editar pergunta"
														variant="outline"
														onClick={() => openEditQuestionModal(question.id)}
													/>
												</div>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableShell>
				</div>

				<div className="space-y-4">
					<SectionToolbar
						title="Opções de resposta"
						description="Escala e labels por fase."
						actionLabel="Adicionar novo"
						actionIcon={Save}
						onAction={() => setIsOptionModalOpen(true)}
						actionDisabled={phases.length === 0}
					/>

					<TableShell>
						<Table>
							<TableHeader className="bg-secondary/55">
								<TableRow className="hover:bg-secondary/55">
									<TableHead>Label</TableHead>
									<TableHead>Valor</TableHead>
									<TableHead>Fase</TableHead>
									<TableHead>Ordem</TableHead>
									<TableHead>Status</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{orderedOptions.length === 0 ? (
									<EmptyTableState
										colSpan={5}
										message="Nenhuma opção cadastrada."
									/>
								) : (
									orderedOptions.map((option) => (
										<TableRow key={option.id}>
											<TableCell className="font-medium">
												{option.label}
											</TableCell>
											<TableCell>{option.value}</TableCell>
											<TableCell>
												{phaseNameById.get(option.phaseId) ?? '-'}
											</TableCell>
											<TableCell>{option.orderIndex}</TableCell>
											<TableCell>
												<StatusBadge active={option.isActive} />
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</TableShell>
				</div>
			</div>

			<Dialog
				open={isQuestionModalOpen}
				onOpenChange={(isOpen) => {
					setIsQuestionModalOpen(isOpen)
					if (!isOpen) resetQuestionForm()
				}}
			>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>
							{editingQuestionId ? 'Editar pergunta' : 'Adicionar pergunta'}
						</DialogTitle>
						<DialogDescription>
							Cadastre uma pergunta em uma fase existente.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={questionForm.handleSubmit(async (values) => {
							if (editingQuestionId) {
								await config.updateQuestion.mutateAsync({
									id: editingQuestionId,
									data: {
										phase_id: values.phaseId,
										prompt: values.prompt.trim(),
										order_index: Number(values.orderIndex),
									},
								})
							} else {
								await config.createQuestion.mutateAsync({
									phase_id: values.phaseId,
									prompt: values.prompt.trim(),
									order_index: Number(values.orderIndex),
									is_active: true,
								})
							}
							resetQuestionForm()
							setIsQuestionModalOpen(false)
						})}
					>
						<Controller
							control={questionForm.control}
							name="phaseId"
							rules={{ required: true }}
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									{...(field.value ? { value: field.value } : {})}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione a fase" />
									</SelectTrigger>
									<SelectContent>
										{orderedPhases.map((phase) => (
											<SelectItem key={phase.id} value={phase.id}>
												{phase.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							placeholder="Pergunta"
							{...questionForm.register('prompt', { required: true })}
						/>
						<Input
							type="number"
							placeholder="Ordem da pergunta"
							{...questionForm.register('orderIndex', { valueAsNumber: true })}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={editingQuestionId ? Save : Plus}
								className={primaryCtaClassName}
								disabled={
									config.createQuestion.isPending ||
									config.updateQuestion.isPending
								}
							>
								{editingQuestionId ? 'Salvar alterações' : 'Salvar pergunta'}
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>

			<Dialog open={isOptionModalOpen} onOpenChange={setIsOptionModalOpen}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Adicionar opção de resposta</DialogTitle>
						<DialogDescription>
							Defina label, valor e ordem da opção.
						</DialogDescription>
					</DialogHeader>
					<form
						className="space-y-4"
						onSubmit={optionForm.handleSubmit(async (values) => {
							await config.createOption.mutateAsync({
								phase_id: values.phaseId,
								label: values.label.trim(),
								value: Number(values.value),
								order_index: Number(values.orderIndex),
								is_active: true,
							})
							optionForm.reset({
								phaseId: '',
								label: '',
								value: 1,
								orderIndex: 1,
							})
							setIsOptionModalOpen(false)
						})}
					>
						<Controller
							control={optionForm.control}
							name="phaseId"
							rules={{ required: true }}
							render={({ field }) => (
								<Select
									onValueChange={field.onChange}
									{...(field.value ? { value: field.value } : {})}
								>
									<SelectTrigger className={selectTriggerClassName}>
										<SelectValue placeholder="Selecione a fase" />
									</SelectTrigger>
									<SelectContent>
										{orderedPhases.map((phase) => (
											<SelectItem key={phase.id} value={phase.id}>
												{phase.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						/>
						<Input
							placeholder="Label (ex: Nunca)"
							{...optionForm.register('label', { required: true })}
						/>
						<Input
							type="number"
							placeholder="Valor (ex: 1)"
							{...optionForm.register('value', { valueAsNumber: true })}
						/>
						<Input
							type="number"
							placeholder="Ordem da opção"
							{...optionForm.register('orderIndex', { valueAsNumber: true })}
						/>
						<DialogFooter>
							<AnimatedActionButton
								type="submit"
								icon={Save}
								className={primaryCtaClassName}
								disabled={config.createOption.isPending}
							>
								Salvar opção
							</AnimatedActionButton>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	)
}
