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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testBasicInsertion() {
  try {
    console.log('🔧 Testando inserção básica na tabela usuarios...');
    
    // Verificar estrutura da tabela
    console.log('📋 Verificando colunas disponíveis...');
    
    // Tentar uma consulta simples primeiro
    const { data: existingUsers, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ Erro ao consultar tabela usuarios:', selectError.message);
      return;
    }
    
    console.log('✅ Tabela usuarios acessível');
    console.log('📊 Estrutura detectada:', existingUsers.length > 0 ? Object.keys(existingUsers[0]) : 'Tabela vazia');
    
    // Teste 1: Inserção com apenas campos obrigatórios
    console.log('\n🧪 Teste 1: Inserção com campos básicos...');
    
    const basicUser = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      nome: 'Teste Usuario Basico',
      email: 'teste.basico@exemplo.com'
    };
    
    const { data: basicData, error: basicError } = await supabase
      .from('usuarios')
      .insert([basicUser])
      .select();
    
    if (basicError) {
      console.error('❌ Erro na inserção básica:', basicError.message);
      console.log('📝 Detalhes:', basicError);
    } else {
      console.log('✅ Inserção básica bem-sucedida!');
      console.log('📊 Dados:', basicData);
      
      // Limpar
      await supabase.from('usuarios').delete().eq('id', basicUser.id);
      console.log('🧹 Usuário de teste removido');
    }
    
    // Teste 2: Inserção com mais campos (sem status)
    console.log('\n🧪 Teste 2: Inserção com mais campos...');
    
    const extendedUser = {
      id: '123e4567-e89b-12d3-a456-426614174002',
      nome: 'Teste Usuario Estendido',
      email: 'teste.estendido@exemplo.com',
      empresa: 'Empresa Teste',
      telefone: '(11) 99999-9999'
    };
    
    const { data: extendedData, error: extendedError } = await supabase
      .from('usuarios')
      .insert([extendedUser])
      .select();
    
    if (extendedError) {
      console.error('❌ Erro na inserção estendida:', extendedError.message);
      console.log('📝 Detalhes:', extendedError);
    } else {
      console.log('✅ Inserção estendida bem-sucedida!');
      console.log('📊 Dados:', extendedData);
      
      // Limpar
      await supabase.from('usuarios').delete().eq('id', extendedUser.id);
      console.log('🧹 Usuário de teste removido');
    }
    
    // Teste 3: Verificar se a coluna status existe
    console.log('\n🧪 Teste 3: Verificando coluna status...');
    
    const userWithStatus = {
      id: '123e4567-e89b-12d3-a456-426614174003',
      nome: 'Teste Usuario Status',
      email: 'teste.status@exemplo.com',
      status: 'ativo'
    };
    
    const { data: statusData, error: statusError } = await supabase
      .from('usuarios')
      .insert([userWithStatus])
      .select();
    
    if (statusError) {
      console.error('❌ Erro com coluna status:', statusError.message);
      console.log('📝 Detalhes:', statusError);
      
      if (statusError.message.includes('status')) {
        console.log('\n🔧 SOLUÇÃO: A coluna status não existe ou tem problema.');
        console.log('📋 Execute o script: scripts/fix-usuarios-structure.sql');
        console.log('🌐 No painel do Supabase: https://supabase.com/dashboard');
      }
    } else {
      console.log('✅ Inserção com status bem-sucedida!');
      console.log('📊 Dados:', statusData);
      
      // Limpar
      await supabase.from('usuarios').delete().eq('id', userWithStatus.id);
      console.log('🧹 Usuário de teste removido');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar os testes
testBasicInsertion().then(() => {
  console.log('\n🏁 Testes finalizados.');
  console.log('\n📋 Se houver erros, execute:');
  console.log('1. scripts/fix-usuarios-structure.sql no painel do Supabase');
  console.log('2. Teste novamente o registro no aplicativo');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});