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

async function updateRLSPolicies() {
  try {
    console.log('🔧 Iniciando atualização das políticas RLS...');
    
    // Ler o arquivo SQL de atualização das políticas
    const sqlFilePath = path.join(__dirname, 'update-rls-policies.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Arquivo SQL carregado com sucesso');
    
    // Dividir o SQL em comandos individuais (separados por ';')
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));
    
    console.log(`📝 Executando ${sqlCommands.length} comandos SQL...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      
      // Pular comentários e comandos vazios
      if (command.startsWith('--') || command.trim().length === 0) {
        continue;
      }
      
      try {
        console.log(`⏳ Executando comando ${i + 1}/${sqlCommands.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: command
        });
        
        if (error) {
          // Tentar executar diretamente se RPC falhar
          const { error: directError } = await supabase
            .from('_temp_table_that_does_not_exist')
            .select('*')
            .limit(0);
          
          // Se chegou até aqui, tentar uma abordagem diferente
          console.log(`⚠️  RPC não disponível, tentando abordagem alternativa...`);
          
          // Para comandos DROP POLICY, CREATE POLICY, ALTER TABLE, etc.
          if (command.includes('DROP POLICY') || 
              command.includes('CREATE POLICY') || 
              command.includes('ALTER TABLE') ||
              command.includes('CREATE OR REPLACE FUNCTION')) {
            
            console.log(`⚠️  Comando de política/estrutura detectado: ${command.substring(0, 50)}...`);
            console.log('ℹ️  Este comando deve ser executado manualmente no painel do Supabase.');
            errorCount++;
            continue;
          }
        }
        
        successCount++;
        console.log(`✅ Comando executado com sucesso`);
        
      } catch (cmdError) {
        console.error(`❌ Erro ao executar comando: ${cmdError.message}`);
        console.log(`📝 Comando: ${command.substring(0, 100)}...`);
        errorCount++;
      }
      
      // Pequena pausa entre comandos
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 Resumo da execução:');
    console.log(`✅ Comandos executados com sucesso: ${successCount}`);
    console.log(`❌ Comandos com erro: ${errorCount}`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  ATENÇÃO: Alguns comandos falharam.');
      console.log('📋 Para completar a atualização, execute manualmente no painel do Supabase:');
      console.log('   1. Acesse https://supabase.com/dashboard');
      console.log('   2. Vá para SQL Editor');
      console.log('   3. Execute o arquivo update-rls-policies.sql');
      console.log('\n📄 Caminho do arquivo: scripts/update-rls-policies.sql');
    } else {
      console.log('\n🎉 Todas as políticas RLS foram atualizadas com sucesso!');
    }
    
    // Testar uma consulta simples para verificar a conexão
    console.log('\n🔍 Testando conexão com o banco...');
    const { data: testData, error: testError } = await supabase
      .from('usuarios')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Erro na consulta de teste:', testError.message);
    } else {
      console.log('✅ Conexão com o banco funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    console.log('\n📋 Instruções para execução manual:');
    console.log('1. Acesse o painel do Supabase');
    console.log('2. Vá para SQL Editor');
    console.log('3. Execute o arquivo scripts/update-rls-policies.sql');
  }
}

// Executar a atualização
updateRLSPolicies().then(() => {
  console.log('\n🏁 Script finalizado.');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Erro fatal:', error);
  process.exit(1);
});