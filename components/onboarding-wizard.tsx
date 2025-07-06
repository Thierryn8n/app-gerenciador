"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { CheckCircle, Users, Target, BarChart3, ArrowRight, Sparkles } from "lucide-react"

interface OnboardingWizardProps {
  onComplete: () => void
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { usuario } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [clienteData, setClienteData] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: ""
  })

  const steps = [
    {
      id: 1,
      title: "Bem-vindo ao Traffic Manager!",
      description: "Vamos configurar sua conta em poucos passos",
      icon: Sparkles
    },
    {
      id: 2,
      title: "Adicione seu primeiro cliente",
      description: "Comece criando um cliente para gerenciar suas campanhas",
      icon: Users
    },
    {
      id: 3,
      title: "Configuração concluída!",
      description: "Agora você pode começar a usar o sistema",
      icon: CheckCircle
    }
  ]

  const handleCreateCliente = async () => {
    if (!usuario || !clienteData.nome || !clienteData.email) return

    setLoading(true)
    try {
      const { error } = await supabase.from("clientes").insert([
        {
          usuario_id: usuario.id,
          nome: clienteData.nome,
          email: clienteData.email,
          empresa: clienteData.empresa || null,
          telefone: clienteData.telefone || null,
          status: "ativo"
        }
      ])

      if (error) {
        console.error("Erro ao criar cliente:", error)
        return
      }

      // Onboarding concluído (cliente criado com sucesso)
      console.log("Cliente criado com sucesso - onboarding concluído")

      setCurrentStep(3)
    } catch (error) {
      console.error("Erro ao criar cliente:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo ao Traffic Manager!</h2>
              <p className="text-neutral-400 mb-6">
                Olá {usuario?.nome}! Vamos configurar sua conta para que você possa começar a gerenciar suas campanhas de tráfego digital.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-4">
                  <Users className="w-8 h-8 text-orange-500 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Gerenciar Clientes</h3>
                  <p className="text-sm text-neutral-400">Organize e acompanhe todos os seus clientes</p>
                </CardContent>
              </Card>
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-4">
                  <Target className="w-8 h-8 text-orange-500 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Campanhas</h3>
                  <p className="text-sm text-neutral-400">Monitore o desempenho das suas campanhas</p>
                </CardContent>
              </Card>
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-4">
                  <BarChart3 className="w-8 h-8 text-orange-500 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Relatórios</h3>
                  <p className="text-sm text-neutral-400">Análises detalhadas e insights</p>
                </CardContent>
              </Card>
            </div>
            <Button 
              onClick={() => setCurrentStep(2)}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Começar configuração
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Adicione seu primeiro cliente</h2>
              <p className="text-neutral-400">
                Para começar a usar o sistema, vamos criar seu primeiro cliente.
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4">
              <div>
                <Label htmlFor="nome" className="text-neutral-300">Nome do Cliente *</Label>
                <Input
                  id="nome"
                  value={clienteData.nome}
                  onChange={(e) => setClienteData({ ...clienteData, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-neutral-300">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={clienteData.email}
                  onChange={(e) => setClienteData({ ...clienteData, email: e.target.value })}
                  placeholder="joao@empresa.com"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="empresa" className="text-neutral-300">Empresa</Label>
                <Input
                  id="empresa"
                  value={clienteData.empresa}
                  onChange={(e) => setClienteData({ ...clienteData, empresa: e.target.value })}
                  placeholder="Nome da empresa"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="telefone" className="text-neutral-300">Telefone</Label>
                <Input
                  id="telefone"
                  value={clienteData.telefone}
                  onChange={(e) => setClienteData({ ...clienteData, telefone: e.target.value })}
                  placeholder="(11) 99999-9999"
                  className="bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-center gap-3">
              <Button 
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
              >
                Voltar
              </Button>
              <Button 
                onClick={handleCreateCliente}
                disabled={!clienteData.nome || !clienteData.email || loading}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {loading ? "Criando..." : "Criar Cliente"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Configuração concluída!</h2>
              <p className="text-neutral-400 mb-6">
                Perfeito! Sua conta está configurada e você já criou seu primeiro cliente. Agora você pode:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-4">
                  <Target className="w-6 h-6 text-orange-500 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Conectar contas Meta</h3>
                  <p className="text-sm text-neutral-400">Integre suas contas do Facebook e Instagram</p>
                </CardContent>
              </Card>
              <Card className="bg-neutral-800 border-neutral-700">
                <CardContent className="p-4">
                  <BarChart3 className="w-6 h-6 text-orange-500 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Monitorar campanhas</h3>
                  <p className="text-sm text-neutral-400">Acompanhe o desempenho em tempo real</p>
                </CardContent>
              </Card>
            </div>
            
            <Button 
              onClick={onComplete}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Ir para o Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-neutral-400">Passo {currentStep} de {steps.length}</span>
            <span className="text-sm text-neutral-400">{Math.round((currentStep / steps.length) * 100)}%</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Steps Indicator */}
        <div className="flex justify-center mt-6 space-x-4">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentStep >= step.id 
                    ? "bg-orange-500 text-white" 
                    : "bg-neutral-700 text-neutral-400"
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                {step.id < steps.length && (
                  <div className={`w-8 h-0.5 ml-2 ${
                    currentStep > step.id ? "bg-orange-500" : "bg-neutral-700"
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}