const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Ler variáveis de ambiente do arquivo .env.local
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const envLines = envContent.split('\n')

let supabaseUrl = ''
let supabaseKey = ''

envLines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = line.split('=')[1]
  }
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    supabaseKey = line.split('=')[1]
  }
})

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOnboardingStatus() {
  try {
    console.log('🔍 Verificando status do onboarding...')
    console.log('')
    
    // Buscar todos os usuários
    const { data: usuarios, error: usuariosError } = await supabase
      .from('usuarios')
      .select('*')
    
    if (usuariosError) {
      console.error('❌ Erro ao buscar usuários:', usuariosError)
      return
    }
    
    console.log(`👥 Total de usuários: ${usuarios.length}`)
    console.log('')
    
    for (const usuario of usuarios) {
      console.log(`📋 Usuário: ${usuario.nome} (${usuario.email})`)
      console.log(`   ID: ${usuario.id}`)
      
      // Verificar clientes do usuário
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', usuario.id)
      
      if (clientesError) {
        console.log(`   ❌ Erro ao buscar clientes: ${clientesError.message}`)
      } else {
        console.log(`   📊 Clientes: ${clientes.length}`)
        if (clientes.length > 0) {
          clientes.forEach(cliente => {
            console.log(`      - ${cliente.nome} (${cliente.email})`)
          })
        }
        
        // Determinar se deve mostrar onboarding
        const shouldShowOnboarding = clientes.length === 0
        console.log(`   🎯 Deve mostrar onboarding: ${shouldShowOnboarding ? 'SIM' : 'NÃO'}`)
      }
      console.log('')
    }
    
    // Verificar estrutura da tabela usuarios
    console.log('🔧 Verificando estrutura da tabela usuarios...')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'usuarios' })
    
    if (columnsError) {
      console.log('   ⚠️  Não foi possível verificar colunas (função não existe)')
    } else {
      console.log('   ✅ Colunas da tabela usuarios:')
      columns.forEach(col => {
        console.log(`      - ${col.column_name} (${col.data_type})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

checkOnboardingStatus()