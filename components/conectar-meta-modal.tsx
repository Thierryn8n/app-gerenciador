"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Cliente } from "@/lib/supabase"
import { Facebook, ExternalLink, CheckCircle, Shield, Zap } from "lucide-react"

interface ConectarMetaModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
}

export function ConectarMetaModal({ open, onOpenChange, cliente }: ConectarMetaModalProps) {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  const handleConnectMeta = async () => {
    setLoading(true)

    try {
      // Configurar parâmetros do OAuth do Facebook
      const clientId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID!
      console.log('Facebook App ID:', clientId)
      
      if (!clientId) {
        console.error('NEXT_PUBLIC_FACEBOOK_APP_ID não encontrado')
        alert('Erro: Facebook App ID não configurado')
        setLoading(false)
        return
      }
      
      const redirectUri = encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`)
      const scope = encodeURIComponent("ads_management,ads_read,business_management")
      const state = encodeURIComponent(JSON.stringify({ clienteId: cliente?.id }))

      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`

      // Abrir popup para autenticação
      const popup = window.open(authUrl, "facebook-auth", "width=600,height=600,scrollbars=yes,resizable=yes")

      // Escutar mensagens do popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== process.env.NEXT_PUBLIC_APP_URL) return

        if (event.data.type === "FACEBOOK_AUTH_SUCCESS") {
          setConnected(true)
          popup?.close()
          window.removeEventListener("message", handleMessage)
        } else if (event.data.type === "FACEBOOK_AUTH_ERROR") {
          console.error("Erro na autenticação:", event.data.error)
          popup?.close()
          window.removeEventListener("message", handleMessage)
        }
      }

      window.addEventListener("message", handleMessage)

      // Verificar se o popup foi fechado manualmente
      const checkClosed = setInterval(() => {
        try {
          if (popup?.closed) {
            clearInterval(checkClosed)
            window.removeEventListener("message", handleMessage)
            setLoading(false)
          }
        } catch (error) {
          // Ignorar erros de Cross-Origin-Opener-Policy
          console.log('Popup check blocked by CORS policy')
        }
      }, 1000)
    } catch (error) {
      console.error("Erro ao conectar com Meta:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-800 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white tracking-wider">
            <Facebook className="w-5 h-5 text-blue-500" />
            CONECTAR META ADS
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            Conecte a conta do Meta Ads do cliente <strong className="text-orange-500">{cliente?.nome}</strong> para
            gerenciar campanhas de tráfego.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {connected ? (
            <Alert className="bg-green-900/20 border-green-500/50">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-400">
                Conta Meta Ads conectada com sucesso! Agora você pode gerenciar as campanhas do cliente.
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
                    Você será redirecionado para o Facebook
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    Faça login na conta do Meta Business do cliente
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2"></div>
                    Autorize o acesso às contas de anúncios
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
                  <strong>Importante:</strong> Certifique-se de que o cliente tenha uma conta do Meta Business Manager
                  configurada e permissões adequadas.
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
                onClick={handleConnectMeta}
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
                    <Facebook className="w-4 h-4 mr-2" />
                    Conectar Meta Ads
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
