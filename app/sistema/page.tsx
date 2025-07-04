"use client"

import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfiguracaoSync } from "@/components/configuracao-sync"
import { GestaoFinanceira } from "@/components/gestao-financeira"
import { DollarSign, RefreshCw, Settings } from "lucide-react"

export default function SistemaPage() {
  const { usuario } = useAuth()

  if (!usuario) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-neutral-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-wider mb-2 flex items-center gap-3">
            <Settings className="w-8 h-8 text-orange-500" />
            SISTEMA
          </h1>
          <p className="text-neutral-400">Configurações avançadas e gestão do sistema</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="sincronizacao" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-neutral-800 border-neutral-700">
            <TabsTrigger
              value="sincronizacao"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <RefreshCw className="w-4 h-4" />
              Sincronização
            </TabsTrigger>
            <TabsTrigger
              value="financeiro"
              className="flex items-center gap-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white"
            >
              <DollarSign className="w-4 h-4" />
              Financeiro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sincronizacao" className="space-y-6">
            <ConfiguracaoSync />
          </TabsContent>

          <TabsContent value="financeiro" className="space-y-6">
            <GestaoFinanceira />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
