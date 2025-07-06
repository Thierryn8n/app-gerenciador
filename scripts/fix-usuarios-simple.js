const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente do arquivo .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  envLines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
}

// Configuração do cliente Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testUserInsertion() {
  try {
    console.log('🔧 Testando inserção na tabela usuarios...');
    
    // Primeiro, vamos verificar a estrutura da tabela
    console.log('📋 Verificando estrutura da tabela usuarios...');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Erro ao acessar tabela usuarios:', tableError.message);
      return;
    }
    
    console.log('✅ Tabela usuarios acessível');
    
    // Tentar inserir um usuário de teste
    const testUser = {
      id: '123e4567-e89b-12d3-a456-426614174000', // UUID de teste
      nome: 'Teste Usuario',
      email: 'teste@exemplo.com',
      status: 'ativo'
    };
    
    console.log('🧪 Tentando inserir usuário de teste...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('usuarios')
      .insert([testUser])
      .select();
    
    if (insertError) {
      console.error('❌ Erro na inserção:', insertError.message);
      console.log('📝 Detalhes do erro:', insertError);
      
      // Verificar se é um problema de RLS
      if (insertError.message.includes('row-level security') || 
          insertError.message.includes('policy') ||
          insertError.message.includes('permission denied')) {
        console.log('\n🔒 Problema detectado: Row Level Security (RLS)');
        console.log('📋 Soluções possíveis:');
        console.log('1. Execute o arquivo fix-usuarios-policies.sql no painel do Supabase');
        console.log('2. Ou desabilite temporariamente o RLS para testes');
        console.log('\n📄 Caminho do arquivo: scripts/fix-usuarios-policies.sql');
        console.log('🌐 Painel do Supabase: https://supabase.com/dashboard');
      }
    } else {
      console.log('✅ Inserção realizada com sucesso!');
      console.log('📊 Dados inseridos:', insertData);
      
      // Limpar o usuário de teste
      console.log('🧹 Removendo usuário de teste...');
      const { error: deleteError } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', testUser.id);
      
      if (deleteError) {
        console.log('⚠️  Erro ao remover usuário de teste:', deleteError.message);
      } else {
        console.log('✅ Usuário de teste removido');
      }
    }
    
    // Verificar políticas RLS
    console.log('\n🔍 Verificando políticas RLS...');
    
    // Esta consulta pode falhar se não tivermos permissões adequadas
    try {
      const { data: policies, error: policiesError } = await supabase
        .rpc('get_table_policies', { table_name: 'usuarios' });
      
      if (policiesError) {
        console.log('⚠️  Não foi possível verificar políticas RLS automaticamente');
        console.log('📋 Verifique manualmente no painel do Supabase');
      } else {
        console.log('📋 Políticas encontradas:', policies);
      }
    } catch (rpcError) {
      console.log('⚠️  RPC para verificar políticas não disponível');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar o teste
testUserInsertion().then(() => {
  console.log('\n🏁 Teste finalizado.');
  console.log('\n📋 Próximos passos se houver erros:');
  console.log('1. Acesse https://supabase.com/dashboard');
  console.log('2. Vá para SQL Editor');
  console.log('3. Execute o arquivo scripts/fix-usuarios-policies.sql');
  console.log('4. Teste novamente o registro no aplicativo');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});