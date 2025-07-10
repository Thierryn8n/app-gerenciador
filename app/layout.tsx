import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { ClientFacebookWrapper } from "@/components/client-facebook-wrapper"
import { LayoutWrapper } from "@/components/layout-wrapper"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Traffic Manager - Gestor de Tráfego",
  description: "Sistema completo de gestão de tráfego digital e campanhas de anúncios",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-neutral-900 text-white`}>
        <ClientFacebookWrapper />
        <AuthProvider>
          <LayoutWrapper>{children}</LayoutWrapper>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
