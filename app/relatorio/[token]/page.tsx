import { Suspense } from "react"
import RelatorioPublicoView from "@/components/relatorio-publico-view"

interface PageProps {
  params: {
    token: string
  }
}

export default function RelatorioPublicoPage({ params }: PageProps) {
  return (
    <div className="min-h-screen bg-black">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-cyan-400"></div>
          </div>
        }
      >
        <RelatorioPublicoView token={params.token} />
      </Suspense>
    </div>
  )
}
