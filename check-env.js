// Script para verificar configurações de ambiente
const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configurações de ambiente...');
console.log('=' .repeat(50));

// Verificar arquivo .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    console.log('✅ Arquivo .env.local encontrado');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Procurar por NEXT_PUBLIC_APP_URL
    const lines = envContent.split('\n');
    const appUrlLine = lines.find(line => line.startsWith('NEXT_PUBLIC_APP_URL='));
    
    if (appUrlLine) {
        const url = appUrlLine.split('=')[1];
        console.log(`📍 NEXT_PUBLIC_APP_URL: ${url}`);
        
        // Verificar se é a URL correta
        if (url === 'https://app-gerenciador-pi.vercel.app') {
            console.log('✅ URL está correta!');
        } else {
            console.log('❌ URL pode estar incorreta!');
            console.log('   Esperado: https://app-gerenciador-pi.vercel.app');
            console.log(`   Atual: ${url}`);
        }
    } else {
        console.log('❌ NEXT_PUBLIC_APP_URL não encontrado no .env.local');
    }
    
    // Verificar Facebook App ID
    const fbAppIdLine = lines.find(line => line.startsWith('NEXT_PUBLIC_FACEBOOK_APP_ID='));
    if (fbAppIdLine) {
        const appId = fbAppIdLine.split('=')[1];
        console.log(`📱 Facebook App ID: ${appId}`);
    } else {
        console.log('⚠️  NEXT_PUBLIC_FACEBOOK_APP_ID não encontrado');
    }
    
} else {
    console.log('❌ Arquivo .env.local não encontrado!');
}

console.log('\n🔧 Verificando arquivos de configuração...');

// Verificar next.config.mjs
const nextConfigPath = path.join(__dirname, 'next.config.mjs');
if (fs.existsSync(nextConfigPath)) {
    console.log('✅ next.config.mjs encontrado');
} else {
    console.log('⚠️  next.config.mjs não encontrado');
}

// Verificar package.json
const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
    console.log('✅ package.json encontrado');
    const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`📦 Nome do projeto: ${packageContent.name}`);
    console.log(`🏷️  Versão: ${packageContent.version}`);
} else {
    console.log('❌ package.json não encontrado!');
}

console.log('\n🌐 URLs de teste:');
console.log('Modal: https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback');
console.log('Callback: https://app-gerenciador-pi.vercel.app/api/auth/facebook/callback');
console.log('Facebook App: [verificar manualmente no Facebook Developers]');

console.log('\n📋 Próximos passos:');
console.log('1. Abra o arquivo debug-facebook-oauth.html no navegador');
console.log('2. Verifique as configurações no Facebook Developers Console');
console.log('3. Limpe o cache do navegador');
console.log('4. Teste a conexão Meta novamente');

console.log('\n' + '=' .repeat(50));
console.log('✅ Verificação concluída!');