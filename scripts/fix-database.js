const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuração da conexão com o banco
const client = new Client({
  connectionString: 'postgres://postgres.dlpzubtissziephnesfq:VrnFfpNx9Mx2OnBL@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function executeSQLFile(filePath) {
  try {
    console.log(`Executando ${filePath}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Dividir o SQL em comandos individuais
    const commands = sql.split(';').filter(cmd => cmd.trim().length > 0);
    
    for (const command of commands) {
      if (command.trim()) {
        console.log(`Executando: ${command.trim().substring(0, 50)}...`);
        await client.query(command);
      }
    }
    
    console.log(`✅ ${filePath} executado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao executar ${filePath}:`, error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🔗 Conectando ao banco de dados...');
    await client.connect();
    console.log('✅ Conectado com sucesso!');
    
    // Executar o script de correção
    await executeSQLFile(path.join(__dirname, 'fix-usuarios-table.sql'));
    
    console.log('\n🎉 Correção da tabela usuarios concluída!');
    console.log('Agora você pode testar o registro de usuário.');
    
  } catch (error) {
    console.error('❌ Erro durante a execução:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Conexão fechada.');
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { executeSQLFile };