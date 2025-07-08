# Traffic Manager - Sistema de Gestão de Tráfego Digital

Um sistema completo para gerenciamento de campanhas de tráfego digital com integração ao Meta Ads.

## 🚨 Correção do Erro de Registro

Se você está enfrentando o erro "new row violates row-level security policy for table 'usuarios'", siga os passos abaixo:

### Passo 1: Configurar Variáveis de Ambiente

1. Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

2. Preencha as variáveis no arquivo `.env.local` com seus valores reais:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
FACEBOOK_APP_ID=seu_app_id_facebook
FACEBOOK_APP_SECRET=seu_app_secret_facebook
NEXT_PUBLIC_APP_URL=https://app-gerenciador-beta.vercel.app
```

### Passo 2: Corrigir Estrutura do Banco de Dados

1. Acesse o painel do Supabase (https://app.supabase.com)
2. Vá para seu projeto
3. Acesse "SQL Editor" no menu lateral
4. Copie e execute o conteúdo do arquivo `scripts/fix-usuarios-table.sql`
5. Aguarde a execução completa

### Passo 3: Testar o Registro

1. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
pnpm dev
```

2. Acesse https://app-gerenciador-beta.vercel.app/register
3. Tente criar uma nova conta

## 📋 Funcionalidades

- ✅ **Gestão de Clientes**: Cadastro e gerenciamento de clientes
- ✅ **Integração Meta Ads**: Sincronização automática de campanhas
- ✅ **Dashboard Analítico**: Métricas e relatórios em tempo real
- ✅ **Sistema de Notificações**: Alertas personalizáveis
- ✅ **Relatórios Públicos**: Links compartilháveis para clientes
- ✅ **Gestão Financeira**: Controle de faturamento e cobrança
- ✅ **Sistema de Tags**: Organização de campanhas
- ✅ **Anotações**: Sistema de notas por cliente/campanha

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **APIs**: Meta Ads API, Facebook Graph API
- **Deployment**: Vercel

## 📦 Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd app-gerenciador
```

2. Instale as dependências:
```bash
npm install
# ou
pnpm install
```

3. Configure as variáveis de ambiente (veja Passo 1 acima)

4. Execute as migrações do banco (veja Passo 2 acima)

5. Inicie o servidor:
```bash
npm run dev
```

## 🗄️ Estrutura do Banco de Dados

### Tabelas Principais:
- `usuarios` - Gestores do sistema
- `clientes` - Clientes dos gestores
- `contas_ads` - Contas de anúncios (Meta, Google, TikTok)
- `campanhas` - Campanhas publicitárias
- `tokens_meta` - Tokens de acesso da Meta
- `metricas_diarias` - Métricas diárias das campanhas
- `notificacoes` - Sistema de notificações
- `relatorios_publicos` - Links públicos de relatórios

### Segurança:
- Row Level Security (RLS) habilitado
- Políticas de acesso baseadas em usuário
- Autenticação via Supabase Auth

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run start` - Inicia servidor de produção
- `npm run lint` - Executa linting

## 📝 Configuração da Meta API

1. Crie um app no Facebook Developers
2. Configure as permissões necessárias:
   - `ads_read`
   - `ads_management`
   - `business_management`
3. Adicione as URLs de callback
4. Configure as variáveis de ambiente

## 🚀 Deploy

O projeto está configurado para deploy automático no Vercel:

1. Conecte seu repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

## 📞 Suporte

Se você continuar enfrentando problemas:

1. Verifique se todas as variáveis de ambiente estão configuradas
2. Confirme que o script SQL foi executado corretamente
3. Verifique os logs do Supabase para erros específicos
4. Teste com um novo usuário

## 🔄 Atualizações Automáticas

Este projeto é sincronizado automaticamente com v0.dev para atualizações contínuas.

---

**Desenvolvido com ❤️ para gestores de tráfego digital**