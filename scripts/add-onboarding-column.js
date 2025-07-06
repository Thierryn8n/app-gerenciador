const { createClient } = require('@supabase/supabase-js')

// Ler variáveis de ambiente do arquivo .env.local
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const envVars = {}
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=')
      if (key && value) {
        envVars[key.trim()] = value.trim()
      }
    })
    
    return envVars
  } catch (error) {
    console.error('Erro ao ler .env.local:', error.message)
    return {}
  }
}

const env = loadEnvFile()

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Variáveis de ambiente não encontradas!')
  process.exit(1)
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
)

async function addOnboardingColumn() {
  try {
    console.log('🔧 Verificando estrutura da tabela usuarios...')
    
    // Primeiro, vamos verificar se a coluna já existe
    const { data: usuarios, error: selectError } = await supabase
      .from('usuarios')
      .select('*')
      .limit(1)
    
    if (selectError) {
      console.log('❌ Erro ao acessar tabela usuarios:', selectError.message)
      return
    }
    
    // Verificar se a coluna onboarding_completed já existe
    const hasOnboardingColumn = usuarios && usuarios.length > 0 && 
      usuarios[0].hasOwnProperty('onboarding_completed')
    
    if (hasOnboardingColumn) {
      console.log('✅ Coluna onboarding_completed já existe!')
    } else {
      console.log('⚠️ Coluna onboarding_completed não existe. Você precisa adicioná-la manualmente no Supabase.')
      console.log('📝 Execute este SQL no editor do Supabase:')
      console.log('ALTER TABLE usuarios ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;')
    }
    
    // Verificar usuários existentes
    const { data: todosUsuarios, error: allUsersError } = await supabase
      .from('usuarios')
      .select('id, nome, email')
    
    if (allUsersError) {
      console.log('⚠️ Erro ao buscar usuários:', allUsersError.message)
    } else {
      console.log('📊 Usuários na base:')
      todosUsuarios.forEach(user => {
        console.log(`- ${user.nome} (${user.email})`)
      })
      
      // Verificar se há clientes
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('usuario_id')
      
      if (!clientesError && clientes) {
        console.log(`📈 Total de clientes: ${clientes.length}`)
        const usuariosComClientes = [...new Set(clientes.map(c => c.usuario_id))]
        console.log(`👥 Usuários com clientes: ${usuariosComClientes.length}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error)
  }
}

addOnboardingColumn()