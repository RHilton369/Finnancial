require('dotenv').config({ path: '../../.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function smokeTest() {
  console.log('🚀 Iniciando Teste de Persistência (Smoke Test)...');
  
  try {
    // 1. Verificar conexão
    await prisma.$connect();
    console.log('✅ Conexão com MongoDB Atlas estabelecida.');

    // 2. Tentar buscar um usuário (ou criar um mock se necessário, mas vamos apenas listar)
    const userCount = await prisma.users.count();
    console.log(`📊 Total de usuários no sistema: ${userCount}`);

    // 3. Teste de Transação Interativa
    console.log('🧪 Testando Transação Interativa...');
    await prisma.$transaction(async (tx) => {
        // Criar uma conta temporária
        const tempAccount = await tx.accounts.create({
            data: {
                user_id: '60d5ec123456789012345678', // ID fake mas válido formato
                name: 'TEST_SMOKE_PERSISTENCE',
                type: 'checking',
                balance: 100
            }
        });
        console.log(`   - Conta temporária criada: ${tempAccount.id}`);
        
        // Deletar a conta (rollback implícito se falhar antes)
        await tx.accounts.delete({ where: { id: tempAccount.id } });
        console.log('   - Conta temporária removida com sucesso.');
    });

    console.log('✨ Teste de Persistência Concluído com SUCESSO!');
  } catch (error) {
    console.error('❌ FALHA no Teste de Persistência:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

smokeTest();
