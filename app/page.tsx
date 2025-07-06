"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Monitor, Settings, BarChart3, Target, Users, RefreshCw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { OnboardingWizard } from "@/components/onboarding-wizard"
import DashboardPage from "./dashboard/page"
import ClientesPage from "./clientes/page"
import CampanhasPage from "./campanhas/page"
import RelatoriosPage from "./relatorios/page"
import ConfiguracoesPage from "./configuracoes/page"
import HistoricoPage from "./historico/page"
import { NotificationSystem } from "@/components/notification-system"

export default function GestorTrafego() {
  const { user, usuario, loading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    } else if (usuario && !loading) {
      checkOnboardingStatus()
    } else if (!loading && user && usuario && !showOnboarding && !checkingOnboarding) {
      router.push("/dashboard")
    }
  }, [user, usuario, loading, router, showOnboarding, checkingOnboarding])

  const checkOnboardingStatus = async () => {
    console.log('🔍 Verificando onboarding na página principal para usuário:', usuario?.id)
    try {
      const { data: clientes, error } = await supabase
        .from("clientes")
        .select("id")
        .eq("usuario_id", usuario?.id)
        .limit(1)
      
      console.log('📊 Resultado da consulta:', { clientes, error })
      
      if (error) {
        console.error("❌ Erro ao verificar clientes:", error)
      } else if (!clientes || clientes.length === 0) {
        console.log("🎯 Usuário sem clientes - MOSTRANDO ONBOARDING")
        setShowOnboarding(true)
      } else {
        console.log("✅ Usuário já tem clientes")
        setShowOnboarding(false)
        // Redirecionar para dashboard se não precisar do onboarding
        router.push("/dashboard")
      }
    } catch (error) {
      console.error("❌ Erro ao verificar onboarding:", error)
    } finally {
      setCheckingOnboarding(false)
    }
  }

  const handleOnboardingComplete = () => {
    setShowOnboarding(false)
    setActiveSection("dashboard")
  }

  if (loading || checkingOnboarding) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (showOnboarding) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />
  }

  if (!user) {
    return null
  }

  // Lógica de redirecionamento consolidada no useEffect principal

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-neutral-400">Redirecionando...</p>
      </div>
    </div>
  )
}
