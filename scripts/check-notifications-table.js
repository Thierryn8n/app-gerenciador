const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkNotificationsTable() {
  console.log('🔍 Verificando tabela de notificações...')
  
  try {
    // Verificar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notificacoes')
    
    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError)
      return
    }
    
    if (!tables || tables.length === 0) {
      console.log('❌ Tabela "notificacoes" não existe!')
      console.log('💡 Execute o script 03-create-notifications.sql para criar a tabela')
      return
    }
    
    console.log('✅ Tabela "notificacoes" existe')
    
    // Verificar estrutura da tabela
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'notificacoes')
      .order('ordinal_position')
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError)
    } else {
      console.log('📋 Estrutura da tabela:')
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`)
      })
    }
    
    // Testar consulta básica
    console.log('\n🧪 Testando consulta básica...')
    const { data: notifications, error: queryError } = await supabase
      .from('notificacoes')
      .select('*')
      .limit(5)
    
    if (queryError) {
      console.error('❌ Erro na consulta:', queryError)
    } else {
      console.log(`✅ Consulta bem-sucedida. Encontradas ${notifications.length} notificações`)
      if (notifications.length > 0) {
        console.log('📄 Exemplo de notificação:')
        console.log(JSON.stringify(notifications[0], null, 2))
      }
    }
    
    // Verificar políticas RLS
    console.log('\n🔒 Verificando políticas RLS...')
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, permissive, roles, cmd, qual')
      .eq('tablename', 'notificacoes')
    
    if (policiesError) {
      console.error('❌ Erro ao verificar políticas:', policiesError)
    } else {
      console.log(`✅ Encontradas ${policies.length} políticas RLS`)
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkNotificationsTable()
  .then(() => {
    console.log('\n✅ Verificação concluída')
    process.exit(0)
  })
  .catch(error => {
    console.error('❌ Erro na verificação:', error)
    process.exit(1)
  })