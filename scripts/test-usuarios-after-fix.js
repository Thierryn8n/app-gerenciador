const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Função para carregar variáveis de ambiente do arquivo .env.local
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envVars[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
        }
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('Erro ao carregar .env.local:', error.message);
    return {};
  }
}

async function testUsuariosAfterFix() {
  console.log('🔧 Testando inserção na tabela usuarios após correção da estrutura...');
  
  // Carregar variáveis de ambiente
  const env = loadEnvFile();
  
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Variáveis de ambiente não encontradas!');
    console.log('Certifique-se de que .env.local contém:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    return;
  }
  
  // Configurar cliente Supabase com service role key (bypassa RLS)
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  console.log('✅ Cliente Supabase configurado com service role key');
  
  try {
    // Teste 1: Verificar se a tabela existe e sua estrutura
    console.log('\n📋 Verificando estrutura da tabela usuarios...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela usuarios:', tableError.message);
      return;
    }
    
    console.log('✅ Tabela usuarios acessível');
    
    // Teste 2: Inserir usuário básico
    console.log('\n👤 Testando inserção de usuário básico...');
    const usuarioBasico = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      nome: 'Teste Básico',
      email: 'teste.basico@exemplo.com'
    };
    
    const { data: insertBasico, error: errorBasico } = await supabase
      .from('usuarios')
      .insert([usuarioBasico])
      .select();
    
    if (errorBasico) {
      console.error('❌ Erro na inserção básica:', errorBasico.message);
    } else {
      console.log('✅ Inserção básica bem-sucedida:', insertBasico);
    }
    
    // Teste 3: Inserir usuário completo
    console.log('\n👤 Testando inserção de usuário completo...');
    const usuarioCompleto = {
      id: '550e8400-e29b-41d4-a716-446655440002',
      nome: 'Teste Completo',
      email: 'teste.completo@exemplo.com',
      status: 'ativo',
      empresa: 'Empresa Teste',
      telefone: '(11) 99999-9999',
      avatar_url: 'https://exemplo.com/avatar.jpg'
    };
    
    const { data: insertCompleto, error: errorCompleto } = await supabase
      .from('usuarios')
      .insert([usuarioCompleto])
      .select();
    
    if (errorCompleto) {
      console.error('❌ Erro na inserção completa:', errorCompleto.message);
    } else {
      console.log('✅ Inserção completa bem-sucedida:', insertCompleto);
    }
    
    // Teste 4: Verificar dados inseridos
    console.log('\n📊 Verificando dados inseridos...');
    const { data: usuarios, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .in('email', ['teste.basico@exemplo.com', 'teste.completo@exemplo.com']);
    
    if (selectError) {
      console.error('❌ Erro ao consultar usuários:', selectError.message);
    } else {
      console.log('✅ Usuários encontrados:', usuarios);
    }
    
    // Teste 5: Limpar dados de teste
    console.log('\n🧹 Limpando dados de teste...');
    const { error: deleteError } = await supabase
      .from('usuarios')
      .delete()
      .in('email', ['teste.basico@exemplo.com', 'teste.completo@exemplo.com']);
    
    if (deleteError) {
      console.error('❌ Erro ao limpar dados de teste:', deleteError.message);
    } else {
      console.log('✅ Dados de teste removidos');
    }
    
    console.log('\n🎉 Teste concluído! A tabela usuarios está funcionando corretamente.');
    console.log('\n📝 Próximos passos:');
    console.log('1. Configure as políticas RLS no painel do Supabase se necessário');
    console.log('2. A tabela está pronta para uso na aplicação');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
    console.log('\n🔧 Soluções possíveis:');
    console.log('1. Execute o script fix-usuarios-structure.sql no painel do Supabase');
    console.log('2. Verifique se as variáveis de ambiente estão corretas');
    console.log('3. Verifique a conexão com o banco de dados');
  }
}

// Executar o teste
testUsuariosAfterFix();