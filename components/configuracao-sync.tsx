"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { SyncService } from "@/lib/sync-service"
import { RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Settings, Play, Calendar, Activity } from "lucide-react"

interface ConfigSync {
  id: string
  ativo: boolean
  horario_sync: string
  intervalo_horas: number
  auto_sync_ativo: boolean
  ultima_execucao?: string
  proxima_execucao?: string
}

interface LogSync {
  id: string
  status: string
  tipo_sync: string
  campanhas_sincronizadas: number
  metricas_sincronizadas: number
  tempo_execucao_ms: number
  mensagem_erro?: string
  created_at: string
}

export function ConfiguracaoSync() {
  const { usuario } = useAuth()
  const [config, setConfig] = useState<ConfigSync | null>(null)
  const [logs, setLogs] = useState<LogSync[]>([])
  const [loading, setLoading] = useState(true)
  const [syncInProgress, setSyncInProgress] = useState(false)
  const [horarioSync, setHorarioSync] = useState("07:00")
  const [autoSyncAtivo, setAutoSyncAtivo] = useState(true)

  useEffect(() => {
    if (usuario) {
      fetchConfiguracao()
      fetchLogs()
    }
  }, [usuario])

  const fetchConfiguracao = async () => {
    try {
      const { data, error } = await supabase
        .from("configuracoes_sync")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .single()

      if (error && error.code !== "PGRST116") {
        throw error
      }

      if (data) {
        setConfig(data)
        setHorarioSync(data.horario_sync.substring(0, 5))
        setAutoSyncAtivo(data.auto_sync_ativo)
      } else {
        // Criar configuração padrão
        await criarConfiguracaoPadrao()
      }
    } catch (error) {
      console.error("Erro ao buscar configuração:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from("logs_sincronizacao")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .order("created_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setLogs(data || [])
    } catch (error) {
      console.error("Erro ao buscar logs:", error)
    }
  }

  const criarConfiguracaoPadrao = async () => {
    try {
      const { data, error } = await supabase
        .from("configuracoes_sync")
        .insert({
          usuario_id: usuario?.id,
          ativo: true,
          horario_sync: "07:00:00",
          intervalo_horas: 24,
          auto_sync_ativo: true,
        })
        .select()
        .single()

      if (error) throw error
      setConfig(data)
    } catch (error) {
      console.error("Erro ao criar configuração padrão:", error)
    }
  }

  const salvarConfiguracao = async () => {
    if (!config) return

    try {
      const { error } = await supabase
        .from("configuracoes_sync")
        .update({
          horario_sync: `${horarioSync}:00`,
          auto_sync_ativo: autoSyncAtivo,
        })
        .eq("id", config.id)

      if (error) throw error

      await fetchConfiguracao()
      alert("Configuração salva com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      alert("Erro ao salvar configuração")
    }
  }

  const executarSincronizacaoManual = async () => {
    if (!usuario?.id) return

    setSyncInProgress(true)
    try {
      const resultado = await SyncService.executarSincronizacaoAutomatica(usuario.id)

      if (resultado.success) {
        alert(
          `Sincronização concluída!\n${resultado.campanhasSincronizadas} campanhas e ${resultado.metricasSincronizadas} métricas sincronizadas.`,
        )
      } else {
        alert(`Erro na sincronização: ${resultado.erro}`)
      }

      await fetchLogs()
      await fetchConfiguracao()
    } catch (error) {
      console.error("Erro na sincronização manual:", error)
      alert("Erro ao executar sincronização")
    } finally {
      setSyncInProgress(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sucesso":
        return "bg-green-500/20 text-green-400"
      case "erro":
        return "bg-red-500/20 text-red-400"
      case "em_andamento":
        return "bg-yellow-500/20 text-yellow-400"
      default:
        return "bg-neutral-500/20 text-neutral-400"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sucesso":
        return <CheckCircle className="w-4 h-4" />
      case "erro":
        return <XCircle className="w-4 h-4" />
      case "em_andamento":
        return <RefreshCw className="w-4 h-4 animate-spin" />
      default:
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-48 bg-neutral-800 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Sincronização */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Settings className="w-5 h-5 text-orange-500" />
            CONFIGURAÇÕES DE SINCRONIZAÇÃO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="horario" className="text-neutral-300">
                  Horário de Sincronização Automática
                </Label>
                <Input
                  id="horario"
                  type="time"
                  value={horarioSync}
                  onChange={(e) => setHorarioSync(e.target.value)}
                  className="bg-neutral-700 border-neutral-600 text-white focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-neutral-300">Sincronização Automática</Label>
                  <p className="text-xs text-neutral-500">Executar sincronização diariamente</p>
                </div>
                <Switch checked={autoSyncAtivo} onCheckedChange={setAutoSyncAtivo} />
              </div>
            </div>

            <div className="space-y-4">
              {config && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-300">
                      Última Sincronização:{" "}
                      {config.ultima_execucao ? new Date(config.ultima_execucao).toLocaleString("pt-BR") : "Nunca"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-sm text-neutral-300">
                      Próxima Sincronização:{" "}
                      {config.proxima_execucao
                        ? new Date(config.proxima_execucao).toLocaleString("pt-BR")
                        : "Não agendada"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={salvarConfiguracao} className="bg-orange-500 hover:bg-orange-600">
              <Settings className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>

            <Button
              onClick={executarSincronizacaoManual}
              disabled={syncInProgress}
              variant="outline"
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
            >
              {syncInProgress ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              {syncInProgress ? "Sincronizando..." : "Sincronizar Agora"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status da Última Sincronização */}
      {logs.length > 0 && (
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-orange-500" />
              STATUS DA SINCRONIZAÇÃO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.slice(0, 1).map((log) => (
                <Alert
                  key={log.id}
                  className={`${
                    log.status === "sucesso"
                      ? "bg-green-900/20 border-green-500/50"
                      : log.status === "erro"
                        ? "bg-red-900/20 border-red-500/50"
                        : "bg-yellow-900/20 border-yellow-500/50"
                  }`}
                >
                  {getStatusIcon(log.status)}
                  <AlertDescription
                    className={`${
                      log.status === "sucesso"
                        ? "text-green-400"
                        : log.status === "erro"
                          ? "text-red-400"
                          : "text-yellow-400"
                    }`}
                  >
                    <div className="space-y-1">
                      <p>
                        <strong>Última sincronização:</strong> {new Date(log.created_at).toLocaleString("pt-BR")}
                      </p>
                      {log.status === "sucesso" && (
                        <p>
                          {log.campanhas_sincronizadas} campanhas e {log.metricas_sincronizadas} métricas sincronizadas
                          em {(log.tempo_execucao_ms / 1000).toFixed(1)}s
                        </p>
                      )}
                      {log.status === "erro" && log.mensagem_erro && (
                        <p>
                          <strong>Erro:</strong> {log.mensagem_erro}
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de Sincronizações */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <RefreshCw className="w-5 h-5 text-orange-500" />
            HISTÓRICO DE SINCRONIZAÇÕES
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.length === 0 ? (
              <p className="text-neutral-400 text-center py-4">Nenhuma sincronização realizada ainda</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-neutral-900 rounded border-l-2 border-orange-500"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(log.status)}>{log.status.toUpperCase()}</Badge>
                    <div>
                      <p className="text-sm text-white">{new Date(log.created_at).toLocaleString("pt-BR")}</p>
                      <p className="text-xs text-neutral-400">
                        Tipo: {log.tipo_sync} • {log.campanhas_sincronizadas} campanhas • {log.metricas_sincronizadas}{" "}
                        métricas
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">{(log.tempo_execucao_ms / 1000).toFixed(1)}s</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
