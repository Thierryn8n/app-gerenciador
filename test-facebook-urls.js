// Script para testar e comparar URLs do Facebook OAuth

const fs = require('fs');
const path = require('path');

// Ler arquivo .env.local
const envPath = path.join(__dirname, '.env.local');
let appUrl = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  const appUrlLine = lines.find(line => line.startsWith('NEXT_PUBLIC_APP_URL='));
  
  if (appUrlLine) {
    appUrl = appUrlLine.split('=')[1].trim();
    console.log('✅ NEXT_PUBLIC_APP_URL encontrado:', appUrl);
  } else {
    console.log('❌ NEXT_PUBLIC_APP_URL não encontrado no .env.local');
  }
} else {
  console.log('❌ Arquivo .env.local não encontrado');
}

// URLs que devem ser idênticas
const modalUrl = `${appUrl}/api/auth/facebook/callback`;
const callbackUrl = `${appUrl}/api/auth/facebook/callback`;
const encodedModalUrl = encodeURIComponent(modalUrl);

console.log('\n🔍 COMPARAÇÃO DE URLs:');
console.log('Modal URL (raw):', modalUrl);
console.log('Modal URL (encoded):', encodedModalUrl);
console.log('Callback URL:', callbackUrl);
console.log('URLs são idênticas?', modalUrl === callbackUrl ? '✅ SIM' : '❌ NÃO');

// Testar URL completa do Facebook
const facebookAppId = '1405602787157576';
const scope = encodeURIComponent('ads_management,ads_read,business_management');
const state = encodeURIComponent(JSON.stringify({ clienteId: 'test' }));

const facebookAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${facebookAppId}&redirect_uri=${encodedModalUrl}&scope=${scope}&response_type=code&state=${state}`;

console.log('\n🌐 URL COMPLETA DO FACEBOOK:');
console.log(facebookAuthUrl);

// Verificar se há caracteres especiais ou espaços
console.log('\n🔍 ANÁLISE DE CARACTERES:');
console.log('Modal URL length:', modalUrl.length);
console.log('Modal URL bytes:', Buffer.from(modalUrl).toString('hex'));
console.log('Callback URL length:', callbackUrl.length);
console.log('Callback URL bytes:', Buffer.from(callbackUrl).toString('hex'));

// Verificar se há diferenças invisíveis
if (modalUrl !== callbackUrl) {
  console.log('\n❌ DIFERENÇAS ENCONTRADAS:');
  for (let i = 0; i < Math.max(modalUrl.length, callbackUrl.length); i++) {
    if (modalUrl[i] !== callbackUrl[i]) {
      console.log(`Posição ${i}: Modal='${modalUrl[i] || 'undefined'}' vs Callback='${callbackUrl[i] || 'undefined'}'`);
    }
  }
} else {
  console.log('\n✅ URLs são idênticas byte por byte');
}

// Testar decodificação
console.log('\n🔄 TESTE DE DECODIFICAÇÃO:');
console.log('URL encoded:', encodedModalUrl);
console.log('URL decoded:', decodeURIComponent(encodedModalUrl));
console.log('Decode/encode match?', decodeURIComponent(encodedModalUrl) === modalUrl ? '✅ SIM' : '❌ NÃO');

console.log('\n📋 PRÓXIMOS PASSOS:');
console.log('1. Verifique se a URL no Facebook Developers é exatamente:', modalUrl);
console.log('2. Limpe o cache do navegador completamente');
console.log('3. Teste em uma aba anônima');
console.log('4. Verifique se o Facebook App está em modo "Live"');
console.log('5. Aguarde 5-10 minutos após qualquer alteração no Facebook Developers');