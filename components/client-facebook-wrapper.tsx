"use client"

import { useEffect } from 'react'

declare global {
  interface Window {
    FB: any
    fbAsyncInit: () => void
  }
}

export function ClientFacebookWrapper() {
  useEffect(() => {
    // Configurar o Facebook SDK
    window.fbAsyncInit = function() {
      if (window.FB) {
        window.FB.init({
          appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || '1405602787157576',
          cookie: true,
          xfbml: true,
          version: 'v18.0'
        })
        
        // Log de visualização de página para App Events
        window.FB.AppEvents.logPageView()
      }
    }

    // Carregar o SDK do Facebook de forma assíncrona
    const loadFacebookSDK = () => {
      if (typeof window !== 'undefined' && !document.getElementById('facebook-jssdk')) {
        const script = document.createElement('script')
        script.id = 'facebook-jssdk'
        script.src = 'https://connect.facebook.net/pt_BR/sdk.js'
        script.async = true
        script.defer = true
        
        const firstScript = document.getElementsByTagName('script')[0]
        if (firstScript && firstScript.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript)
        }
      }
    }

    // Verificar se estamos no cliente antes de carregar
    if (typeof window !== 'undefined') {
      loadFacebookSDK()
    }
  }, [])

  return null // Este componente não renderiza nada visualmente
}