// Script para testar se o Facebook SDK está funcionando
// Execute este script no console do navegador após carregar a página

function testFacebookSDK() {
  console.log('🔍 Testando Facebook SDK...');
  console.log('');

  // 1. Verificar se o FB está disponível
  if (typeof window.FB === 'undefined') {
    console.error('❌ Facebook SDK não foi carregado!');
    console.log('Verifique se:');
    console.log('- O componente FacebookSDK está sendo renderizado');
    console.log('- A variável NEXT_PUBLIC_FACEBOOK_APP_ID está configurada');
    console.log('- Não há bloqueadores de anúncios interferindo');
    return;
  }

  console.log('✅ Facebook SDK carregado com sucesso!');
  console.log('');

  // 2. Verificar status de login
  window.FB.getLoginStatus(function(response) {
    console.log('📋 Status de Login:', response.status);
    
    if (response.status === 'connected') {
      console.log('✅ Usuário conectado!');
      console.log('- User ID:', response.authResponse.userID);
      console.log('- Access Token:', response.authResponse.accessToken.substring(0, 20) + '...');
      
      // Testar API do usuário
      window.FB.api('/me', function(userResponse) {
        console.log('👤 Dados do usuário:', userResponse);
      });
      
    } else if (response.status === 'not_authorized') {
      console.log('⚠️ Usuário logado no Facebook mas não autorizou o app');
    } else {
      console.log('ℹ️ Usuário não está logado no Facebook');
    }
  });

  // 3. Verificar App Events
  console.log('📊 Testando App Events...');
  try {
    window.FB.AppEvents.logEvent('test_event', {
      test_parameter: 'test_value'
    });
    console.log('✅ App Events funcionando!');
  } catch (error) {
    console.error('❌ Erro no App Events:', error);
  }

  console.log('');
  console.log('🎉 Teste do Facebook SDK concluído!');
  console.log('');
  console.log('💡 Para testar login, execute: FB.login(function(response) { console.log(response); });');
}

// Aguardar o SDK carregar antes de testar
if (typeof window.FB !== 'undefined') {
  testFacebookSDK();
} else {
  console.log('⏳ Aguardando Facebook SDK carregar...');
  
  // Aguardar até 10 segundos pelo SDK
  let attempts = 0;
  const maxAttempts = 20;
  
  const checkSDK = setInterval(() => {
    attempts++;
    
    if (typeof window.FB !== 'undefined') {
      clearInterval(checkSDK);
      testFacebookSDK();
    } else if (attempts >= maxAttempts) {
      clearInterval(checkSDK);
      console.error('❌ Timeout: Facebook SDK não carregou em 10 segundos');
      console.log('Verifique a configuração e tente novamente.');
    }
  }, 500);
}