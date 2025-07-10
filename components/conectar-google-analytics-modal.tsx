"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Cliente } from "@/lib/supabase"
import { BarChart3, ExternalLink, CheckCircle, Shield, Zap } from "lucide-react"

interface ConectarGoogleAnalyticsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
}

export function ConectarGoogleAnalyticsModal({ open, onOpenChange, cliente }: ConectarGoogleAnalyticsModalProps) {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  const handleConnectGoogleAnalytics = async () => {
    setLoading(true)

    try {
      // Configurar parâmetros do OAuth do Google Analytics
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID!
      console.log('Google Analytics Client ID:', clientId)
      
      if (!clientId) {
        console.error('NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID não encontrado')
        alert('Erro: Google Analytics Client ID não configurado')
        setLoading(false)
        return
      }
      
      const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/google-analytics/callback`)
      const scope = encodeURIComponent("https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/analytics.manage.users.readonly")
      const state = encodeURIComponent(JSON.stringify({ clienteId: cliente?.id }))

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}&access_type=offline&prompt=consent`

      // Abrir popup para autenticação
      const popup = window.open(authUrl, "google-analytics-auth", "width=600,height=600,scrollbars=yes,resizable=yes")

      // Variáveis para controle do popup
      let popupCheckInterval: NodeJS.Timeout
      let popupCheckTimeout: NodeJS.Timeout
      
      const cleanupPopupCheck = () => {
        if (popupCheckInterval) clearInterval(popupCheckInterval)
        if (popupCheckTimeout) clearTimeout(popupCheckTimeout)
        window.removeEventListener("message", handleMessage)
        setLoading(false)
      }

      // Escutar mensagens do popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== process.env.NEXT_PUBLIC_APP_URL) return

        if (event.data.type === "GOOGLE_ANALYTICS_AUTH_SUCCESS") {
          console.log('Google Analytics authentication successful')
          setConnected(true)
          try {
            popup?.close()
          } catch (error) {
            console.log('Could not close popup due to CORS policy')
          }
          cleanupPopupCheck()
        } else if (event.data.type === "GOOGLE_ANALYTICS_AUTH_ERROR") {
          console.error("Erro na autenticação:", event.data.error)
          try {
            popup?.close()
          } catch (error) {
            console.log('Could not close popup due to CORS policy')
          }
          cleanupPopupCheck()
        }
      }

      window.addEventListener("message", handleMessage)

      // Verificar se o popup foi fechado manualmente
      // Usar uma abordagem mais robusta para detectar fechamento do popup
      
      // Timeout de segurança para limpar após 5 minutos
      popupCheckTimeout = setTimeout(() => {
        console.log('Popup authentication timeout')
        cleanupPopupCheck()
      }, 300000) // 5 minutos
      
      // Verificação periódica mais segura
      popupCheckInterval = setInterval(() => {
        try {
          // Tentar acessar a propriedade closed de forma segura
          if (popup && popup.closed) {
            console.log('Popup was closed manually')
            cleanupPopupCheck()
          }
        } catch (error) {
          // Se não conseguir acessar popup.closed devido ao CORS,
          // continuar verificando até receber uma mensagem ou timeout
          console.log('Popup check blocked by CORS policy, continuing...')
        }
      }, 2000) // Verificar a cada 2 segundos em vez de 1
    } catch (error) {
      console.error("Erro ao conectar com Google Analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-800 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white tracking-wider">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            CONECTAR GOOGLE ANALYTICS
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Conecte a conta do Google Analytics do cliente <strong className="text-orange-500">{cliente?.nome}</strong> para
            acompanhar métricas de website e conversões.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {connected ? (
            <Alert className="bg-green-900/20 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Conta Google Analytics conectada com sucesso! Agora você pode acompanhar as métricas do website do cliente.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  Processo de Conexão:
                </h4>
                <ul className="text-sm text-neutral-300 space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    Você será redirecionado para o Google
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    Faça login na conta Google do cliente
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    Autorize o acesso ao Google Analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    Retorne automaticamente para o dashboard
                  </li>
                </ul>
              </div>

              <Alert className="bg-blue-900/20 border-blue-500/50">
                <Shield className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-400">
                  <strong>Importante:</strong> Certifique-se de que o cliente tenha uma conta do Google Analytics
                  configurada e permissões adequadas para visualização de dados.
                </AlertDescription>
              </Alert>

              <Alert className="bg-yellow-900/20 border-yellow-500/50">
                <BarChart3 className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400">
                  <strong>Métricas disponíveis:</strong> Sessões, usuários, visualizações de página, taxa de conversão,
                  origem do tráfego, dispositivos e muito mais.
                </AlertDescription>
              </Alert>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-neutral-700">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
            >
              {connected ? "Fechar" : "Cancelar"}
            </Button>
            {!connected && (
              <Button
                onClick={handleConnectGoogleAnalytics}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Conectando...
                  </div>
                ) : (
                  <>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Conectar Google Analytics
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}