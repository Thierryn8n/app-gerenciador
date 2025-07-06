"use client"

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Política de Privacidade</h1>
        
        <div className="space-y-6 text-neutral-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Informações que Coletamos</h2>
            <p>
              Nosso aplicativo de gerenciamento de tráfego coleta as seguintes informações:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Dados de autenticação do Facebook/Meta Ads</li>
              <li>Informações de campanhas publicitárias</li>
              <li>Métricas de performance de anúncios</li>
              <li>Dados de clientes cadastrados no sistema</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Como Usamos suas Informações</h2>
            <p>
              Utilizamos as informações coletadas para:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gerenciar e otimizar campanhas publicitárias</li>
              <li>Fornecer relatórios de performance</li>
              <li>Melhorar nossos serviços</li>
              <li>Garantir a segurança da plataforma</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Compartilhamento de Dados</h2>
            <p>
              Não compartilhamos suas informações pessoais com terceiros, exceto:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Quando necessário para fornecer nossos serviços</li>
              <li>Para cumprir obrigações legais</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Segurança dos Dados</h2>
            <p>
              Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Seus Direitos</h2>
            <p>
              Você tem o direito de:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Acessar suas informações pessoais</li>
              <li>Corrigir dados incorretos</li>
              <li>Solicitar a exclusão de seus dados</li>
              <li>Revogar consentimentos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Cookies e Tecnologias Similares</h2>
            <p>
              Utilizamos cookies e tecnologias similares para melhorar a experiência do usuário e analisar o uso de nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Alterações nesta Política</h2>
            <p>
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas através de nossa plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contato</h2>
            <p>
              Para questões sobre esta política de privacidade, entre em contato conosco através do email: privacidade@seudominio.com
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