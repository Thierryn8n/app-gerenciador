"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

interface Usuario {
  id: string
  email: string
  nome: string
  empresa?: string
  telefone?: string
  avatar_url?: string
  status: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  usuario: Usuario | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, nome: string, empresa?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Verificar sessão atual
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUsuario(session.user.id)
      } else {
        setUsuario(null)
      }
      setLoading(false)
    })

    // Escutar mudanças de autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        await fetchUsuario(session.user.id)
      } else {
        setUsuario(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [mounted])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signUp = async (email: string, password: string, nome: string, empresa?: string) => {
    try {
      // Primeiro, criar o usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nome,
            empresa,
          },
        },
      })

      if (error) {
        return { error }
      }

      // Se o usuário foi criado com sucesso, inserir dados na tabela usuarios
      if (data.user) {
        const { error: insertError } = await supabase.from("usuarios").insert([
          {
            id: data.user.id,
            nome,
            email,
            empresa: empresa || null,
            status: "ativo",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])

        if (insertError) {
          console.error("Erro ao inserir dados do usuário:", insertError)
          return { error: insertError }
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const fetchUsuario = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", userId)
        .single()
      
      if (error) {
        console.error("Erro ao buscar dados do usuário:", error)
        setUsuario(null)
      } else {
        setUsuario(data)
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error)
      setUsuario(null)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUsuario(null)
  }

  const value = {
    user,
    usuario,
    loading,
    signIn,
    signUp,
    signOut,
  }

  if (!mounted) {
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
