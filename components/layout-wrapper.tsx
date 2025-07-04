"use client"

import type React from "react"

import { useAuth } from "@/contexts/auth-context"
import { Navigation } from "./navigation"

interface LayoutWrapperProps {
  children: React.ReactNode
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const { usuario } = useAuth()

  if (!usuario) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />
      <main className="lg:ml-64 min-h-screen">{children}</main>
    </div>
  )
}
