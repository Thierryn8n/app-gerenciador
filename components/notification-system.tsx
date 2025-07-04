"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Bell, X, AlertTriangle, Info, CheckCircle, XCircle, Settings } from "lucide-react"

interface Notificacao {
  id: string
  tipo: string
  titulo: string
  mensagem: string
  severidade: "info" | "warning" | "error" | "success"
  lida: boolean
  created_at: string
  dados_contexto?: any
}

export function NotificationSystem() {
  const { usuario } = useAuth()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (usuario) {
      fetchNotificacoes()
      // Verificar notificações a cada 30 segundos
      const interval = setInterval(fetchNotificacoes, 30000)
      return () => clearInterval(interval)
    }
  }, [usuario])

  const fetchNotificacoes = async () => {
    try {
      const { data, error } = await supabase
        .from("notificacoes")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .eq("ativa", true)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setNotificacoes(data || [])
    } catch (error) {
      console.error("Erro ao buscar notificações:", error)
    }
  }

  const marcarComoLida = async (id: string) => {
    try {
      const { error } = await supabase.from("notificacoes").update({ lida: true }).eq("id", id)

      if (error) throw error

      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error)
    }
  }

  const removerNotificacao = async (id: string) => {
    try {
      const { error } = await supabase.from("notificacoes").update({ ativa: false }).eq("id", id)

      if (error) throw error

      setNotificacoes((prev) => prev.filter((n) => n.id !== id))
    } catch (error) {
      console.error("Erro ao remover notificação:", error)
    }
  }

  const getSeverityIcon = (severidade: string) => {
    switch (severidade) {
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-400" />
      default:
        return <Info className="w-4 h-4 text-blue-400" />
    }
  }

  const getSeverityColor = (severidade: string) => {
    switch (severidade) {
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
    }
  }

  const notificacaoNaoLidas = notificacoes.filter((n) => !n.lida).length

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowNotifications(!showNotifications)}
        className="text-neutral-400 hover:text-orange-500 relative"
      >
        <Bell className="w-4 h-4" />
        {notificacaoNaoLidas > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notificacaoNaoLidas > 9 ? "9+" : notificacaoNaoLidas}
          </span>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-96 max-h-96 overflow-y-auto bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-neutral-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Notificações</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowNotifications(false)}
                className="text-neutral-400 hover:text-white h-6 w-6"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="p-4 text-center text-neutral-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map((notificacao) => (
                <div
                  key={notificacao.id}
                  className={`p-4 border-b border-neutral-700 hover:bg-neutral-700 transition-colors ${
                    !notificacao.lida ? "bg-neutral-750" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(notificacao.severidade)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-white truncate">{notificacao.titulo}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removerNotificacao(notificacao.id)}
                          className="text-neutral-400 hover:text-red-400 h-6 w-6 flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">{notificacao.mensagem}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={getSeverityColor(notificacao.severidade)}>{notificacao.tipo}</Badge>
                        <span className="text-xs text-neutral-500">
                          {new Date(notificacao.created_at).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      {!notificacao.lida && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => marcarComoLida(notificacao.id)}
                          className="text-xs text-orange-500 hover:text-orange-400 p-0 h-auto mt-1"
                        >
                          Marcar como lida
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notificacoes.length > 0 && (
            <div className="p-4 border-t border-neutral-700">
              <Button
                variant="outline"
                size="sm"
                className="w-full border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurar Alertas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
