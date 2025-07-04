"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { BarChart3, Users, FileText, Settings, LogOut, Target, History, Zap } from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Campanhas", href: "/campanhas", icon: Target },
  { name: "Relatórios", href: "/relatorios", icon: FileText },
  { name: "Histórico", href: "/historico", icon: History },
  { name: "Sistema", href: "/sistema", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { usuario, signOut } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!usuario) return null

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <Zap className="w-8 h-8 text-orange-500" />
          <span className="text-xl font-bold text-white tracking-wider">TACTICAL</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? "bg-orange-500 text-white" : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-neutral-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <span className="text-sm font-bold text-white">{usuario.nome?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{usuario.nome}</p>
            <p className="text-xs text-neutral-400 truncate">{usuario.email}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 hover:text-white rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </div>
  )
}
