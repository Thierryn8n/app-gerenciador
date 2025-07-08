"use client"

export default function TermosServicoPage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Termos de Serviço</h1>
        
        <div className="space-y-6 text-neutral-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Aceitação dos Termos</h2>
            <p>
              Ao utilizar nosso aplicativo de gerenciamento de tráfego, você concorda com estes termos de serviço. Se não concordar, não utilize nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Descrição do Serviço</h2>
            <p>
              Nossa plataforma oferece:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gerenciamento de campanhas publicitárias no Meta Ads</li>
              <li>Relatórios de performance e métricas</li>
              <li>Ferramentas de otimização de anúncios</li>
              <li>Dashboard de controle e monitoramento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Responsabilidades do Usuário</h2>
            <p>
              Você se compromete a:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Fornecer informações precisas e atualizadas</li>
              <li>Manter a confidencialidade de suas credenciais</li>
              <li>Usar o serviço de forma legal e ética</li>
              <li>Não violar direitos de terceiros</li>
              <li>Cumprir as políticas do Facebook/Meta</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Limitações de Responsabilidade</h2>
            <p>
              Nossa responsabilidade é limitada ao valor pago pelos serviços. Não nos responsabilizamos por:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Perdas indiretas ou consequenciais</li>
              <li>Interrupções no serviço do Facebook/Meta</li>
              <li>Decisões de investimento em publicidade</li>
              <li>Resultados específicos de campanhas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Propriedade Intelectual</h2>
            <p>
              Todos os direitos de propriedade intelectual da plataforma pertencem a nós. Você recebe apenas uma licença limitada de uso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Pagamentos e Reembolsos</h2>
            <p>
              Os pagamentos são processados conforme o plano contratado. Reembolsos são avaliados caso a caso, conforme nossa política de reembolso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Suspensão e Cancelamento</h2>
            <p>
              Podemos suspender ou cancelar sua conta em caso de violação destes termos ou uso inadequado da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Modificações dos Termos</h2>
            <p>
              Reservamos o direito de modificar estes termos a qualquer momento. Mudanças significativas serão comunicadas com antecedência.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Lei Aplicável</h2>
            <p>
              Estes termos são regidos pelas leis brasileiras. Disputas serão resolvidas no foro da comarca de São Paulo/SP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contato</h2>
            <p>
              Para questões sobre estes termos, entre em contato: suporte@trafficmanager.com
            </p>
          </section>

          <div className="mt-8 pt-6 border-t border-neutral-700 text-center text-sm text-neutral-400">
            <p>Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}