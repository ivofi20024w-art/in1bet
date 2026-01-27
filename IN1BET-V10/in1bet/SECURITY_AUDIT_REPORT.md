# Relatório de Auditoria de Segurança - IN1BET

**Data:** 27/01/2026  
**Versão:** 1.0  
**Auditor:** Replit Agent

---

## Sumário Executivo

Este relatório documenta a auditoria de segurança completa realizada na plataforma IN1BET, identificando vulnerabilidades, correções implementadas e recomendações.

---

## 1. VULNERABILIDADES CORRIGIDAS

### 1.1 CRÍTICA: Webhook OndaPay - Bypass de Verificação de Assinatura

**Arquivo:** `server/modules/payments/ondapay/ondapay.routes.ts`  
**Status:** ✅ CORRIGIDO

**Problema Original:**
A função `verifyWebhookSignature()` sempre retornava `{valid: true}` independentemente da assinatura, permitindo que atacantes forjassem webhooks para creditar dinheiro em contas.

**Correção Implementada:**
- Verificação HMAC-SHA256 obrigatória
- Rejeição de webhooks sem `ONDAPAY_WEBHOOK_SECRET` configurado
- Uso de `crypto.timingSafeEqual()` para comparação segura
- Validação do raw body da requisição

### 1.2 Adição de Interface Admin para OndaPay

**Arquivos:** 
- `server/modules/admin/admin.routes.ts`
- `client/src/pages/admin/Settings.tsx`

**Funcionalidades:**
- Visualização de status das credenciais (sem expor valores)
- Atualização segura de Client ID, Client Secret, Webhook Secret e URL
- Teste de conexão com a API OndaPay
- Audit log de todas as alterações

---

## 2. VULNERABILIDADES IDENTIFICADAS

### 2.1 Sistema de Pagamentos

| Severidade | Problema | Arquivo | Status |
|------------|----------|---------|--------|
| ✅ CORRIGIDO | Webhook signature bypass | ondapay.routes.ts | Corrigido |
| MEDIUM | Idempotência depende de referenceId determinístico | ondapay.service.ts | Parcialmente mitigado |

### 2.2 Sistema de Autenticação

| Severidade | Problema | Arquivo | Recomendação |
|------------|----------|---------|--------------|
| HIGH | Refresh tokens não são rotacionados | auth.service.ts | Implementar rotação a cada uso |
| HIGH | Tokens não revogados em troca de senha | auth.service.ts | Invalidar todos tokens em password reset |
| HIGH | Logs sensíveis (prefixos de tokens) | auth.middleware.ts | Remover logs de tokens/senhas |
| MEDIUM | JWT_SECRET sem validação de força | auth.service.ts | Adicionar verificação de entropia mínima |
| MEDIUM | Sem detecção de device/IP para sessões | auth.service.ts | Comparar device info em uso de refresh |

### 2.3 Jogos da Casa

| Severidade | Problema | Jogo | Recomendação |
|------------|----------|------|--------------|
| MEDIUM | Sem endpoint de reveal de server seed | Mines | Adicionar endpoint para verificação pós-jogo |
| MEDIUM | Client seed gerado pelo servidor | Double | Permitir usuário definir client seed |
| MEDIUM | Server seed não armazenado em bet record | Plinko | Persistir seeds para auditoria |
| LOW | Sem pre-commit de serverSeedHash | Todos | Publicar hash antes da aposta |

### 2.4 Carteira e Transações

| Severidade | Problema | Arquivo | Recomendação |
|------------|----------|---------|--------------|
| HIGH | Bonus operations sem transação atômica | bonus.service.ts | Usar db.transaction com row locks |
| HIGH | consumeRollover sem lock | bonus.service.ts | Adicionar SELECT FOR UPDATE |
| MEDIUM | convertBonusToReal sem atomicidade | bonus.service.ts | Transação única para update + insert |
| MEDIUM | clearLockedBalance sem idempotência | wallet.service.ts | Verificar referenceId único |

### 2.5 Painel Admin

| Severidade | Problema | Arquivo | Recomendação |
|------------|----------|---------|--------------|
| MEDIUM | Sem dual-approval para saques grandes | admin.routes.ts | Adicionar segunda aprovação para valores altos |
| MEDIUM | Admin pode aprovar próprio saque | admin.routes.ts | Verificar adminId != withdrawal.userId |
| LOW | Audit logs incompletos para bônus | admin.routes.ts | Adicionar logs para CRUD de bônus |

### 2.6 API e Validação

| Severidade | Problema | Localização | Recomendação |
|------------|----------|-------------|--------------|
| LOW | Rate limiting pode ser melhorado | rateLimit.ts | Adicionar lockout progressivo |
| LOW | Alguns endpoints sem validação Zod | Diversos | Padronizar validação com Zod |

---

## 3. PRIORIZAÇÃO DE CORREÇÕES

### Imediatas (Sprint Atual)
1. ✅ Corrigir webhook OndaPay (FEITO)
2. Implementar rotação de refresh tokens
3. Revogar tokens em password reset
4. Adicionar transações atômicas em bonus.service.ts

### Próximo Sprint
5. Remover logs sensíveis de auth
6. Implementar dual-approval para saques grandes
7. Adicionar endpoint de reveal para provably fair

### Backlog
8. Melhorar sistema de rate limiting
9. Padronizar validação com Zod
10. Pre-commit de serverSeedHash

---

## 4. CONFIGURAÇÃO DO ONDAPAY

### Variáveis de Ambiente Necessárias
```
ONDAPAY_CLIENT_ID=seu_client_id
ONDAPAY_CLIENT_SECRET=seu_client_secret
ONDAPAY_WEBHOOK_SECRET=seu_webhook_secret
ONDAPAY_WEBHOOK_URL=https://seu-dominio.com/api/webhook/ondapay
```

### Como Atualizar via Admin Panel
1. Acesse `/admin/settings`
2. Na seção "Configurações OndaPay (PIX)"
3. Preencha os campos que deseja atualizar
4. Clique em "Salvar Configurações"
5. Use "Testar Conexão" para verificar

---

## 5. MÉTRICAS DE SEGURANÇA

- **Vulnerabilidades Críticas:** 1 encontrada, 1 corrigida
- **Vulnerabilidades Altas:** 5 identificadas, 0 corrigidas (requerem mais desenvolvimento)
- **Vulnerabilidades Médias:** 8 identificadas
- **Vulnerabilidades Baixas:** 4 identificadas

---

## 6. CONCLUSÃO

A plataforma passou por uma auditoria completa de segurança. A vulnerabilidade crítica no sistema de pagamentos (webhook bypass) foi corrigida. Foram identificadas vulnerabilidades adicionais que requerem atenção, especialmente no sistema de autenticação e bônus.

Recomenda-se priorizar as correções listadas como "Imediatas" antes de operar em produção com dinheiro real.
