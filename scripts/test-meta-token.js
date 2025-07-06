// Usando fetch nativo do Node.js (disponível a partir da versão 18)

// Token de acesso fornecido pelo usuário
const ACCESS_TOKEN = 'EAATZBY2bS5kgBPPsNN4vTySTlRc3SUhrkWr1A7nuFI4LZACgSIOBRNLJ0FmfpRtST2la18oD84MNvdM6a1VbM35P1ipyVqcohFIotN3sLTGCVqRQRECWZCPQZCy0NUcLgi098THhfpYZB6lvZBrRBtUSyZC5f694GdIgUZCGAVwINfq6ZCOzEZAHYCVPFwvX1PAoJGqKouldYJ';

async function testMetaToken() {
  console.log('🔍 Testando token de acesso da Meta Marketing API...');
  console.log('Token:', ACCESS_TOKEN.substring(0, 20) + '...');
  console.log('');

  try {
    // 1. Testar informações básicas do usuário
    console.log('📋 1. Testando informações do usuário...');
    const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${ACCESS_TOKEN}`);
    const userData = await userResponse.json();
    
    if (userData.error) {
      console.error('❌ Erro ao buscar dados do usuário:', userData.error.message);
      return;
    }
    
    console.log('✅ Usuário:', userData.name || userData.id);
    console.log('');

    // 2. Testar permissões do token
    console.log('🔐 2. Verificando permissões do token...');
    const permissionsResponse = await fetch(`https://graph.facebook.com/v18.0/me/permissions?access_token=${ACCESS_TOKEN}`);
    const permissionsData = await permissionsResponse.json();
    
    if (permissionsData.error) {
      console.error('❌ Erro ao buscar permissões:', permissionsData.error.message);
    } else {
      console.log('✅ Permissões ativas:');
      permissionsData.data.forEach(permission => {
        if (permission.status === 'granted') {
          console.log(`   - ${permission.permission}`);
        }
      });
    }
    console.log('');

    // 3. Testar acesso às contas de anúncios
    console.log('📊 3. Buscando contas de anúncios...');
    const adAccountsResponse = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${ACCESS_TOKEN}`);
    const adAccountsData = await adAccountsResponse.json();
    
    if (adAccountsData.error) {
      console.error('❌ Erro ao buscar contas de anúncios:', adAccountsData.error.message);
    } else {
      console.log(`✅ Encontradas ${adAccountsData.data.length} conta(s) de anúncios:`);
      adAccountsData.data.forEach((account, index) => {
        console.log(`   ${index + 1}. ID: ${account.id} - Nome: ${account.name || 'Sem nome'}`);
      });
      
      // 4. Se houver contas, testar busca de campanhas na primeira conta
      if (adAccountsData.data.length > 0) {
        console.log('');
        console.log('🎯 4. Testando busca de campanhas na primeira conta...');
        const firstAccountId = adAccountsData.data[0].id;
        
        const campaignsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${firstAccountId}/campaigns?fields=id,name,status,objective&limit=5&access_token=${ACCESS_TOKEN}`
        );
        const campaignsData = await campaignsResponse.json();
        
        if (campaignsData.error) {
          console.error('❌ Erro ao buscar campanhas:', campaignsData.error.message);
        } else {
          console.log(`✅ Encontradas ${campaignsData.data.length} campanha(s):`);
          campaignsData.data.forEach((campaign, index) => {
            console.log(`   ${index + 1}. ${campaign.name} (${campaign.status}) - ${campaign.objective}`);
          });
        }
      }
    }
    
    console.log('');
    console.log('🎉 Teste concluído! O token parece estar funcionando corretamente.');
    console.log('');
    console.log('📝 Próximos passos:');
    console.log('1. Adicione este token ao arquivo .env.local como FACEBOOK_ACCESS_TOKEN');
    console.log('2. Configure o FACEBOOK_APP_ID e FACEBOOK_APP_SECRET');
    console.log('3. Teste a integração no seu aplicativo');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Executar o teste
testMetaToken();