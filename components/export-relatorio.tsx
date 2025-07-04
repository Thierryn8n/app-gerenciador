"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { FileText, Table, Download, Eye, Settings } from "lucide-react"

interface ExportRelatorioProps {
  tipo: "cliente" | "campanha"
  dados: any
  metricas: any
  titulo: string
}

export function ExportRelatorio({ tipo, dados, metricas, titulo }: ExportRelatorioProps) {
  const { usuario } = useAuth()
  const [formato, setFormato] = useState<"pdf" | "csv">("pdf")
  const [incluirGraficos, setIncluirGraficos] = useState(true)
  const [incluirDetalhes, setIncluirDetalhes] = useState(true)
  const [observacoes, setObservacoes] = useState("")
  const [exportando, setExportando] = useState(false)
  const [preview, setPreview] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat("pt-BR").format(value)
  }

  const gerarCSV = () => {
    let csvContent = ""

    // Cabeçalho do relatório
    csvContent += "TACTICAL COMMAND - RELATÓRIO DE " + tipo.toUpperCase() + "\n"
    csvContent += "Gerado em: " + new Date().toLocaleString("pt-BR") + "\n"
    csvContent += "Gestor: " + (usuario?.nome || "N/A") + "\n"
    csvContent += "Título: " + titulo + "\n\n"

    if (tipo === "cliente") {
      csvContent += "INFORMAÇÕES DO CLIENTE\n"
      csvContent += "Nome," + dados.nome + "\n"
      csvContent += "Email," + dados.email + "\n"
      csvContent += "Empresa," + (dados.empresa || "N/A") + "\n"
      csvContent += "Status," + dados.status + "\n\n"

      csvContent += "MÉTRICAS CONSOLIDADAS\n"
      csvContent += "Métrica,Valor\n"
      csvContent += "Total Gasto," + formatCurrency(metricas.totalGasto) + "\n"
      csvContent += "Total Cliques," + formatNumber(metricas.totalCliques) + "\n"
      csvContent += "Total Impressões," + formatNumber(metricas.totalImpressoes) + "\n"
      csvContent += "Total Conversões," + formatNumber(metricas.totalConversoes) + "\n"
      csvContent += "CPM," + formatCurrency(metricas.cpm) + "\n"
      csvContent += "CPC," + formatCurrency(metricas.cpc) + "\n"
      csvContent += "CTR," + metricas.ctr.toFixed(2) + "%\n\n"

      if (metricas.campanhas && metricas.campanhas.length > 0) {
        csvContent += "CAMPANHAS DETALHADAS\n"
        csvContent += "Nome,Status,Objetivo,Gasto,Cliques,Impressões,CTR,CPC\n"
        metricas.campanhas.forEach((campanha: any) => {
          csvContent += `"${campanha.nome}",${campanha.status},"${campanha.objetivo || "N/A"}",${campanha.valor_gasto},${campanha.cliques},${campanha.impressoes},${campanha.ctr.toFixed(2)}%,${campanha.cliques > 0 ? (campanha.valor_gasto / campanha.cliques).toFixed(2) : "0"}\n`
        })
      }
    } else {
      csvContent += "INFORMAÇÕES DA CAMPANHA\n"
      csvContent += "Nome," + dados.nome + "\n"
      csvContent += "Status," + dados.status + "\n"
      csvContent += "Objetivo," + (dados.objetivo || "N/A") + "\n"
      csvContent +=
        "Data Início," + (dados.data_inicio ? new Date(dados.data_inicio).toLocaleDateString("pt-BR") : "N/A") + "\n"
      csvContent += "Cliente," + dados.cliente_nome + "\n\n"

      csvContent += "MÉTRICAS DA CAMPANHA\n"
      csvContent += "Métrica,Valor\n"
      csvContent += "Gasto Total," + formatCurrency(metricas.totalGasto) + "\n"
      csvContent += "Impressões," + formatNumber(metricas.totalImpressoes) + "\n"
      csvContent += "Cliques," + formatNumber(metricas.totalCliques) + "\n"
      csvContent += "CTR," + metricas.ctr.toFixed(2) + "%\n"
      csvContent += "CPC," + formatCurrency(metricas.cpc) + "\n"
      csvContent += "CPM," + formatCurrency(metricas.cpm) + "\n\n"

      if (dados.metricas_diarias && dados.metricas_diarias.length > 0) {
        csvContent += "MÉTRICAS DIÁRIAS\n"
        csvContent += "Data,Gasto,Impressões,Cliques,Leads,CTR,CPC,CPM\n"
        dados.metricas_diarias.forEach((metrica: any) => {
          csvContent += `${new Date(metrica.data).toLocaleDateString("pt-BR")},${metrica.gasto_dia.toFixed(2)},${metrica.impressoes_dia},${metrica.cliques_dia},${metrica.leads_dia},${metrica.ctr_dia.toFixed(2)}%,${metrica.cpc_dia.toFixed(2)},${metrica.cpm_dia.toFixed(2)}\n`
        })
      }
    }

    if (observacoes.trim()) {
      csvContent += "\nOBSERVAÇÕES\n"
      csvContent += observacoes.replace(/\n/g, " ") + "\n"
    }

    return csvContent
  }

  const gerarPDF = async () => {
    // Importar jsPDF dinamicamente
    const { jsPDF } = await import("jspdf")

    const doc = new jsPDF()
    let yPosition = 20

    // Configurar fonte
    doc.setFont("helvetica")

    // Cabeçalho
    doc.setFontSize(20)
    doc.setTextColor(249, 115, 22) // Orange
    doc.text("TACTICAL COMMAND", 20, yPosition)

    yPosition += 10
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(`RELATÓRIO DE ${tipo.toUpperCase()}`, 20, yPosition)

    yPosition += 15
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 20, yPosition)
    doc.text(`Gestor: ${usuario?.nome || "N/A"}`, 120, yPosition)

    yPosition += 10
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`${titulo}`, 20, yPosition)

    yPosition += 20

    if (tipo === "cliente") {
      // Informações do Cliente
      doc.setFontSize(12)
      doc.setTextColor(249, 115, 22)
      doc.text("INFORMAÇÕES DO CLIENTE", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Nome: ${dados.nome}`, 20, yPosition)
      yPosition += 6
      doc.text(`Email: ${dados.email}`, 20, yPosition)
      yPosition += 6
      doc.text(`Empresa: ${dados.empresa || "N/A"}`, 20, yPosition)
      yPosition += 6
      doc.text(`Status: ${dados.status}`, 20, yPosition)
      yPosition += 15

      // Métricas Consolidadas
      doc.setFontSize(12)
      doc.setTextColor(249, 115, 22)
      doc.text("MÉTRICAS CONSOLIDADAS", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Total Gasto: ${formatCurrency(metricas.totalGasto)}`, 20, yPosition)
      doc.text(`Total Cliques: ${formatNumber(metricas.totalCliques)}`, 110, yPosition)
      yPosition += 6
      doc.text(`Total Impressões: ${formatNumber(metricas.totalImpressoes)}`, 20, yPosition)
      doc.text(`Total Conversões: ${formatNumber(metricas.totalConversoes)}`, 110, yPosition)
      yPosition += 6
      doc.text(`CPM: ${formatCurrency(metricas.cpm)}`, 20, yPosition)
      doc.text(`CPC: ${formatCurrency(metricas.cpc)}`, 110, yPosition)
      yPosition += 6
      doc.text(`CTR: ${metricas.ctr.toFixed(2)}%`, 20, yPosition)
      yPosition += 15

      // Campanhas
      if (metricas.campanhas && metricas.campanhas.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(249, 115, 22)
        doc.text("CAMPANHAS", 20, yPosition)
        yPosition += 10

        doc.setFontSize(8)
        doc.setTextColor(0, 0, 0)
        metricas.campanhas.slice(0, 10).forEach((campanha: any) => {
          if (yPosition > 270) {
            doc.addPage()
            yPosition = 20
          }
          doc.text(`• ${campanha.nome} - ${campanha.status} - ${formatCurrency(campanha.valor_gasto)}`, 20, yPosition)
          yPosition += 5
        })
      }
    } else {
      // Informações da Campanha
      doc.setFontSize(12)
      doc.setTextColor(249, 115, 22)
      doc.text("INFORMAÇÕES DA CAMPANHA", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Nome: ${dados.nome}`, 20, yPosition)
      yPosition += 6
      doc.text(`Status: ${dados.status}`, 20, yPosition)
      yPosition += 6
      doc.text(`Objetivo: ${dados.objetivo || "N/A"}`, 20, yPosition)
      yPosition += 6
      doc.text(`Cliente: ${dados.cliente_nome}`, 20, yPosition)
      yPosition += 6
      doc.text(
        `Data Início: ${dados.data_inicio ? new Date(dados.data_inicio).toLocaleDateString("pt-BR") : "N/A"}`,
        20,
        yPosition,
      )
      yPosition += 15

      // Métricas da Campanha
      doc.setFontSize(12)
      doc.setTextColor(249, 115, 22)
      doc.text("MÉTRICAS DA CAMPANHA", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.text(`Gasto Total: ${formatCurrency(metricas.totalGasto)}`, 20, yPosition)
      doc.text(`Impressões: ${formatNumber(metricas.totalImpressoes)}`, 110, yPosition)
      yPosition += 6
      doc.text(`Cliques: ${formatNumber(metricas.totalCliques)}`, 20, yPosition)
      doc.text(`CTR: ${metricas.ctr.toFixed(2)}%`, 110, yPosition)
      yPosition += 6
      doc.text(`CPC: ${formatCurrency(metricas.cpc)}`, 20, yPosition)
      doc.text(`CPM: ${formatCurrency(metricas.cpm)}`, 110, yPosition)
      yPosition += 15
    }

    // Observações
    if (observacoes.trim()) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }
      doc.setFontSize(12)
      doc.setTextColor(249, 115, 22)
      doc.text("OBSERVAÇÕES", 20, yPosition)
      yPosition += 10

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      const linhasObservacoes = doc.splitTextToSize(observacoes, 170)
      doc.text(linhasObservacoes, 20, yPosition)
    }

    return doc
  }

  const exportarRelatorio = async () => {
    setExportando(true)
    try {
      if (formato === "csv") {
        const csvContent = gerarCSV()
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute(
          "download",
          `relatorio_${tipo}_${titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`,
        )
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        const doc = await gerarPDF()
        doc.save(`relatorio_${tipo}_${titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`)
      }
    } catch (error) {
      console.error("Erro ao exportar relatório:", error)
    } finally {
      setExportando(false)
    }
  }

  const visualizarPreview = () => {
    setPreview(!preview)
  }

  return (
    <div className="space-y-6">
      {/* Configurações de Exportação */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" />
            CONFIGURAÇÕES DE EXPORTAÇÃO
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 tracking-wider">FORMATO</label>
              <Select value={formato} onValueChange={(value: "pdf" | "csv") => setFormato(value)}>
                <SelectTrigger className="bg-neutral-700 border-neutral-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800 border-neutral-600">
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      PDF - Relatório Formatado
                    </div>
                  </SelectItem>
                  <SelectItem value="csv">
                    <div className="flex items-center gap-2">
                      <Table className="w-4 h-4" />
                      CSV - Dados Tabulares
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-neutral-400 tracking-wider">NOME DO ARQUIVO</label>
              <Input
                value={`relatorio_${tipo}_${titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`}
                className="bg-neutral-700 border-neutral-600 text-white"
                readOnly
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-neutral-400 tracking-wider">OBSERVAÇÕES ADICIONAIS</label>
            <Textarea
              placeholder="Adicione observações que serão incluídas no relatório..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="bg-neutral-700 border-neutral-600 text-white min-h-[80px]"
            />
          </div>

          <div className="flex gap-4">
            <Button
              onClick={visualizarPreview}
              variant="outline"
              className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent"
            >
              <Eye className="w-4 h-4 mr-2" />
              {preview ? "Ocultar Preview" : "Visualizar Preview"}
            </Button>
            <Button onClick={exportarRelatorio} disabled={exportando} className="bg-orange-600 hover:bg-orange-700">
              <Download className="w-4 h-4 mr-2" />
              {exportando ? "Exportando..." : `Exportar ${formato.toUpperCase()}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview do Relatório */}
      {preview && (
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4" />
              PREVIEW DO RELATÓRIO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white text-black p-6 rounded-lg font-mono text-sm">
              <div className="border-b border-gray-300 pb-4 mb-4">
                <h1 className="text-2xl font-bold text-orange-600 mb-2">TACTICAL COMMAND</h1>
                <h2 className="text-lg font-semibold">RELATÓRIO DE {tipo.toUpperCase()}</h2>
                <div className="text-sm text-gray-600 mt-2">
                  <p>Gerado em: {new Date().toLocaleString("pt-BR")}</p>
                  <p>Gestor: {usuario?.nome || "N/A"}</p>
                  <p>Título: {titulo}</p>
                </div>
              </div>

              {tipo === "cliente" ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-orange-600 mb-2">INFORMAÇÕES DO CLIENTE</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <strong>Nome:</strong> {dados.nome}
                      </p>
                      <p>
                        <strong>Email:</strong> {dados.email}
                      </p>
                      <p>
                        <strong>Empresa:</strong> {dados.empresa || "N/A"}
                      </p>
                      <p>
                        <strong>Status:</strong> <Badge className="ml-1">{dados.status}</Badge>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-orange-600 mb-2">MÉTRICAS CONSOLIDADAS</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <strong>Total Gasto:</strong> {formatCurrency(metricas.totalGasto)}
                      </p>
                      <p>
                        <strong>Total Cliques:</strong> {formatNumber(metricas.totalCliques)}
                      </p>
                      <p>
                        <strong>Total Impressões:</strong> {formatNumber(metricas.totalImpressoes)}
                      </p>
                      <p>
                        <strong>Total Conversões:</strong> {formatNumber(metricas.totalConversoes)}
                      </p>
                      <p>
                        <strong>CPM:</strong> {formatCurrency(metricas.cpm)}
                      </p>
                      <p>
                        <strong>CPC:</strong> {formatCurrency(metricas.cpc)}
                      </p>
                      <p>
                        <strong>CTR:</strong> {metricas.ctr.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {metricas.campanhas && metricas.campanhas.length > 0 && (
                    <div>
                      <h3 className="font-bold text-orange-600 mb-2">CAMPANHAS ({metricas.campanhas.length})</h3>
                      <div className="space-y-1 text-sm">
                        {metricas.campanhas.slice(0, 5).map((campanha: any, index: number) => (
                          <p key={index}>
                            • {campanha.nome} - {campanha.status} - {formatCurrency(campanha.valor_gasto)}
                          </p>
                        ))}
                        {metricas.campanhas.length > 5 && (
                          <p className="text-gray-600">... e mais {metricas.campanhas.length - 5} campanhas</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-orange-600 mb-2">INFORMAÇÕES DA CAMPANHA</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <strong>Nome:</strong> {dados.nome}
                      </p>
                      <p>
                        <strong>Status:</strong> <Badge className="ml-1">{dados.status}</Badge>
                      </p>
                      <p>
                        <strong>Objetivo:</strong> {dados.objetivo || "N/A"}
                      </p>
                      <p>
                        <strong>Cliente:</strong> {dados.cliente_nome}
                      </p>
                      <p>
                        <strong>Data Início:</strong>{" "}
                        {dados.data_inicio ? new Date(dados.data_inicio).toLocaleDateString("pt-BR") : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-orange-600 mb-2">MÉTRICAS DA CAMPANHA</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>
                        <strong>Gasto Total:</strong> {formatCurrency(metricas.totalGasto)}
                      </p>
                      <p>
                        <strong>Impressões:</strong> {formatNumber(metricas.totalImpressoes)}
                      </p>
                      <p>
                        <strong>Cliques:</strong> {formatNumber(metricas.totalCliques)}
                      </p>
                      <p>
                        <strong>CTR:</strong> {metricas.ctr.toFixed(2)}%
                      </p>
                      <p>
                        <strong>CPC:</strong> {formatCurrency(metricas.cpc)}
                      </p>
                      <p>
                        <strong>CPM:</strong> {formatCurrency(metricas.cpm)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {observacoes.trim() && (
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <h3 className="font-bold text-orange-600 mb-2">OBSERVAÇÕES</h3>
                  <p className="text-sm whitespace-pre-wrap">{observacoes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações sobre os Formatos */}
      <Card className="bg-neutral-800 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            SOBRE OS FORMATOS DE EXPORTAÇÃO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-medium text-white">Formato PDF</h4>
              </div>
              <ul className="text-xs text-neutral-400 space-y-1 ml-6">
                <li>• Relatório visualmente formatado</li>
                <li>• Logo e branding do Tactical Command</li>
                <li>• Ideal para apresentações</li>
                <li>• Inclui gráficos e métricas organizadas</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium text-white">Formato CSV</h4>
              </div>
              <ul className="text-xs text-neutral-400 space-y-1 ml-6">
                <li>• Dados em formato tabular</li>
                <li>• Compatível com Excel e Google Sheets</li>
                <li>• Ideal para análises detalhadas</li>
                <li>• Inclui métricas históricas quando disponíveis</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
