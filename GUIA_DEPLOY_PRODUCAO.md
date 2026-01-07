# GUIA DE DEPLOY E OPERAÇÃO EM PRODUÇÃO - IN1Bet
**Versão:** 1.0  
**Data:** 07/01/2026  
**Plataforma Alvo:** VPS Linux + Neon PostgreSQL

---

## 1. Requisitos da VPS

### 1.1 Especificações Mínimas

| Recurso | Mínimo | Recomendado |
|---------|--------|-------------|
| CPU | 2 vCPUs | 4 vCPUs |
| RAM | 4 GB | 8 GB |
| Disco | 40 GB SSD | 80 GB SSD |
| Rede | 100 Mbps | 1 Gbps |
| SO | Ubuntu 22.04 LTS | Ubuntu 24.04 LTS |

### 1.2 Provedores Recomendados
- DigitalOcean Droplet ($24-48/mês)
- Vultr High Frequency ($24-48/mês)
- Hetzner Cloud (€10-20/mês)
- AWS EC2 t3.medium

### 1.3 Portas Necessárias

| Porta | Serviço | Acesso |
|-------|---------|--------|
| 22 | SSH | Restrito (seu IP) |
| 80 | HTTP | Público |
| 443 | HTTPS | Público |
| 5432 | PostgreSQL | Apenas Neon (externo) |

---

## 2. Instalação do Ambiente (Linux)

### 2.1 Atualização do Sistema

```bash
# Conectar à VPS
ssh root@SEU_IP_VPS

# Atualizar sistema
apt update && apt upgrade -y

# Instalar dependências básicas
apt install -y curl wget git build-essential
```

### 2.2 Criar Usuário Não-Root

```bash
# Criar usuário para a aplicação
adduser in1bet
usermod -aG sudo in1bet

# Configurar SSH para o novo usuário
mkdir -p /home/in1bet/.ssh
cp ~/.ssh/authorized_keys /home/in1bet/.ssh/
chown -R in1bet:in1bet /home/in1bet/.ssh
chmod 700 /home/in1bet/.ssh
chmod 600 /home/in1bet/.ssh/authorized_keys

# Mudar para o novo usuário
su - in1bet
```

### 2.3 Instalar Node.js (via NVM)

```bash
# Instalar NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recarregar shell
source ~/.bashrc

# Instalar Node.js 20 LTS
nvm install 20
nvm use 20
nvm alias default 20

# Verificar instalação
node -v  # v20.x.x
npm -v   # 10.x.x
```

---

## 3. Instalação de Dependências

### 3.1 Dependências do Sistema

```bash
# Dependências para bcrypt e outras libs nativas
sudo apt install -y python3 make g++

# Nginx para proxy reverso
sudo apt install -y nginx

# Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

### 3.2 PM2 (Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Configurar PM2 para iniciar no boot
pm2 startup systemd
# Execute o comando que aparece na saída
```

---

## 4. Build do Projeto

### 4.1 Clonar Repositório

```bash
# Criar diretório da aplicação
mkdir -p /home/in1bet/apps
cd /home/in1bet/apps

# Clonar do Git (ou fazer upload via SCP)
git clone https://github.com/SEU_USUARIO/in1bet.git
cd in1bet

# Ou via SCP do seu computador local:
# scp -r ./in1bet in1bet@SEU_IP:/home/in1bet/apps/
```

### 4.2 Instalar Dependências

```bash
# Instalar dependências
npm ci --production=false

# Para ambiente de produção, algumas devDependencies são necessárias para build
npm install
```

### 4.3 Build de Produção

```bash
# Executar build
npm run build

# Isso irá:
# 1. Compilar TypeScript do servidor com esbuild
# 2. Compilar React com Vite
# 3. Gerar arquivos em /dist
```

### 4.4 Verificar Build

```bash
# Verificar se arquivos foram gerados
ls -la dist/

# Deve conter:
# - index.cjs (servidor compilado)
# - public/ (frontend compilado)
```

---

## 5. Configuração das Variáveis de Ambiente (.env)

### 5.1 Criar Arquivo .env

```bash
# Criar arquivo de ambiente
nano /home/in1bet/apps/in1bet/.env
```

### 5.2 Conteúdo do .env

```env
# ==========================================
# AMBIENTE
# ==========================================
NODE_ENV=production
PORT=5000

# ==========================================
# BANCO DE DADOS (Neon PostgreSQL)
# ==========================================
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

# ==========================================
# AUTENTICAÇÃO JWT
# ==========================================
# IMPORTANTE: Gerar novo secret para produção!
# Usar: openssl rand -hex 64
JWT_SECRET=SEU_JWT_SECRET_AQUI_64_BYTES_MINIMO

# ==========================================
# SESSÃO
# ==========================================
SESSION_SECRET=SEU_SESSION_SECRET_AQUI

# ==========================================
# ONDAPAY (PIX)
# ==========================================
ONDAPAY_CLIENT_ID=seu_client_id
ONDAPAY_CLIENT_SECRET=seu_client_secret
ONDAPAY_WEBHOOK_URL=https://in1bet.com/api/webhook/ondapay

# ==========================================
# PLAYFIVERS (Jogos Externos)
# ==========================================
PLAYFIVERS_AGENT_TOKEN=seu_agent_token
PLAYFIVERS_SECRET_KEY=seu_secret_key
PLAYFIVERS_AGENT_CODE=seu_agent_code
PLAYFIVERS_AGENT_SECRET=seu_agent_secret

# ==========================================
# WEB PUSH (VAPID)
# ==========================================
# Gerar com: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
VAPID_SUBJECT=mailto:contato@in1bet.com
```

### 5.3 Gerar Secrets Seguros

```bash
# Gerar JWT_SECRET
openssl rand -hex 64

# Gerar SESSION_SECRET
openssl rand -hex 32

# Gerar VAPID keys
npx web-push generate-vapid-keys
```

### 5.4 Proteger o Arquivo

```bash
# Definir permissões restritas
chmod 600 /home/in1bet/apps/in1bet/.env
```

---

## 6. Configuração de Banco de Dados

### 6.1 Neon PostgreSQL

O projeto usa **Neon PostgreSQL** como banco de dados gerenciado. 

**Console Neon:** https://console.neon.tech

### 6.2 Criar Projeto no Neon

1. Acessar https://console.neon.tech
2. Criar novo projeto "in1bet-production"
3. Selecionar região mais próxima (us-east-1 ou sa-east-1)
4. Copiar connection string

### 6.3 Configurar Connection String

```env
# Formato Neon
DATABASE_URL=postgresql://USER:PASSWORD@ep-XXX.REGION.aws.neon.tech/neondb?sslmode=require
```

### 6.4 Executar Migrações

```bash
cd /home/in1bet/apps/in1bet

# Aplicar schema ao banco
npm run db:push

# Verificar se tabelas foram criadas
# (Usar console Neon ou psql)
```

### 6.5 Seed de Dados Iniciais (Opcional)

```bash
# Criar contas de teste (apenas desenvolvimento)
npm run seed:test

# Ou criar admin manualmente via SQL:
# INSERT INTO users (name, email, cpf, password, is_admin, admin_role) VALUES (...)
```

---

## 7. Configuração de APIs Externas

### 7.1 OndaPay (PIX)

**Painel:** https://app.ondapay.app

1. Criar conta em ondapay.app
2. Obter credenciais em Configurações > API
3. Configurar webhook URL: `https://in1bet.com/api/webhook/ondapay`
4. Habilitar notificações de pagamento

**Teste de Webhook:**
```bash
curl -X POST https://in1bet.com/api/health
# Deve retornar: {"status":"ok",...}
```

### 7.2 PlayFivers (Jogos)

**Painel:** https://playfivers.com

1. Criar conta de agente
2. Obter credenciais da API
3. Configurar webhook para transações de jogo
4. Testar sincronização de jogos

### 7.3 Testar Conexões

```bash
# Testar banco de dados
curl https://in1bet.com/api/health

# Testar auth
curl -X POST https://in1bet.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

---

## 8. Configuração de SSL

### 8.1 Obter Certificado com Certbot

```bash
# Certificado para seu domínio
sudo certbot --nginx -d in1bet.com -d www.in1bet.com

# Seguir prompts:
# - Informar email
# - Aceitar termos
# - Escolher redirect HTTP → HTTPS
```

### 8.2 Renovação Automática

```bash
# Certbot já configura renovação automática
# Verificar timer
sudo systemctl status certbot.timer

# Testar renovação
sudo certbot renew --dry-run
```

### 8.3 Verificar SSL

```bash
# Testar SSL
curl -I https://in1bet.com

# Verificar certificado
echo | openssl s_client -connect in1bet.com:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 9. Configuração de Domínio

### 9.1 DNS Records

Configure no seu provedor de DNS (Cloudflare, Route53, etc.):

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | IP_DA_VPS | 300 |
| A | www | IP_DA_VPS | 300 |
| CNAME | api | @ | 300 |

### 9.2 Cloudflare (Recomendado)

1. Adicionar site no Cloudflare
2. Atualizar nameservers no registrador
3. Configurar SSL: Full (Strict)
4. Habilitar: Always Use HTTPS
5. Configurar regras de cache

### 9.3 Verificar Propagação

```bash
# Verificar DNS
dig in1bet.com
nslookup in1bet.com

# Verificar acesso
curl -I https://in1bet.com
```

---

## 10. Configuração de Firewall

### 10.1 UFW (Ubuntu Firewall)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH (PRIMEIRO!)
sudo ufw allow 22/tcp

# Permitir HTTP e HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status

# Saída esperada:
# Status: active
# To                         Action      From
# --                         ------      ----
# 22/tcp                     ALLOW       Anywhere
# 80/tcp                     ALLOW       Anywhere
# 443/tcp                    ALLOW       Anywhere
```

### 10.2 Fail2Ban (Proteção contra Brute Force)

```bash
# Instalar
sudo apt install -y fail2ban

# Configurar
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local

# Adicionar/modificar:
# [sshd]
# enabled = true
# maxretry = 3
# bantime = 3600

# Reiniciar
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

---

## 11. Setup de PM2

### 11.1 Arquivo de Configuração PM2

```bash
# Criar arquivo ecosystem
nano /home/in1bet/apps/in1bet/ecosystem.config.cjs
```

```javascript
module.exports = {
  apps: [{
    name: 'in1bet',
    script: 'dist/index.cjs',
    cwd: '/home/in1bet/apps/in1bet',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_file: '.env',
    error_file: '/home/in1bet/logs/in1bet-error.log',
    out_file: '/home/in1bet/logs/in1bet-out.log',
    log_file: '/home/in1bet/logs/in1bet-combined.log',
    time: true,
    max_memory_restart: '1G',
    exp_backoff_restart_delay: 100,
    watch: false,
    ignore_watch: ['node_modules', 'logs']
  }]
};
```

### 11.2 Criar Diretório de Logs

```bash
mkdir -p /home/in1bet/logs
```

### 11.3 Iniciar Aplicação

```bash
cd /home/in1bet/apps/in1bet

# Iniciar com PM2
pm2 start ecosystem.config.cjs

# Verificar status
pm2 status

# Ver logs em tempo real
pm2 logs in1bet

# Salvar configuração para restart
pm2 save
```

### 11.4 Nginx como Proxy Reverso

```bash
# Criar configuração Nginx
sudo nano /etc/nginx/sites-available/in1bet
```

```nginx
server {
    listen 80;
    server_name in1bet.com www.in1bet.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name in1bet.com www.in1bet.com;

    # SSL configurado pelo Certbot
    ssl_certificate /etc/letsencrypt/live/in1bet.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/in1bet.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy settings
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        proxy_pass http://127.0.0.1:5000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Webhook endpoint (no caching)
    location /api/webhook {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Rate limiting for API
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 11.5 Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/in1bet /etc/nginx/sites-enabled/

# Remover default
sudo rm /etc/nginx/sites-enabled/default

# Adicionar rate limiting zone no nginx.conf
sudo nano /etc/nginx/nginx.conf
# Adicionar dentro do bloco http:
# limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

---

## 12. Backup Automático

### 12.1 Backup do Neon

O Neon PostgreSQL oferece:
- **Point-in-Time Recovery (PITR):** Últimos 7 dias
- **Branching:** Criar branch para backup

**Configurar no Console Neon:**
1. Ir em Settings > Backup
2. Ativar automatic backups
3. Configurar retenção

### 12.2 Backup de Arquivos (Opcional)

```bash
# Script de backup
nano /home/in1bet/scripts/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR=/home/in1bet/backups
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR=/home/in1bet/apps/in1bet

# Criar diretório
mkdir -p $BACKUP_DIR

# Backup de configs
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  $APP_DIR/.env \
  $APP_DIR/ecosystem.config.cjs \
  /etc/nginx/sites-available/in1bet

# Manter apenas últimos 7 backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/config_$DATE.tar.gz"
```

```bash
# Tornar executável
chmod +x /home/in1bet/scripts/backup.sh

# Agendar no cron (diário às 3h)
crontab -e
# Adicionar:
# 0 3 * * * /home/in1bet/scripts/backup.sh >> /home/in1bet/logs/backup.log 2>&1
```

---

## 13. Monitoramento

### 13.1 PM2 Monitoramento

```bash
# Dashboard em tempo real
pm2 monit

# Status das instâncias
pm2 status

# Métricas
pm2 show in1bet
```

### 13.2 Uptimerobot (Gratuito)

1. Criar conta em uptimerobot.com
2. Adicionar monitor HTTP(s)
3. URL: https://in1bet.com/api/health
4. Intervalo: 5 minutos
5. Configurar alertas (email/Telegram)

### 13.3 New Relic / Datadog (Avançado)

Para monitoramento avançado:

```bash
# Exemplo com New Relic
npm install newrelic

# Adicionar ao início do servidor:
# require('newrelic');
```

---

## 14. Logs

### 14.1 Logs da Aplicação

```bash
# Ver logs PM2
pm2 logs in1bet

# Logs específicos
tail -f /home/in1bet/logs/in1bet-out.log
tail -f /home/in1bet/logs/in1bet-error.log
```

### 14.2 Logs do Nginx

```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log
```

### 14.3 Rotação de Logs

```bash
# PM2 já rotaciona automaticamente
# Para logs Nginx, logrotate está configurado por padrão

# Verificar configuração
cat /etc/logrotate.d/nginx
```

### 14.4 Centralização de Logs (Opcional)

```bash
# Instalar rsyslog ou configurar serviço como:
# - Papertrail
# - Logtail
# - Grafana Loki
```

---

## 15. Escalabilidade

### 15.1 Escalabilidade Vertical

1. Aumentar recursos da VPS (CPU/RAM)
2. PM2 gerencia automaticamente instâncias

### 15.2 Escalabilidade Horizontal

Para alta disponibilidade:

1. **Load Balancer:** Nginx upstream ou HAProxy
2. **Múltiplas VPS:** Cluster PM2
3. **Database:** Neon suporta read replicas
4. **Cache:** Adicionar Redis

### 15.3 Configuração Cluster PM2

```javascript
// ecosystem.config.cjs
{
  instances: 'max',  // Usa todos os CPUs
  exec_mode: 'cluster'
}
```

---

## 16. Checklist de Go-Live

### 16.1 Pré-Deploy

- [ ] Código commitado e testado
- [ ] Build de produção funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] JWT_SECRET seguro gerado
- [ ] Banco de dados migrado
- [ ] SSL/TLS configurado
- [ ] DNS propagado

### 16.2 Deploy

- [ ] Aplicação iniciada com PM2
- [ ] Nginx configurado e ativo
- [ ] Health check retornando OK
- [ ] Firewall configurado
- [ ] Backup automatizado

### 16.3 Pós-Deploy

- [ ] Teste de login funcional
- [ ] Teste de depósito PIX
- [ ] Teste de jogo original
- [ ] Monitoramento ativo
- [ ] Alertas configurados
- [ ] Documentação atualizada

### 16.4 Validação Final

```bash
# Health check
curl https://in1bet.com/api/health

# Teste de login
curl -X POST https://in1bet.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@in1bet.com","password":"senha"}'

# Verificar SSL
curl -vI https://in1bet.com 2>&1 | grep -i "SSL\|TLS"
```

---

## 17. Procedimento de Rollback

### 17.1 Rollback Rápido (PM2)

```bash
# Listar deploys anteriores
pm2 deploy production list

# Reverter para versão anterior
pm2 reload in1bet --update-env
```

### 17.2 Rollback de Código

```bash
cd /home/in1bet/apps/in1bet

# Ver commits anteriores
git log --oneline -10

# Reverter para commit específico
git checkout COMMIT_HASH

# Rebuild
npm ci
npm run build

# Restart
pm2 restart in1bet
```

### 17.3 Rollback de Banco de Dados

**Via Neon Console:**
1. Acessar console Neon
2. Ir em Branches
3. Usar Point-in-Time Recovery
4. Selecionar timestamp anterior

### 17.4 Rollback Completo

```bash
# 1. Parar aplicação
pm2 stop in1bet

# 2. Restaurar código
git checkout COMMIT_ANTERIOR

# 3. Restaurar .env se necessário
cp /home/in1bet/backups/config_YYYYMMDD/.env .

# 4. Rebuild e restart
npm ci && npm run build
pm2 restart in1bet

# 5. Verificar
curl https://in1bet.com/api/health
```

---

## 18. Segurança Operacional

### 18.1 Acesso SSH

```bash
# Desabilitar login root
sudo nano /etc/ssh/sshd_config
# PermitRootLogin no
# PasswordAuthentication no

sudo systemctl restart sshd
```

### 18.2 Atualizações de Segurança

```bash
# Habilitar atualizações automáticas
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 18.3 Monitoramento de Intrusão

```bash
# Instalar e configurar
sudo apt install -y lynis

# Executar auditoria
sudo lynis audit system
```

### 18.4 Rotação de Secrets

**Periodicidade recomendada:**
- JWT_SECRET: A cada 90 dias
- SESSION_SECRET: A cada 90 dias
- API Keys: Conforme políticas dos provedores

**Procedimento:**
```bash
# 1. Gerar novo secret
openssl rand -hex 64

# 2. Atualizar .env
nano .env

# 3. Restart aplicação
pm2 restart in1bet

# NOTA: Usuários logados perderão sessão
```

### 18.5 Auditoria Periódica

| Ação | Frequência |
|------|-----------|
| Verificar logs de acesso | Diário |
| Atualizar dependências | Semanal |
| Backup manual | Semanal |
| Rotação de secrets | Trimestral |
| Auditoria de segurança | Semestral |
| Penetration test | Anual |

---

## Comandos Úteis de Referência Rápida

```bash
# ===== PM2 =====
pm2 status                    # Ver status
pm2 logs in1bet               # Ver logs
pm2 restart in1bet            # Reiniciar
pm2 stop in1bet               # Parar
pm2 delete in1bet             # Remover
pm2 monit                     # Dashboard

# ===== Nginx =====
sudo nginx -t                 # Testar config
sudo systemctl reload nginx   # Recarregar
sudo systemctl restart nginx  # Reiniciar
sudo tail -f /var/log/nginx/access.log

# ===== Sistema =====
htop                          # Monitorar recursos
df -h                         # Espaço em disco
free -m                       # Memória
netstat -tlpn                 # Portas abertas

# ===== Aplicação =====
curl https://in1bet.com/api/health    # Health check
npm run build                 # Build
npm run db:push               # Migrar banco

# ===== Logs =====
tail -f /home/in1bet/logs/in1bet-out.log
tail -f /home/in1bet/logs/in1bet-error.log
```

---

**Documento preparado por:** Replit Agent  
**Data:** 07/01/2026  
**Contato técnico:** contato@in1bet.com
