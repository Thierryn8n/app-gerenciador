# Deploy no Cloudflare Pages

## Configurações para Deploy via Git

Quando você conectar este repositório ao Cloudflare Pages, use as seguintes configurações:

### Build Settings
- **Framework preset**: Next.js
- **Build command**: `npm run build`
- **Build output directory**: `.next`
- **Root directory**: `/` (deixe em branco)
- **Node.js version**: `20.x`

### Environment Variables
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