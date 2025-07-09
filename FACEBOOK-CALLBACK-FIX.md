# Correção do Erro de Redirect URI do Facebook

## Problema Identificado

O erro "Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request" ocorre porque há inconsistência entre:

1. **URL usada no modal** (antes da correção): `window.location.origin`
2. **URL usada no callback**: `process.env.NEXT_PUBLIC_APP_URL`
3. **URL configurada no Facebook App**: Pode estar diferente

## Correções Aplicadas

✅ **Modal de Conexão Meta** (`components/conectar-meta-modal.tsx`):
- Alterado de `window.location.origin` para `process.env.NEXT_PUBLIC_APP_URL`
- Garantindo consistência entre modal e callback

## Configuração Necessária no Facebook App

Você precisa configurar as seguintes URLs no Facebook Developers Console:

### 1. Acesse o Facebook Developers
- Vá para: https://developers.facebook.com/
- Acesse seu app: **Traffic Manager**
- Vá em **Configurações do App** > **Básico**

### 2. Configure as URLs de Callback

Na seção **Domínios do App**, adicione:
```
app-gerenciador-pi.vercel.app
```

### 3. Configure o Facebook Login
- Vá em **Produtos** > **Facebook Login** > **Configurações**
- Em **URIs de redirecionamento OAuth válidos**, adicione:

**Para Produção:**
```
https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback
```

**Para Desenvolvimento Local (se necessário):**
```
http://localhost:3000/api/auth/facebook/callback
```

### 4. Configuração Atual do Projeto

O arquivo `.env.local` está configurado com:
```
NEXT_PUBLIC_APP_URL=https://app-gerenciador-pi.vercel.app
```

## Como Testar

1. **Salve as configurações** no Facebook Developers
2. **Aguarde alguns minutos** para as mudanças propagarem
3. **Teste a conexão** novamente no seu app
4. **Verifique os logs** no console do navegador

## Logs para Verificar

No console do navegador, você deve ver:
```
Facebook App ID: [seu-app-id]
Redirect URI: https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback
```

## Se o Problema Persistir

1. **Verifique se o Facebook App está em modo de desenvolvimento**
   - Apps em desenvolvimento só funcionam para administradores
   - Considere colocar em modo "Live" se necessário

2. **Verifique as permissões solicitadas**
   - `ads_management`
   - `ads_read` 
   - `business_management`

3. **Teste com uma conta de administrador do Facebook App**

## URLs que Devem Ser Idênticas

✅ **Modal**: `https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback`
✅ **Callback**: `https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback`
✅ **Facebook App**: `https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback`

Todas essas URLs agora estão consistentes após as correções aplicadas.