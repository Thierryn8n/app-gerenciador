# Deploy no Cloudflare Pages

## Configurações de Build no Cloudflare Pages

Quando configurar o projeto no Cloudflare Pages, use as seguintes configurações:

### Build Settings
- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Node.js version**: `20.x`
- **Root directory**: `/` (deixe em branco se for a raiz do repositório)

### Environment Variables

Configure as seguintes variáveis de ambiente no painel do Cloudflare Pages:

**Configurações do Wrangler:**
- `WRANGLER_SEND_METRICS` = `false`

**Configurações do Supabase:**
Adicione as seguintes variáveis de ambiente no painel do Cloudflare Pages:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_do_supabase
SUPABASE_JWT_SECRET=seu_jwt_secret_do_supabase

# Facebook/Meta
NEXT_PUBLIC_FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_SECRET=seu_facebook_app_secret
FACEBOOK_ACCESS_TOKEN=seu_facebook_access_token

# PostgreSQL (se necessário)
POSTGRES_URL=sua_url_do_postgres
POSTGRES_PRISMA_URL=sua_url_prisma_do_postgres
POSTGRES_URL_NON_POOLING=sua_url_non_pooling_do_postgres
POSTGRES_USER=postgres
POSTGRES_HOST=seu_host_do_postgres
POSTGRES_PASSWORD=sua_senha_do_postgres
POSTGRES_DATABASE=postgres

# URL da aplicação (ajuste para seu domínio)
NEXT_PUBLIC_APP_URL=https://seu-dominio.pages.dev

## Resolução do Erro de Deploy

### Se você está vendo o erro "If are uploading a directory of assets..."

Este erro indica que o Cloudflare está tentando fazer deploy como **Worker** em vez de **Pages**. Para resolver:

1. **Verifique se você está no painel correto:**
   - Acesse: `https://dash.cloudflare.com/` → **Workers & Pages**
   - Certifique-se de estar na aba **"Pages"** (não "Workers")

2. **Se o projeto foi criado como Worker por engano:**
   - Delete o projeto Worker existente
   - Crie um novo projeto na aba **"Pages"**
   - Use **"Connect to Git"** para conectar seu repositório

3. **Configurações corretas para Pages:**
   - **Framework preset**: Next.js
   - **Build command**: `npm run build`
   - **Build output directory**: `.next`
   - **Root directory**: `/` (deixe em branco)

## Notas Importantes

- **NÃO** use `wrangler deploy` para este projeto - ele é configurado para deploy via Git
- **NÃO** adicione arquivo `wrangler.toml` - isso causará conflitos
- O projeto está configurado para **Cloudflare Pages**, não Workers
- Use apenas a integração Git no painel do **Cloudflare Pages**
- Se o erro persistir, delete o projeto e recrie como **Pages** (não Worker)
```

### Passos para Deploy

1. **Conecte o repositório**:
   - Acesse o painel do Cloudflare Pages
   - Clique em "Create a project"
   - Conecte sua conta do GitHub/GitLab
   - Selecione este repositório

2. **Configure o build**:
   - Use as configurações mencionadas acima
   - Adicione todas as variáveis de ambiente

3. **Deploy automático**:
   - O Cloudflare Pages fará deploy automaticamente a cada push na branch main
   - Você pode acompanhar o progresso no painel

### Notas Importantes

- O projeto usa Next.js com rotas de API, que são suportadas pelo Cloudflare Pages
- As variáveis de ambiente são essenciais para o funcionamento correto
- Certifique-se de que `NEXT_PUBLIC_APP_URL` aponte para o domínio correto do Cloudflare Pages
- O build pode levar alguns minutos na primeira vez

### Troubleshooting

Se o deploy falhar:
1. Verifique se todas as variáveis de ambiente estão configuradas
2. Confirme que o Node.js está na versão 20.x
3. Verifique os logs de build no painel do Cloudflare Pages
4. Certifique-se de que não há erros de TypeScript ou ESLint críticos