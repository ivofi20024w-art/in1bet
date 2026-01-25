import { db } from "../server/db";
import { users, wallets } from "../shared/schema";
import bcrypt from "bcrypt";
import { sql } from "drizzle-orm";

const TEST_PASSWORD = "Teste@123";

const TEST_USERS = [
  { name: "João Silva", email: "joao@teste.com", cpf: "123.456.789-09", isAdmin: false },
  { name: "Maria Santos", email: "maria@teste.com", cpf: "987.654.321-00", isAdmin: false },
  { name: "Pedro Costa", email: "pedro@teste.com", cpf: "111.222.333-96", isAdmin: false },
  { name: "Ana Oliveira", email: "ana@teste.com", cpf: "444.555.666-72", isAdmin: false },
  { name: "Carlos Souza", email: "carlos@teste.com", cpf: "777.888.999-10", isAdmin: false },
];

const ADMIN_USERS = [
  { name: "Admin Master", email: "admin@in1bet.com", cpf: "000.111.222-33", isAdmin: true },
  { name: "Admin Suporte", email: "suporte@in1bet.com", cpf: "000.222.333-44", isAdmin: true },
  { name: "Admin Financeiro", email: "financeiro@in1bet.com", cpf: "000.333.444-55", isAdmin: true },
  { name: "Admin Jogos", email: "jogos@in1bet.com", cpf: "000.444.555-66", isAdmin: true },
  { name: "Admin Marketing", email: "marketing@in1bet.com", cpf: "000.555.666-77", isAdmin: true },
];

async function seedUsers() {
  console.log("Iniciando criação de usuários de teste...\n");

  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  const allUsers = [...TEST_USERS, ...ADMIN_USERS];

  for (const userData of allUsers) {
    try {
      const existingUser = await db.query.users.findFirst({
        where: sql`email = ${userData.email}`,
      });

      if (existingUser) {
        console.log(`⚠️  Usuário ${userData.email} já existe, pulando...`);
        continue;
      }

      const [newUser] = await db
        .insert(users)
        .values({
          name: userData.name,
          email: userData.email,
          cpf: userData.cpf,
          password: hashedPassword,
          isAdmin: userData.isAdmin,
          adminRole: userData.isAdmin ? "ADMIN" : "USER",
          isVerified: true,
          kycStatus: "approved",
          vipLevel: userData.isAdmin ? "diamond" : "bronze",
          level: userData.isAdmin ? 50 : 1,
          xp: userData.isAdmin ? 50000 : 0,
        })
        .returning();

      await db.insert(wallets).values({
        userId: newUser.id,
        available: userData.isAdmin ? "10000.00" : "100.00",
        locked: "0.00",
      });

      const tipo = userData.isAdmin ? "👑 ADMIN" : "👤 USER";
      console.log(`✅ ${tipo} criado: ${userData.email}`);
    } catch (error: any) {
      console.error(`❌ Erro ao criar ${userData.email}:`, error.message);
    }
  }

  console.log("\n========================================");
  console.log("CREDENCIAIS DE ACESSO");
  console.log("========================================");
  console.log(`Senha para todos: ${TEST_PASSWORD}`);
  console.log("----------------------------------------\n");
  
  console.log("👤 USUÁRIOS NORMAIS:");
  for (const user of TEST_USERS) {
    console.log(`   Email: ${user.email}`);
  }
  
  console.log("\n👑 ADMINISTRADORES:");
  for (const admin of ADMIN_USERS) {
    console.log(`   Email: ${admin.email}`);
  }
  
  console.log("\n========================================\n");
  process.exit(0);
}

seedUsers().catch((err) => {
  console.error("Erro fatal:", err);
  process.exit(1);
});
