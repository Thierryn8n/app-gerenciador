"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Bell, Save } from "lucide-react"

interface ConfigurarAlertasModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  campanhaId?: string
  clienteId?: string
}

export function ConfigurarAlertasModal({ open, onOpenChange, campanhaId, clienteId }: ConfigurarAlertasModalProps) {
  const { usuario } = useAuth()
  const [loading, setLoading] = useState(false)
  const [alertas, setAlertas] = useState({
    performance_ctr: { ativo: true, limite: 30 },
    orcamento_excedido: { ativo: true, limite: 20 },
    campanha_pausada: { ativo: true },
    baixo_volume: { ativo: false, limite: 50 },
  })

  useEffect(() => {
    if (open && usuario) {
      fetchConfiguracoes()
    }
  }, [open, usuario, campanhaId, clienteId])

  const fetchConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from("configuracoes_alertas")
        .select("*")
        .eq("usuario_id", usuario?.id)
        .eq("campanha_id", campanhaId || null)
        .eq("cliente_id", clienteId || null)

      if (error) throw error

      // Processar configurações existentes
      if (data && data.length > 0) {
        const configMap = data.reduce((acc, config) => {
          acc[config.tipo_alerta] = {
            ativo: config.ativo,
            limite: config.limite_percentual || config.limite_valor || 0,
          }
          return acc
        }, {})

        setAlertas((prev) => ({ ...prev, ...configMap }))
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error)
    }
  }

  const salvarConfiguracoes = async () => {
    setLoading(true)
    try {
      // Deletar configurações existentes
      await supabase
        .from("configuracoes_alertas")
        .delete()
        .eq("usuario_id", usuario?.id)
        .eq("campanha_id", campanhaId || null)
        .eq("cliente_id", clienteId || null)

      // Inserir novas configurações
      const configsParaSalvar = Object.entries(alertas).map(([tipo, config]) => ({
        usuario_id: usuario?.id,
        campanha_id: campanhaId || null,
        cliente_id: clienteId || null,
        tipo_alerta: tipo,
        ativo: config.ativo,
        limite_percentual: tipo.includes("percentual") || tipo === "performance_ctr" ? config.limite : null,
        limite_valor: tipo.includes("valor") || tipo === "orcamento_excedido" ? config.limite : null,
      }))

      const { error } = await supabase.from("configuracoes_alertas").insert(configsParaSalvar)

      if (error) throw error

      onOpenChange(false)
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateAlerta = (tipo: string, campo: string, valor: any) => {
    setAlertas((prev) => ({
      ...prev,
      [tipo]: {
        ...prev[tipo],
        [campo]: valor,
      },
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-800 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white tracking-wider">
            <Bell className="w-5 h-5 text-orange-500" />
            CONFIGURAR ALERTAS
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Configure quando você deseja receber notificações sobre suas campanhas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Alerta de Performance CTR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Queda de Performance (CTR)</h4>
                <p className="text-xs text-neutral-400">Alerta quando CTR cair mais que o limite</p>
              </div>
              <Switch
                checked={alertas.performance_ctr.ativo}
                onCheckedChange={(checked) => updateAlerta("performance_ctr", "ativo", checked)}
              />
            </div>
            {alertas.performance_ctr.ativo && (
              <div className="ml-4">
                <Label htmlFor="ctr-limite" className="text-neutral-300">
                  Limite de queda (%)
                </Label>
                <Input
                  id="ctr-limite"
                  type="number"
                  value={alertas.performance_ctr.limite}
                  onChange={(e) => updateAlerta("performance_ctr", "limite", Number.parseInt(e.target.value))}
                  className="bg-neutral-700 border-neutral-600 text-white"
                  min="1"
                  max="100"
                />
              </div>
            )}
          </div>

          {/* Alerta de Orçamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Orçamento Excedido</h4>
                <p className="text-xs text-neutral-400">Alerta quando gasto exceder o limite</p>
              </div>
              <Switch
                checked={alertas.orcamento_excedido.ativo}
                onCheckedChange={(checked) => updateAlerta("orcamento_excedido", "ativo", checked)}
              />
            </div>
            {alertas.orcamento_excedido.ativo && (
              <div className="ml-4">
                <Label htmlFor="orcamento-limite" className="text-neutral-300">
                  Limite de excesso (%)
                </Label>
                <Input
                  id="orcamento-limite"
                  type="number"
                  value={alertas.orcamento_excedido.limite}
                  onChange={(e) => updateAlerta("orcamento_excedido", "limite", Number.parseInt(e.target.value))}
                  className="bg-neutral-700 border-neutral-600 text-white"
                  min="1"
                  max="100"
                />
              </div>
            )}
          </div>

          {/* Alerta de Status */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Mudança de Status</h4>
                <p className="text-xs text-neutral-400">Alerta quando campanha for pausada/ativada</p>
              </div>
              <Switch
                checked={alertas.campanha_pausada.ativo}
                onCheckedChange={(checked) => updateAlerta("campanha_pausada", "ativo", checked)}
              />
            </div>
          </div>

          {/* Alerta de Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-white">Baixo Volume</h4>
                <p className="text-xs text-neutral-400">Alerta quando impressões caírem muito</p>
              </div>
              <Switch
                checked={alertas.baixo_volume.ativo}
                onCheckedChange={(checked) => updateAlerta("baixo_volume", "ativo", checked)}
              />
            </div>
            {alertas.baixo_volume.ativo && (
              <div className="ml-4">
                <Label htmlFor="volume-limite" className="text-neutral-300">
                  Limite de queda (%)
                </Label>
                <Input
                  id="volume-limite"
                  type="number"
                  value={alertas.baixo_volume.limite}
                  onChange={(e) => updateAlerta("baixo_volume", "limite", Number.parseInt(e.target.value))}
                  className="bg-neutral-700 border-neutral-600 text-white"
                  min="1"
                  max="100"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-neutral-700">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={salvarConfiguracoes}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
