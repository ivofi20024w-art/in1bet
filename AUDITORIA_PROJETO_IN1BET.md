# AUDITORIA COMPLETA - IN1BET
**Data:** 08/01/2026  
**Versão:** 2.0  
**Status:** ✅ OPERACIONAL

---

## 1. RESUMO EXECUTIVO

O projeto IN1Bet é uma plataforma de casino e apostas com:
- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + TypeScript
- **Banco de Dados:** PostgreSQL (Neon Cloud)
- **Pagamentos:** OndaPay PIX
- **Jogos Externos:** PlayFivers API

### Status de Deploy
- **VPS Hostinger:** 69.62.95.236
- **Domínio:** in1bet.com.br (pendente configuração DNS)
- **IP Estático:** ✅ Disponível para whitelist API

---

## 2. PROBLEMAS IDENTIFICADOS E CORRIGIDOS

### 2.1 Corrigidos Nesta Sessão (Ambiente Replit)

| Problema | Status | Solução |
|----------|--------|---------|
| Tabelas não existiam no banco Neon | ✅ CORRIGIDO | Executado `drizzle-kit push` |
| Aviso trust proxy no rate limiter | ✅ CORRIGIDO | Adicionado `app.set('trust proxy', 1)` |

**Nota:** O VPS (69.62.95.236) requer configuração separada - execute `npx drizzle-kit push` diretamente no servidor.

### 2.2 Pendentes para VPS

Execute no VPS para sincronizar o banco:
```bash
cd /var/www/in1bet
npx drizzle-kit push
pm2 restart in1bet
```

---

## 3. ARQUITETURA DO SISTEMA

### 3.1 Estrutura de Módulos

```
server/modules/
├── admin/          # Painel administrativo
├── affiliates/     # Sistema de afiliados
├── auth/           # Autenticação JWT
├── betting/        # Apostas
├── bonus/          # Sistema de bônus
├── chat/           # Chat em tempo real
├── games/          # Jogos originais (Crash, Double, Mines, Plinko)
├── history/        # Histórico de transações
├── jackpot/        # Sistema de jackpot progressivo
├── kyc/            # Verificação KYC
├── levels/         # Sistema de níveis/VIP
├── missions/       # Missões e desafios
├── notifications/  # Notificações push
├── payments/       # Pagamentos PIX (OndaPay)
├── playfivers/     # Integração jogos externos
├── rakeback/       # Sistema de rakeback
├── security/       # Segurança e auditoria
├── settings/       # Configurações
├── support/        # Suporte (Chat + Tickets)
├── users/          # Gerenciamento de usuários
├── wallet/         # Carteira
└── withdrawals/    # Saques PIX
```

### 3.2 Tabelas do Banco de Dados

| Módulo | Tabelas |
|--------|---------|
| Usuários | users, wallets, sessions |
| Auth | refresh_tokens |
| Pagamentos | pix_deposits, pix_withdrawals, transactions |
| Jogos | mines_games, crash_bets, double_bets, plinko_games |
| Jackpot | jackpot_config, jackpot_wins, jackpot_contributions |
| Bônus | bonuses, user_bonuses |
| Afiliados | affiliates, affiliate_links, affiliate_commissions |
| Suporte | support_chats, support_messages, support_tickets |
| Notificações | notifications, push_subscriptions |
| Missões | mission_templates, user_missions, user_streaks |

---

## 4. CONFIGURAÇÃO DE AMBIENTE

### 4.1 Variáveis Necessárias (.env)

```env
# Banco de Dados
DATABASE_URL=postgresql://...

# Aplicação
NODE_ENV=production
PORT=3000

# Autenticação
JWT_SECRET=<64 bytes hex>
SESSION_SECRET=<32 bytes hex>

# OndaPay (PIX)
ONDAPAY_CLIENT_ID=
ONDAPAY_CLIENT_SECRET=
ONDAPAY_WEBHOOK_URL=https://in1bet.com.br/api/webhook/ondapay
ONDAPAY_WEBHOOK_SECRET=

# PlayFivers (Jogos)
PLAYFIVERS_AGENT_TOKEN=
PLAYFIVERS_SECRET_KEY=
PLAYFIVERS_AGENT_CODE=
PLAYFIVERS_AGENT_SECRET=

# Push Notifications (VAPID)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:email@exemplo.com
```

### 4.2 Status de Configuração

| Variável | Status |
|----------|--------|
| DATABASE_URL | ✅ Configurado (Neon) |
| JWT_SECRET | ✅ Configurado |
| SESSION_SECRET | ✅ Configurado |
| ONDAPAY_* | ⚠️ Pendente credenciais |
| PLAYFIVERS_* | ⚠️ Pendente credenciais |
| VAPID_* | ✅ Configurado |

---

## 5. SEGURANÇA

### 5.1 Controles Implementados

| Controle | Status | Detalhes |
|----------|--------|----------|
| Hashing de Senha | ✅ | bcrypt com 10 rounds |
| JWT com Expiração | ✅ | Access: 15min, Refresh: 7 dias |
| Rate Limiting | ✅ | 100 req/15min geral |
| Validação de Entrada | ✅ | Zod em todas as rotas |
| SQL Injection | ✅ | Drizzle ORM parametrizado |
| XSS Prevention | ✅ | React auto-escaping |
| CORS | ✅ | Configurado |
| Webhook HMAC | ✅ | Verificação OndaPay |

### 5.2 Rate Limiting Atual

| Endpoint | Limite |
|----------|--------|
| Geral (/api/*) | 100 req/15 min |
| Login | 10 req/15 min |
| Registro | 5 req/hora |
| PIX | 3 req/min |
| Saque | 2 req/min |
| Webhook | 50 req/seg |

---

## 6. JOGOS ORIGINAIS

### 6.1 Status dos Jogos

| Jogo | Backend | Frontend | Provably Fair |
|------|---------|----------|---------------|
| Crash | ✅ | ✅ | ✅ HMAC-SHA256 |
| Double | ✅ | ✅ | ✅ HMAC-SHA256 |
| Mines | ✅ | ✅ | ✅ HMAC-SHA256 |
| Plinko | ✅ | ✅ | ✅ HMAC-SHA256 |

### 6.2 Game Loops

Os jogos Crash e Double rodam continuamente em loops automáticos:
- **Crash:** Cria nova rodada a cada crash
- **Double:** Cria nova rodada a cada resultado

Isso é comportamento **normal e esperado**.

---

## 7. INTEGRAÇÕES EXTERNAS

### 7.1 OndaPay (PIX)

| Funcionalidade | Status |
|----------------|--------|
| Depósitos PIX | ✅ Implementado |
| Webhook de Confirmação | ✅ Implementado |
| Saques Automáticos | ✅ Implementado |
| Verificação HMAC | ✅ Implementado |

**Pendente:** Configurar credenciais reais

### 7.2 PlayFivers (Jogos Externos)

| Funcionalidade | Status |
|----------------|--------|
| Listagem de Jogos | ✅ Implementado |
| Lançamento de Jogo | ✅ Implementado |
| Callback de Transações | ✅ Implementado |

**Pendente:** Configurar credenciais de agente

---

## 8. SISTEMA DE AFILIADOS

| Funcionalidade | Status |
|----------------|--------|
| Registro de Afiliados | ✅ |
| Links Personalizados | ✅ |
| Tracking de Conversões | ✅ |
| Comissões Automáticas | ✅ |
| Anti-fraude (CPF/IP) | ✅ |
| Painel do Afiliado | ✅ |
| Painel Admin | ✅ |
| Pagamentos PIX | ✅ |

---

## 9. SISTEMA DE SUPORTE

| Funcionalidade | Status |
|----------------|--------|
| Chat em Tempo Real | ✅ WebSocket |
| Tickets de Suporte | ✅ |
| Departamentos | ✅ |
| SLA Automático | ✅ |
| Triagem Automática | ✅ |
| Histórico de Conversas | ✅ |

---

## 10. PROBLEMAS CONHECIDOS

### 10.1 Mock Data em Produção

As seguintes páginas ainda usam dados simulados:

| Página | Impacto |
|--------|---------|
| Sports.tsx | 🔴 Alto - Odds falsas |
| Prematch.tsx | 🔴 Alto - Partidas falsas |
| LiveBetting.tsx | 🔴 Alto - Apostas ao vivo falsas |
| MyBets.tsx | 🟡 Médio - Histórico falso |

**Recomendação:** Desabilitar seção de esportes ou integrar API de odds real.

### 10.2 VAPID Keys

Push notifications estão desabilitadas no Replit (não afeta VPS).

---

## 11. CHECKLIST DE PRODUÇÃO

### 11.1 Infraestrutura VPS

- [x] IP Estático: 69.62.95.236
- [x] Node.js 20 instalado
- [x] PM2 configurado
- [x] Nginx configurado
- [x] Banco Neon conectado
- [ ] SSL (aguardando domínio)
- [ ] Domínio DNS configurado

### 11.2 Configurações

- [x] DATABASE_URL
- [x] JWT_SECRET
- [x] SESSION_SECRET
- [x] VAPID keys
- [ ] ONDAPAY credenciais
- [ ] PLAYFIVERS credenciais

### 11.3 Banco de Dados

- [x] Schema criado
- [x] Tabelas migradas
- [ ] Backup automático (configurar no Neon)

---

## 12. PRÓXIMOS PASSOS

### Prioridade Alta

1. **Configurar domínio in1bet.com.br**
   - Criar registro A: @ → 69.62.95.236
   - Instalar SSL: `certbot --nginx -d in1bet.com.br`

2. **Sincronizar banco no VPS**
   ```bash
   cd /var/www/in1bet
   npx drizzle-kit push
   pm2 restart in1bet
   ```

3. **Configurar credenciais OndaPay**
   - Obter Client ID e Secret no painel OndaPay
   - Configurar webhook URL no painel

4. **Configurar credenciais PlayFivers**
   - Obter tokens de agente
   - Adicionar ao .env

### Prioridade Média

5. Configurar backup automático no Neon
6. Adicionar monitoramento (UptimeRobot)
7. Desabilitar seção de esportes (mock data)

---

## 13. COMANDOS ÚTEIS

### VPS

```bash
# Logs
pm2 logs in1bet

# Reiniciar
pm2 restart in1bet

# Status
pm2 status

# Sincronizar banco
npx drizzle-kit push

# SSL
certbot --nginx -d in1bet.com.br
```

### Desenvolvimento

```bash
# Rodar local
npm run dev

# Build
npm run build

# Push schema
npm run db:push
```

---

**Auditoria realizada por Replit Agent**  
**Data:** 08/01/2026
