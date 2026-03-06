import { Card, CardContent, CardHeader, CardTitle } from '@cortex/ui/components/card'
import { WifiOff } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
	return (
		<main className="grid min-h-dvh place-items-center p-4">
			<Card className="w-full max-w-lg rounded-3xl border-border/70 bg-card/88 backdrop-blur-lg">
				<CardHeader className="p-6 pb-3 text-center">
					<div className="mx-auto mb-2 inline-flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-secondary/60">
						<WifiOff className="size-5 text-primary" />
					</div>
					<CardTitle className="text-2xl font-(--font-space)">
						Você está offline
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4 p-6 pt-1 text-center">
					<p className="text-sm text-muted-foreground">
						O CORTEX System não conseguiu acessar a internet agora. Assim que a
						conexão voltar, recarregue para continuar.
					</p>
					<Link
						href="/dashboard"
						className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Tentar novamente
					</Link>
				</CardContent>
			</Card>
		</main>
	)
}
