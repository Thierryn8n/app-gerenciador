"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, TrendingUp, DollarSign, Users, Target } from "lucide-react"

export default function RelatoriosPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">RELATÓRIOS E ANÁLISES</h1>
          <p className="text-sm text-neutral-400">Análise detalhada do desempenho das campanhas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 bg-transparent">
            <Calendar className="w-4 h-4 mr-2" />
            Período
          </Button>
          <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">ROI MÉDIO</p>
                <p className="text-2xl font-bold text-green-400 font-mono">324%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CPC MÉDIO</p>
                <p className="text-2xl font-bold text-blue-400 font-mono">R$ 1,24</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">CONVERSÕES</p>
                <p className="text-2xl font-bold text-purple-400 font-mono">1,247</p>
              </div>
              <Target className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">LEADS GERADOS</p>
                <p className="text-2xl font-bold text-orange-400 font-mono">3,891</p>
              </div>
              <Users className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              PERFORMANCE POR PERÍODO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              {/* Chart Grid */}
              <div className="absolute inset-0 grid grid-cols-7 grid-rows-8 opacity-20">
                {Array.from({ length: 56 }).map((_, i) => (
                  <div key={i} className="border border-neutral-700"></div>
                ))}
              </div>

              {/* Chart Lines */}
              <svg className="absolute inset-0 w-full h-full">
                <polyline
                  points="0,200 80,180 160,160 240,140 320,120 400,100 480,80"
                  fill="none"
                  stroke="#f97316"
                  strokeWidth="3"
                />
                <polyline
                  points="0,220 80,210 160,200 240,190 320,180 400,170 480,160"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
              </svg>

              {/* Legend */}
              <div className="absolute top-4 right-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-orange-500"></div>
                  <span className="text-xs text-neutral-400">Conversões</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-blue-500 border-dashed"></div>
                  <span className="text-xs text-neutral-400">Investimento</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-800 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">TOP CAMPANHAS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { nome: "Campanha Black Friday", roi: "450%", investimento: "R$ 12.500", cor: "bg-green-500" },
                { nome: "Lançamento Produto X", roi: "320%", investimento: "R$ 8.900", cor: "bg-blue-500" },
                { nome: "Remarketing Q4", roi: "280%", investimento: "R$ 6.200", cor: "bg-purple-500" },
                { nome: "Prospecção Lookalike", roi: "245%", investimento: "R$ 4.800", cor: "bg-orange-500" },
              ].map((campanha, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-neutral-900 rounded">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${campanha.cor}`}></div>
                    <div>
                      <p className="text-sm text-white">{campanha.nome}</p>
                      <p className="text-xs text-neutral-400">{campanha.investimento}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-400">{campanha.roi}</p>
                    <p className="text-xs text-neutral-400">ROI</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
