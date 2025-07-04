"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { User, Mail, Building, Phone, FileText } from "lucide-react"

interface AdicionarClienteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onClienteAdicionado: () => void
}

export function AdicionarClienteModal({ open, onOpenChange, onClienteAdicionado }: AdicionarClienteModalProps) {
  const { usuario } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    empresa: "",
    telefone: "",
    status: "ativo",
    observacoes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { error } = await supabase.from("clientes").insert({
        usuario_id: usuario?.id,
        nome: formData.nome,
        email: formData.email,
        empresa: formData.empresa || null,
        telefone: formData.telefone || null,
        status: formData.status,
        observacoes: formData.observacoes || null,
      })

      if (error) throw error

      // Reset form
      setFormData({
        nome: "",
        email: "",
        empresa: "",
        telefone: "",
        status: "ativo",
        observacoes: "",
      })

      onClienteAdicionado()
      onOpenChange(false)
    } catch (error: any) {
      setError(error.message || "Erro ao adicionar cliente")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-neutral-800 border-neutral-700">
        <DialogHeader>
          <DialogTitle className="text-white tracking-wider">ADICIONAR NOVO CLIENTE</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Preencha as informações do cliente para começar a gerenciar suas campanhas de tráfego.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-500/50">
              <AlertDescription className="text-red-400">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome" className="text-neutral-300">
                Nome Completo *
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleChange("nome", e.target.value)}
                  placeholder="Nome do cliente"
                  required
                  className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-300">
                Email *
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="empresa" className="text-neutral-300">
                Empresa
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="empresa"
                  value={formData.empresa}
                  onChange={(e) => handleChange("empresa", e.target.value)}
                  placeholder="Nome da empresa"
                  className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone" className="text-neutral-300">
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => handleChange("telefone", e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-neutral-300">
              Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleChange("status", value)}>
              <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white focus:border-orange-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-neutral-700 border-neutral-600">
                <SelectItem value="ativo" className="text-white hover:bg-neutral-600">
                  Ativo
                </SelectItem>
                <SelectItem value="inativo" className="text-white hover:bg-neutral-600">
                  Inativo
                </SelectItem>
                <SelectItem value="pausado" className="text-white hover:bg-neutral-600">
                  Pausado
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-neutral-300">
              Observações
            </Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-neutral-500" />
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleChange("observacoes", e.target.value)}
                placeholder="Observações sobre o cliente..."
                rows={3}
                className="pl-10 bg-neutral-700 border-neutral-600 text-white placeholder-neutral-500 focus:border-orange-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {loading ? "Adicionando..." : "Adicionar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
