# Configuração do Google Analytics

Este guia explica como configurar a integração com o Google Analytics no sistema.

## 1. Configuração no Google Cloud Console

### Passo 1: Criar um Projeto
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Anote o ID do projeto

### Passo 2: Ativar APIs
1. No menu lateral, vá em "APIs e Serviços" > "Biblioteca"
2. Ative as seguintes APIs:
   - Google Analytics Reporting API
   - Google Analytics Data API
   - Google Analytics Admin API

### Passo 3: Configurar OAuth 2.0
1. Vá em "APIs e Serviços" > "Credenciais"
2. Clique em "+ CRIAR CREDENCIAIS" > "ID do cliente OAuth"
3. Selecione "Aplicativo da Web"
4. Configure:
   - **Nome**: Gerenciador de Campanhas - Google Analytics
   - **Origens JavaScript autorizadas**:
     - `http://localhost:3000` (desenvolvimento)
     - `https://seu-dominio.com` (produção)
   - **URIs de redirecionamento autorizados**:
     - `http://localhost:3000/api/auth/google-analytics/callback` (desenvolvimento)
     - `https://seu-dominio.com/api/auth/google-analytics/callback` (produção)

### Passo 4: Obter Credenciais
1. Após criar, copie:
   - **Client ID**: Para `NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID`
   - **Client Secret**: Para `GOOGLE_ANALYTICS_CLIENT_SECRET`

## 2. Configuração no Google Analytics

### Passo 1: Criar Propriedade GA4
1. Acesse o [Google Analytics](https://analytics.google.com/)
2. Crie uma nova propriedade GA4 ou use uma existente
3. Anote o **Property ID** (formato: 123456789)

### Passo 2: Configurar Permissões
1. Na propriedade GA4, vá em "Administrador"
2. Em "Acesso à propriedade", adicione o email do projeto Google Cloud
3. Conceda permissões de "Visualizador" ou "Analista"

## 3. Configuração do Banco de Dados

### Executar Script SQL
```sql
-- Execute o arquivo scripts/10-google-analytics.sql no Supabase
```

Este script criará as tabelas:
- `tokens_google_analytics`
- `contas_analytics`
- `metricas_analytics`
- `objetivos_analytics`

## 4. Configuração das Variáveis de Ambiente

No arquivo `.env.local`, adicione:

```env
# Google Analytics OAuth
NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID=seu_client_id_aqui
GOOGLE_ANALYTICS_CLIENT_SECRET=seu_client_secret_aqui
```

## 5. Escopos de Permissão

O sistema solicita os seguintes escopos:
- `https://www.googleapis.com/auth/analytics.readonly` - Leitura de dados
- `https://www.googleapis.com/auth/analytics.manage.users.readonly` - Leitura de usuários

## 6. Funcionalidades Implementadas

### Autenticação OAuth
- Modal de conexão para clientes
- Callback de autenticação
- Renovação automática de tokens

### Sincronização de Dados
- Métricas de sessões, usuários, visualizações
- Dados de dispositivos e origem de tráfego
- Conversões e receita
- Agrupamento por data e dimensões

### Interface de Usuário
- Página dedicada `/analytics`
- Visualização de métricas em tempo real
- Gestão de conexões por cliente
- Sincronização manual de dados

## 7. Estrutura de Arquivos

```
app/
├── analytics/
│   └── page.tsx                    # Página principal do Google Analytics
├── api/
│   ├── auth/
│   │   └── google-analytics/
│   │       └── callback/
│   │           └── route.ts         # Callback OAuth
│   └── analytics/
│       └── sync/
│           └── route.ts             # API de sincronização
components/
└── conectar-google-analytics-modal.tsx  # Modal de conexão
scripts/
└── 10-google-analytics.sql         # Script de criação das tabelas
```

## 8. Testando a Integração

### Passo 1: Verificar Configuração
1. Certifique-se de que todas as variáveis de ambiente estão configuradas
2. Execute o script SQL no Supabase
3. Reinicie o servidor de desenvolvimento

### Passo 2: Testar Conexão
1. Acesse `/analytics`
2. Clique em "Conectar Analytics" para um cliente
3. Complete o fluxo OAuth
4. Verifique se a conta aparece como conectada

### Passo 3: Testar Sincronização
1. Clique em "Sincronizar" em uma conta conectada
2. Verifique se as métricas são carregadas
3. Confirme os dados no banco Supabase

## 9. Solução de Problemas

### Erro: "Client ID não configurado"
- Verifique se `NEXT_PUBLIC_GOOGLE_ANALYTICS_CLIENT_ID` está no `.env.local`
- Reinicie o servidor após adicionar a variável

### Erro: "redirect_uri_mismatch"
- Verifique se a URI de callback está configurada no Google Cloud Console
- Certifique-se de que `NEXT_PUBLIC_APP_URL` está correto

### Erro: "insufficient_permissions"
- Verifique se o usuário tem acesso à propriedade GA4
- Confirme se os escopos estão corretos

### Erro: "Property not found"
- Verifique se a propriedade GA4 existe
- Confirme se o usuário tem permissões na propriedade

## 10. Métricas Coletadas

- **Usuários**: Total e novos usuários
- **Sessões**: Número total de sessões
- **Visualizações de Página**: Páginas visualizadas
- **Taxa de Rejeição**: Porcentagem de sessões de página única
- **Duração Média**: Tempo médio de sessão
- **Conversões**: Eventos de conversão configurados
- **Receita**: Valor de receita (se configurado)
- **Dispositivos**: Distribuição por tipo de dispositivo
- **Origem de Tráfego**: Canais de aquisição
- **Localização**: Dados geográficos dos usuários

## 11. Próximos Passos

- Configurar objetivos personalizados
- Implementar relatórios avançados
- Adicionar alertas automáticos
- Integrar com outras ferramentas de marketing

---

**Nota**: Esta integração segue as melhores práticas de segurança e privacidade do Google Analytics e está em conformidade com as políticas de uso da API.