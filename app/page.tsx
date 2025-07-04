"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ChevronRight, Monitor, Settings, BarChart3, Target, Users, RefreshCw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import DashboardPage from "./dashboard/page"
import ClientesPage from "./clientes/page"
import CampanhasPage from "./campanhas/page"
import RelatoriosPage from "./relatorios/page"
import ConfiguracoesPage from "./configuracoes/page"
import HistoricoPage from "./historico/page"
import { NotificationSystem } from "@/components/notification-system"

export default function GestorTrafego() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-neutral-400">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="flex h-screen bg-neutral-900">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <h1 className="text-orange-500 font-bold text-lg tracking-wider">TRAFFIC MANAGER</h1>
              </div>
              <p className="text-neutral-500 text-xs">v3.2.1 DIGITAL MARKETING</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "dashboard", icon: Monitor, label: "DASHBOARD" },
              { id: "clientes", icon: Users, label: "CLIENTES" },
              { id: "campanhas", icon: Target, label: "CAMPANHAS" },
              { id: "relatorios", icon: BarChart3, label: "RELATÓRIOS" },
              { id: "historico", icon: TrendingUp, label: "HISTÓRICO" },
              { id: "configuracoes", icon: Settings, label: "CONFIGURAÇÕES" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SISTEMA ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>UPTIME: 99.9%</div>
                <div>CLIENTES: 12 ATIVOS</div>
                <div>CAMPANHAS: 47 RODANDO</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              GESTOR DE TRÁFEGO / <span className="text-orange-500">{activeSection.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">ÚLTIMA ATUALIZAÇÃO: {new Date().toLocaleString("pt-BR")}</div>
            <NotificationSystem />
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto bg-neutral-900">
          {activeSection === "dashboard" && <DashboardPage />}
          {activeSection === "clientes" && <ClientesPage />}
          {activeSection === "campanhas" && <CampanhasPage />}
          {activeSection === "relatorios" && <RelatoriosPage />}
          {activeSection === "historico" && <HistoricoPage />}
          {activeSection === "configuracoes" && <ConfiguracoesPage />}
        </div>
      </div>
    </div>
  )
}
