# RELATÓRIO DE AUDITORIA TÉCNICA - IN1Bet
**Data:** 07/01/2026  
**Versão:** 1.0  
**Status Final:** ⚠️ APROVADO COM RESSALVAS

---

## 1. Visão Geral do Projeto

**Nome:** IN1Bet - Plataforma de Casino e Apostas Esportivas  
**Mercado:** Brasil  
**Moeda:** Real Brasileiro (BRL)  
**Idioma:** Português (pt-BR)  
**Licenciamento:** Planejado para operação regulada

### Stack Tecnológico
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Express.js + TypeScript + ESM
- **Banco de Dados:** PostgreSQL (Neon em produção)
- **ORM:** Drizzle ORM
- **Autenticação:** JWT (Access + Refresh Tokens)
- **Pagamentos:** OndaPay (PIX)
- **Jogos Externos:** PlayFivers API

---

## 2. Arquitetura Atual

### 2.1 Padrão Arquitetural
- **Monolito Modular** - Backend organizado em módulos independentes
- **API REST** - Comunicação frontend-backend
- **Schema Compartilhado** - `shared/schema.ts` usado por frontend e backend

### 2.2 Estrutura de Módulos Backend
```
server/modules/
├── admin/          # Painel administrativo
├── affiliates/     # Sistema de afiliados
├── auth/           # Autenticação JWT
├── betting/        # Apostas
├── bonus/          # Sistema de bônus
├── games/          # Jogos originais (Crash, Double, Mines, Plinko)
├── history/        # Histórico de transações
├── kyc/            # Verificação KYC
├── levels/         # Sistema de níveis
├── missions/       # Sistema de missões
├── notifications/  # Notificações push
├── payments/       # Pagamentos (OndaPay)
├── playfivers/     # Integração PlayFivers
├── rakeback/       # Sistema de rakeback
├── security/       # Segurança e auditoria
├── settings/       # Configurações
├── support/        # Suporte (Chat + Tickets)
├── users/          # Gerenciamento de usuários
├── wallet/         # Carteira
└── withdrawals/    # Saques
```

### 2.3 Avaliação: ✅ BOM
- Separação clara de responsabilidades
- Módulos independentes e testáveis
- Schema centralizado evita duplicação

---

## 3. Mapa de Pastas e Arquivos

```
in1bet/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   ├── hooks/          # Hooks customizados
│   │   ├── lib/            # Utilitários e configurações
│   │   └── pages/          # Páginas da aplicação
│   └── index.html
├── server/                 # Backend Express
│   ├── modules/            # Módulos de negócio
│   ├── middleware/         # Middlewares (rate limit)
│   ├── utils/              # Utilitários
│   ├── db.ts              # Conexão banco
│   ├── routes.ts          # Registro de rotas
│   └── index.ts           # Entry point
├── shared/                 # Código compartilhado
│   └── schema.ts          # Schema Drizzle + tipos
├── migrations/            # Migrações SQL
└── script/                # Scripts de build/seed
```

**Total de Arquivos TypeScript:** ~150  
**Linhas de Código Estimadas:** ~30.000+

---

## 4. Fluxo Frontend → Backend → Banco

### 4.1 Fluxo de Autenticação
```
[Login Page] → POST /api/auth/login 
    → [auth.service] → bcrypt.compare(password)
    → [storage] → getUserByEmail()
    → [auth.middleware] → generateAccessToken() + generateRefreshToken()
    → [refreshTokens table] → INSERT token
    → Response { accessToken, refreshToken, user }
```

### 4.2 Fluxo de Depósito PIX
```
[Wallet Modal] → POST /api/payments/pix/create
    → [authMiddleware] → verificar JWT
    → [ondapay.service] → createPixDeposit()
    → [OndaPay API] → gerar QR Code
    → [pixDeposits table] → INSERT status=PENDING
    → Response { qrCode, qrCodeBase64 }

[OndaPay Webhook] → POST /api/webhook/ondapay
    → [ondapay.routes] → verificar assinatura HMAC
    → [ondapay.service] → processWebhook()
    → [pixDeposits] → UPDATE status=PAID
    → [wallet.service] → processBalanceChange()
    → [wallets] → UPDATE balance
    → [transactions] → INSERT DEPOSIT
```

### 4.3 Fluxo de Jogo Original (Mines)
```
[Mines Page] → POST /api/games/mines/start
    → [authMiddleware] → verificar JWT
    → [mines.service] → startGame()
    → [wallet.service] → processBalanceChange(BET)
    → [minesGames table] → INSERT game
    → Response { gameId, grid, serverSeedHash }

[Reveal Cell] → POST /api/games/mines/reveal
    → [mines.service] → revealCell()
    → [minesGames] → UPDATE revealed
    → Response { cell, isMine, multiplier }

[Cashout] → POST /api/games/mines/cashout
    → [mines.service] → cashout()
    → [wallet.service] → processBalanceChange(WIN)
    → [minesGames] → UPDATE status=WON
    → Response { winnings, serverSeed }
```

---

## 5. Auditoria de Segurança

### 5.1 Vulnerabilidades Críticas

| ID | Severidade | Arquivo | Descrição | Status |
|----|-----------|---------|-----------|--------|
| SEC-001 | 🔴 CRÍTICO | .env (shared) | JWT_SECRET exposto como env var em vez de secret | PENDENTE |
| SEC-002 | 🟡 MÉDIO | client/src/lib/mockData.ts | Dados mock ainda em uso em várias páginas | PENDENTE |

### 5.2 Detalhes das Vulnerabilidades

#### SEC-001: JWT_SECRET Exposto
- **Arquivo:** Variável de ambiente `shared`
- **Valor Atual:** `11c0909ada...` (hash completo exposto)
- **Impacto:** Qualquer pessoa com acesso ao ambiente pode forjar tokens JWT
- **Solução:** Mover JWT_SECRET para `Secrets` no Replit, não em variáveis de ambiente

#### SEC-002: Mock Data em Produção
- **Arquivos Afetados:**
  - `client/src/pages/Sports.tsx`
  - `client/src/pages/sports/Prematch.tsx`
  - `client/src/pages/sports/Results.tsx`
  - `client/src/pages/sports/MyBets.tsx`
  - `client/src/pages/sports/MatchDetail.tsx`
  - `client/src/pages/LiveBetting.tsx`
  - `client/src/pages/Game.tsx`
  - `client/src/pages/profile/Security.tsx`
  - `client/src/pages/Originals.tsx`
  - `client/src/components/layout/Sidebar.tsx`
  - `client/src/components/layout/Header.tsx`
  - `client/src/components/betting/BetSlip.tsx`
- **Impacto:** Usuários verão dados falsos em produção
- **Solução:** Conectar todas as páginas às APIs reais ou aguardar integração de odds esportivas

### 5.3 Controles de Segurança Implementados ✅

| Controle | Status | Detalhes |
|----------|--------|----------|
| Hashing de Senha | ✅ | bcrypt com 10 rounds |
| Rate Limiting | ✅ | 100 req/15min geral, 10/15min auth, 3/min PIX |
| Validação CPF | ✅ | Algoritmo oficial implementado |
| JWT Expiry | ✅ | Access: 15min, Refresh: 7 dias |
| Webhook HMAC | ✅ | Verificação de assinatura OndaPay |
| XSS Prevention | ✅ | React auto-escaping |
| CORS | ✅ | Configurado para mesmo domínio |
| SQL Injection | ✅ | Drizzle ORM parametrizado |

### 5.4 Secrets Configurados
```
✅ SESSION_SECRET
✅ ONDAPAY_CLIENT_ID
✅ ONDAPAY_CLIENT_SECRET
✅ DATABASE_URL (dev)
⚠️ JWT_SECRET (deveria estar aqui, está em env var)
❌ VAPID_PUBLIC_KEY (não configurado)
❌ VAPID_PRIVATE_KEY (não configurado)
❌ PLAYFIVERS_AGENT_TOKEN (não configurado)
❌ PLAYFIVERS_SECRET_KEY (não configurado)
```

---

## 6. Auditoria de Performance

### 6.1 Backend

| Aspecto | Status | Notas |
|---------|--------|-------|
| Connection Pooling | ✅ | Neon PostgreSQL gerencia |
| Rate Limiting | ✅ | express-rate-limit |
| Caching | ⚠️ | Token OndaPay cacheado, mas jogos/providers não |
| Async/Await | ✅ | Todas operações assíncronas |
| Error Handling | ✅ | try/catch global + middleware |
| Build | ✅ | esbuild para produção |

### 6.2 Frontend

| Aspecto | Status | Notas |
|---------|--------|-------|
| Code Splitting | ⚠️ | Não implementado |
| Image Optimization | ⚠️ | Imagens externas sem lazy loading |
| Bundle Size | ⚠️ | Não otimizado |
| React Query | ✅ | Cache e deduplicação |
| Loader | ✅ | Skeleton/loading states |

### 6.3 Recomendações de Performance
1. Implementar cache Redis para jogos PlayFivers
2. Adicionar lazy loading para rotas React
3. Configurar CDN para assets estáticos
4. Adicionar índices no banco para queries frequentes

---

## 7. Auditoria de Banco de Dados

### 7.1 Tabelas Principais (Total: 35+)

| Tabela | Propósito | Índices |
|--------|-----------|---------|
| users | Usuários | email, cpf (unique) |
| wallets | Carteiras | userId (unique) |
| refreshTokens | Tokens JWT | token (unique) |
| pixDeposits | Depósitos PIX | externalId (unique) |
| pixWithdrawals | Saques PIX | userId |
| transactions | Ledger financeiro | userId, type |
| bets | Apostas | userId |
| minesGames | Jogos Mines | userId |
| bonuses | Templates de bônus | type |
| userBonuses | Bônus aplicados | userId |
| affiliates | Afiliados | userId |
| affiliateLinks | Links de afiliados | code (unique) |
| supportChats | Chats de suporte | userId |
| supportTickets | Tickets de suporte | ticketNumber (unique) |
| notifications | Notificações | type |
| missionTemplates | Templates de missões | type |

### 7.2 Migrações
- **Sistema:** Drizzle-kit push
- **Arquivo:** `migrations/0000_clear_guardsmen.sql`
- **Status:** ✅ Única migração, schema completo

### 7.3 Problemas Identificados

| ID | Severidade | Descrição |
|----|-----------|-----------|
| DB-001 | 🟡 Médio | Falta índices compostos para queries complexas |
| DB-002 | 🟡 Médio | Sem soft delete em algumas tabelas |

---

## 8. Auditoria de APIs

### 8.1 Rotas Implementadas

| Módulo | Endpoints | Autenticação |
|--------|-----------|--------------|
| /api/auth | 6 | Público/Privado |
| /api/users | 3 | JWT |
| /api/wallet | 4 | JWT |
| /api/payments | 2 | JWT |
| /api/withdrawals | 3 | JWT |
| /api/bonus | 4 | JWT |
| /api/games/* | 12+ | JWT |
| /api/affiliate | 8 | JWT |
| /api/support | 10+ | JWT |
| /api/admin | 20+ | JWT + Admin |
| /api/playfivers | 5 | JWT |
| /api/notifications | 8 | JWT |
| /api/missions | 5 | JWT |
| /api/rakeback | 4 | JWT |
| /api/levels | 4 | JWT |

### 8.2 Health Check
```
GET /api/health
Response: { status: "ok", timestamp: "...", version: "1.0.0" }
```
✅ Implementado

### 8.3 APIs Externas

| API | Status | Configuração |
|-----|--------|--------------|
| OndaPay PIX | ✅ | Secrets configurados |
| PlayFivers | ⚠️ | Tokens não configurados |
| Web Push | ⚠️ | VAPID não configurado |

---

## 9. Auditoria de Autenticação

### 9.1 Fluxo JWT

```
[Registro] → bcrypt.hash(password) → INSERT users
           → INSERT wallets
           → generateAccessToken(15min)
           → generateRefreshToken(7d) → INSERT refreshTokens

[Login] → bcrypt.compare() → generateAccessToken + generateRefreshToken

[Refresh] → verifyRefreshToken() → DELETE old token
          → generateAccessToken + generateRefreshToken → INSERT new token

[Logout] → DELETE refreshToken
```

### 9.2 Middleware de Autenticação

**Arquivo:** `server/modules/auth/auth.middleware.ts`

```typescript
// authMiddleware - verifica Bearer token
// optionalAuthMiddleware - não exige, mas anexa user se presente
// adminCheck - verifica isAdmin na tabela users
```

### 9.3 Avaliação: ✅ BOM
- JWT com expiração curta (15min access)
- Refresh tokens armazenados no banco para revogação
- Logout invalida refresh token

---

## 10. Auditoria de Pagamentos / Jogos / Afiliados

### 10.1 Pagamentos (OndaPay PIX)

| Aspecto | Status |
|---------|--------|
| Depósitos PIX | ✅ Funcional |
| Webhook HMAC | ✅ Verificação de assinatura |
| Status Flow | ✅ PENDING → PAID |
| Idempotência | ✅ external_id único |
| Saque Automático | ✅ Implementado |
| Limite Mínimo | ✅ R$ 20 saque, R$ 1 depósito |

### 10.2 Jogos Originais

| Jogo | Backend | Frontend | Provably Fair |
|------|---------|----------|---------------|
| Crash | ✅ | ✅ | ✅ HMAC-SHA256 |
| Double | ✅ | ✅ | ✅ HMAC-SHA256 |
| Mines | ✅ | ✅ | ✅ HMAC-SHA256 |
| Plinko | ✅ | ✅ | ✅ HMAC-SHA256 |

### 10.3 Sistema de Afiliados

| Funcionalidade | Status |
|----------------|--------|
| Registro de afiliados | ✅ |
| Links personalizados | ✅ |
| Tracking de conversões | ✅ |
| Anti-fraude (CPF/IP) | ✅ |
| Pagamentos via PIX | ✅ |
| Painel do afiliado | ✅ |
| Painel admin | ✅ |

---

## 11. Verificação de Mocks / Dados Falsos

### 11.1 Arquivo de Mock Data

**Arquivo:** `client/src/lib/mockData.ts` (206 linhas)

**Conteúdo:**
- `USER` - Dados de usuário falso
- `CASINO_MENU` - Menu (usado para navegação - aceitável)
- `SPORTS_MENU` - Menu (usado para navegação - aceitável)
- `PROFILE_MENU_ITEMS` - Menu (usado para navegação - aceitável)
- `ORIGINALS_GAMES` - Lista de jogos (usado para navegação - aceitável)
- `PROVIDERS` - Lista de providers
- `CASINO_GAMES` - Jogos mock
- `SPORTS_MATCHES` - Partidas esportivas mock 🔴
- `PROMOTIONS` - Promoções mock
- `VIP_LEVELS` - Níveis VIP (configuração - aceitável)
- `BET_HISTORY` - Histórico de apostas mock 🔴
- `FAQS` - FAQs (conteúdo estático - aceitável)
- `TICKETS` - Tickets mock 🔴
- `LOGIN_HISTORY` - Histórico de login mock 🔴
- `AFFILIATE_DATA` - Dados de afiliados mock 🔴

### 11.2 Páginas Usando Mocks em Produção

| Página | Mock Usado | Impacto |
|--------|------------|---------|
| Sports.tsx | SPORTS_MATCHES | 🔴 Alto |
| Prematch.tsx | SPORTS_MATCHES | 🔴 Alto |
| Results.tsx | Mock interno | 🔴 Alto |
| MyBets.tsx | BET_HISTORY | 🔴 Alto |
| MatchDetail.tsx | SPORTS_MATCHES | 🔴 Alto |
| LiveBetting.tsx | SPORTS_MATCHES | 🔴 Alto |
| Game.tsx | CASINO_GAMES | 🟡 Médio |
| profile/Security.tsx | LOGIN_HISTORY | 🟡 Médio |
| BetSlip.tsx | MOCK_BETS | 🔴 Alto |

### 11.3 Páginas Já Integradas ✅

| Página | API Real |
|--------|----------|
| Home.tsx | /api/playfivers/games ✅ |
| Casino.tsx | /api/playfivers/games ✅ |
| LiveCasino.tsx | /api/playfivers/games ✅ |
| Promotions.tsx | /api/bonus/available ✅ |
| Plinko.tsx | /api/games/plinko ✅ |
| Crash.tsx | /api/games/crash ✅ |
| Double.tsx | /api/games/double ✅ |
| Mines.tsx | /api/games/mines ✅ |
| History.tsx | /api/history ✅ |
| Affiliates.tsx | /api/affiliate ✅ |
| Missions.tsx | /api/missions ✅ |
| Rakeback.tsx | /api/rakeback ✅ |
| Levels.tsx | /api/levels ✅ |
| Wallet.tsx | /api/wallet ✅ |

---

## 12. Lista de Riscos Críticos

| # | Risco | Impacto | Probabilidade | Mitigação |
|---|-------|---------|---------------|-----------|
| 1 | JWT_SECRET exposto | Crítico | Alta | Mover para Secrets |
| 2 | VAPID não configurado | Médio | N/A | Push não funciona |
| 3 | PlayFivers não configurado | Alto | N/A | Jogos externos não funcionam |
| 4 | Mock data em produção | Alto | Certa | Usuários verão dados falsos |
| 5 | Sem backup automatizado | Alto | Média | Configurar backup Neon |
| 6 | Sem monitoramento | Médio | Média | Adicionar APM |
| 7 | Console.logs em produção | Baixo | Certa | Podem expor dados |

---

## 13. Lista de Melhorias Recomendadas

### 13.1 Prioridade Alta (Antes do Go-Live)

1. **Mover JWT_SECRET para Secrets**
   - Arquivo: `.env` → `Secrets`
   - Ação: Regenerar secret em produção

2. **Configurar VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   ```
   - Adicionar: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY

3. **Configurar PlayFivers**
   - Adicionar: PLAYFIVERS_AGENT_TOKEN, PLAYFIVERS_SECRET_KEY, PLAYFIVERS_AGENT_CODE, PLAYFIVERS_AGENT_SECRET

4. **Remover/Substituir Mocks de Esportes**
   - Ou: Desabilitar seção de esportes temporariamente
   - Ou: Integrar API de odds real

### 13.2 Prioridade Média

5. Implementar code splitting no frontend
6. Adicionar cache Redis para jogos PlayFivers
7. Configurar backup automático no Neon
8. Adicionar monitoramento (Sentry/DataDog)
9. Implementar logs estruturados (Winston/Pino)
10. Adicionar testes automatizados

### 13.3 Prioridade Baixa

11. Remover console.logs em produção
12. Otimizar bundle size
13. Adicionar CDN para assets
14. Implementar WebSocket para jogos real-time

---

## 14. Checklist de Produção

### 14.1 Segurança
- [ ] JWT_SECRET em Secrets
- [x] Hashing bcrypt
- [x] Rate limiting
- [x] Validação de entrada (Zod)
- [x] HTTPS (Replit/Neon)
- [x] Webhook HMAC
- [ ] VAPID configurado

### 14.2 Infraestrutura
- [x] Database conectado
- [x] Build script funcional
- [x] Health check endpoint
- [ ] Backup configurado
- [ ] Monitoramento
- [ ] Logs persistentes

### 14.3 Integrações
- [x] OndaPay funcional
- [ ] PlayFivers configurado
- [ ] Push notifications

### 14.4 Código
- [x] Sem erros TypeScript críticos
- [x] Rotas funcionando
- [ ] Mocks removidos de produção
- [x] Tratamento de erros

---

## 15. Status Final do Projeto

# ⚠️ APROVADO COM RESSALVAS

### Justificativa

O projeto IN1Bet possui uma **arquitetura sólida** e **implementações de segurança adequadas** para a maioria dos casos. O backend está bem estruturado com módulos independentes, autenticação JWT robusta, e integrações reais com OndaPay para pagamentos PIX.

### Bloqueadores para Produção

1. **JWT_SECRET deve ser movido para Secrets** - Crítico
2. **Configurar variáveis PlayFivers** - Se jogos externos são necessários
3. **Decidir sobre seção de Esportes** - Mocks não podem ir para produção

### Aprovado Para:
- ✅ Jogos Originais (Crash, Double, Mines, Plinko)
- ✅ Casino (com PlayFivers configurado)
- ✅ Sistema de Pagamentos PIX
- ✅ Sistema de Afiliados
- ✅ Sistema de Bônus
- ✅ Sistema de Níveis/Missões
- ✅ Suporte (Chat + Tickets)
- ✅ Painel Admin

### Não Aprovado Para:
- ❌ Apostas Esportivas (mock data)
- ❌ Push Notifications (VAPID não configurado)

---

**Assinatura Digital:**  
Auditoria realizada por Replit Agent  
Data: 07/01/2026
