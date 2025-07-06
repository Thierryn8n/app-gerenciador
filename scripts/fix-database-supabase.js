const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// Configuração do cliente Supabase
const supabaseUrl = 'https://dlpzubtissziephnesfq.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRscHp1YnRpc3N6aWVwaG5lc2ZxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY2MDg4OSwiZXhwIjoyMDY3MjM2ODg5fQ.wSbKYrWC2gq3Fy0ZbjhkmYW8L9OVFzytbNzqRoUyaps';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql) {
  try {
    console.log(`Executando: ${sql.substring(0, 50)}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    // Se a função exec_sql não existir, vamos executar os comandos individualmente
    if (error.message.includes('function exec_sql')) {
      console.log('Função exec_sql não encontrada, executando comandos individuais...');
      return await executeIndividualCommands(sql);
    }
    throw error;
  }
}

async function executeIndividualCommands(sql) {
  // Comandos específicos para corrigir a tabela usuarios
  const commands = [
    // 1. Desabilitar RLS temporariamente
    { type: 'rpc', name: 'exec', params: { sql: 'ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY' } },
    
    // 2. Remover políticas existentes
    { type: 'rpc', name: 'exec', params: { sql: 'DROP POLICY IF EXISTS "usuarios_insert_policy" ON usuarios' } },
    { type: 'rpc', name: 'exec', params: { sql: 'DROP POLICY IF EXISTS "usuarios_select_policy" ON usuarios' } },
    { type: 'rpc', name: 'exec', params: { sql: 'DROP POLICY IF EXISTS "usuarios_update_policy" ON usuarios' } },
    
    // 3. Verificar se a tabela existe e tem a estrutura correta
    { type: 'query', table: 'usuarios', action: 'select', params: { select: 'id', limit: 1 } },
  ];
  
  for (const command of commands) {
    try {
      if (command.type === 'rpc') {
        const { error } = await supabase.rpc(command.name, command.params);
        if (error && !error.message.includes('does not exist')) {
          console.warn(`Aviso: ${error.message}`);
        }
      } else if (command.type === 'query') {
        const { error } = await supabase.from(command.table)[command.action](command.params.select).limit(command.params.limit);
        if (error) {
          console.log('Tabela usuarios precisa ser recriada.');
        }
      }
    } catch (error) {
      console.warn(`Aviso ao executar comando: ${error.message}`);
    }
  }
}

async function createUsersTableDirectly() {
  try {
    console.log('🔧 Criando/corrigindo tabela usuarios diretamente...');
    
    // Usar SQL direto via RPC se disponível
    const createTableSQL = `
      -- Remover tabela existente se houver
      DROP TABLE IF EXISTS usuarios CASCADE;
      
      -- Criar tabela com estrutura correta
      CREATE TABLE usuarios (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        nome VARCHAR(255) NOT NULL,
        empresa VARCHAR(255),
        telefone VARCHAR(20),
        avatar_url TEXT,
        status VARCHAR(50) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'pausado')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      -- Habilitar RLS
      ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
      
      -- Criar políticas
      CREATE POLICY "usuarios_insert_policy" ON usuarios
        FOR INSERT TO authenticated
        WITH CHECK (auth.uid() = id);
        
      CREATE POLICY "usuarios_select_policy" ON usuarios
        FOR SELECT TO authenticated
        USING (auth.uid() = id);
        
      CREATE POLICY "usuarios_update_policy" ON usuarios
        FOR UPDATE TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);
    `;
    
    // Tentar executar via RPC
    try {
      const { error } = await supabase.rpc('exec', { sql: createTableSQL });
      if (error) {
        throw error;
      }
      console.log('✅ Tabela usuarios criada via RPC!');
    } catch (rpcError) {
      console.log('RPC não disponível, usando método alternativo...');
      
      // Método alternativo: verificar se conseguimos acessar a tabela
      const { error: testError } = await supabase.from('usuarios').select('id').limit(1);
      
      if (testError) {
        console.log('❌ Não foi possível corrigir a tabela automaticamente.');
        console.log('📋 Por favor, execute o seguinte SQL manualmente no painel do Supabase:');
        console.log('\n' + createTableSQL);
        return false;
      } else {
        console.log('✅ Tabela usuarios já existe e está acessível!');
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar tabela:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🔗 Conectando ao Supabase...');
    
    // Testar conexão
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);
    
    if (error && error.message.includes('relation "usuarios" does not exist')) {
      console.log('📋 Tabela usuarios não existe, criando...');
    } else if (error) {
      console.log('⚠️  Problema com a tabela usuarios:', error.message);
    } else {
      console.log('✅ Conectado ao Supabase!');
    }
    
    // Tentar corrigir a tabela
    const success = await createUsersTableDirectly();
    
    if (success) {
      console.log('\n🎉 Correção concluída!');
      console.log('Agora você pode testar o registro de usuário.');
    } else {
      console.log('\n📋 Execute o SQL manualmente no painel do Supabase.');
      console.log('Acesse: https://app.supabase.com/project/dlpzubtissziephnesfq/sql');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
    console.log('\n📋 Instruções manuais:');
    console.log('1. Acesse: https://app.supabase.com/project/dlpzubtissziephnesfq/sql');
    console.log('2. Execute o conteúdo do arquivo scripts/fix-usuarios-table.sql');
    process.exit(1);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { createUsersTableDirectly };