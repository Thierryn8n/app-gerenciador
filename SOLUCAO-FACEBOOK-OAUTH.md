# 🚨 Solução para Erro de Facebook OAuth

## ❌ Erro Atual
```
Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request
```

## ✅ Configurações Verificadas
- ✅ Código do modal: Usando `process.env.NEXT_PUBLIC_APP_URL`
- ✅ Código do callback: Usando `NEXT_PUBLIC_APP_URL`
- ✅ Arquivo .env.local: `https://app-gerenciador-pi.vercel.app`
- ✅ URLs são idênticas no código

## 🎯 Soluções Prioritárias

### 1. 🔧 Verificar Facebook Developers Console

**IMPORTANTE:** Acesse https://developers.facebook.com/ e verifique:

#### App ID: `1405602787157576`

#### Configurações Obrigatórias:

**A) Produtos > Facebook Login > Configurações**
- ✅ "Usar modo estrito para URIs de redirecionamento": **ATIVADO**
- ✅ "URIs de redirecionamento OAuth válidos":
  ```
  https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback
  ```

**B) Configurações do App > Básico**
- ✅ "Domínios do App":
  ```
  app-gerenciador-pi.vercel.app
  ```

**C) Status do App**
- ✅ Modo: **"Live"** (não "Development")
- ✅ Ou você deve ser **administrador** do app

### 2. 🧹 Limpar Cache Completo

**No Navegador:**
1. Pressione `Ctrl + Shift + Delete`
2. Selecione "Todo o período"
3. Marque:
   - ✅ Cookies e outros dados do site
   - ✅ Imagens e arquivos em cache
   - ✅ Dados de aplicativos hospedados
4. Clique em "Limpar dados"

**Ou use modo incógnito/privado para testar**

### 3. 🔍 Debug em Tempo Real

**Abra o arquivo:** `debug-facebook-oauth.html`
- Verifique se as URLs são idênticas
- Execute os testes de ambiente
- Limpe o cache local

### 4. 🌐 Verificar Ambiente de Produção

**Certifique-se que está testando em:**
- ✅ `https://app-gerenciador-pi.vercel.app` (produção)
- ❌ NÃO em `localhost:3000` (desenvolvimento)

### 5. 🔄 Rebuild e Deploy

**Se nada funcionar:**
```bash
# Limpar build
npm run build

# Fazer novo deploy
git add .
git commit -m "fix: Force rebuild for Facebook OAuth"
git push
```

## 🕵️ Diagnóstico Avançado

### Verificar Logs do Console

**No navegador (F12 > Console), procure por:**
```javascript
Facebook App ID: 1405602787157576
Redirect URI: https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback
```

### Testar URL Manualmente

**Cole no navegador:**
```
https://www.facebook.com/v18.0/dialog/oauth?client_id=1405602787157576&redirect_uri=https%3A%2F%2Fapp-gerenciador-pi.vercel.app%2Fapi%2Fauth%2Ffacebook%2Fcallback&scope=ads_management%2Cads_read%2Cbusiness_management&response_type=code&state=%7B%22clienteId%22%3A%22test%22%7D
```

## 🚨 Checklist Final

- [ ] Facebook App está em modo "Live"
- [ ] URL no Facebook Developers é exatamente: `https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback`
- [ ] Domínio no Facebook Developers é: `app-gerenciador-pi.vercel.app`
- [ ] Cache do navegador foi limpo
- [ ] Testando em produção (não localhost)
- [ ] Você é administrador do Facebook App

## 📞 Se Ainda Não Funcionar

1. **Verifique se o Facebook App não foi suspenso**
2. **Tente criar um novo Facebook App para teste**
3. **Verifique se não há caracteres invisíveis nas URLs**
4. **Teste com outro navegador**
5. **Verifique se não há proxy/VPN interferindo**

---

**🎯 A causa mais comum é a configuração incorreta no Facebook Developers Console!**