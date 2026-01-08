# Guia de Deployment - IN1Bet

Este guia explica como hospedar o IN1Bet em um VPS (como Hostinger) com PostgreSQL.

---

## Arquitetura do Projeto

```
IN1Bet/
├── client/          # Frontend React (Vite)
├── server/          # Backend Express.js
├── shared/          # Schemas compartilhados
├── dist/            # Build de produção (gerado)
└── package.json     # Dependências
```

---

## Opções de Hospedagem

### Opção 1: VPS Hostinger (Recomendado para controle total)
- **Preço**: A partir de R$20/mês
- **Vantagem**: Controle total, IP dedicado
- **Requisitos**: Ubuntu 22.04, 2GB RAM mínimo

### Opção 2: Railway (Mais fácil)
- **Preço**: Pay-as-you-go (grátis para começar)
- **Vantagem**: Deploy com 1 clique via GitHub
- **Melhor para**: Protótipos e MVPs

### Opção 3: Render
- **Preço**: A partir de $7/mês
- **Vantagem**: SSL automático, fácil configuração

---

## Hospedagem do Banco de Dados (PostgreSQL)

### Opções Recomendadas:

| Provedor | Preço | Melhor Para |
|----------|-------|-------------|
| **Neon** | Grátis (tier inicial) | Desenvolvimento e apps pequenos |
| **Supabase** | Grátis / $25/mês | Apps full-stack |
| **Railway** | Pay-as-you-go | Deploy junto com app |
| **DigitalOcean** | $15/mês | Produção estável |
| **AWS RDS** | ~$15-30/mês | Enterprise |

**Recomendação**: Use **Neon** (grátis) para começar, migre para **Supabase** ou **DigitalOcean** em produção.

---

## Passo a Passo: Deploy no VPS Hostinger

### 1. Preparar o Projeto para Produção

```bash
# No seu computador local, clonar o projeto
git clone <seu-repositorio>
cd IN1Bet

# Instalar dependências
npm install

# Criar build de produção
npm run build
```

### 2. Configurar VPS Hostinger

```bash
# Conectar via SSH
ssh root@SEU_IP_VPS

# Criar usuário (segurança)
adduser in1bet
usermod -aG sudo in1bet
su - in1bet

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 (gerenciador de processos)
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx
```

### 3. Enviar Projeto para VPS

```bash
# No seu computador local
scp -r ./* in1bet@SEU_IP_VPS:~/in1bet/

# Ou usar Git no servidor
cd ~
git clone <seu-repositorio> in1bet
cd in1bet
npm install
npm run build
```

### 4. Configurar Variáveis de Ambiente

Criar arquivo `.env` no servidor:

```bash
nano ~/in1bet/.env
```

Conteúdo:

```env
# Servidor
NODE_ENV=production
PORT=5000

# Banco de Dados PostgreSQL
DATABASE_URL=postgresql://usuario:senha@host:5432/in1bet

# JWT Secret (gerar uma chave aleatória forte)
JWT_SECRET=sua_chave_secreta_muito_longa_e_aleatoria_aqui

# OndaPay (Pagamentos PIX)
ONDAPAY_API_URL=https://api.ondapay.com.br
ONDAPAY_API_KEY=sua_api_key
ONDAPAY_WEBHOOK_SECRET=seu_webhook_secret

# PlayFivers (Jogos - se usar)
PLAYFIVERS_AGENT_TOKEN=seu_token
PLAYFIVERS_SECRET_KEY=sua_secret
PLAYFIVERS_AGENT_CODE=seu_codigo
PLAYFIVERS_AGENT_SECRET=seu_secret

# Web Push (Notificações - opcional)
VAPID_PUBLIC_KEY=sua_chave_publica
VAPID_PRIVATE_KEY=sua_chave_privada
```

### 5. Configurar Banco de Dados

#### Opção A: Neon (Grátis)

1. Acesse https://neon.tech
2. Crie uma conta
3. Crie um novo projeto "in1bet"
4. Copie a Connection String
5. Adicione no `.env` como `DATABASE_URL`

#### Opção B: PostgreSQL no próprio VPS

```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Criar banco e usuário
sudo -u postgres psql
CREATE DATABASE in1bet;
CREATE USER in1bet_user WITH ENCRYPTED PASSWORD 'senha_forte';
GRANT ALL PRIVILEGES ON DATABASE in1bet TO in1bet_user;
\q

# Connection string:
# DATABASE_URL=postgresql://in1bet_user:senha_forte@localhost:5432/in1bet
```

### 6. Aplicar Migrações do Banco

```bash
cd ~/in1bet
npm run db:push
```

### 7. Iniciar com PM2

Criar arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'in1bet',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

Iniciar:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Seguir instruções para auto-start
```

### 8. Configurar Nginx (Proxy Reverso)

```bash
sudo nano /etc/nginx/sites-available/in1bet
```

Conteúdo:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket para chat
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

Ativar:

```bash
sudo ln -s /etc/nginx/sites-available/in1bet /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 9. SSL Gratuito (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

### 10. Firewall

```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
```

---

## Configurar APIs e Integrações

### OndaPay (Pagamentos PIX)

1. Crie conta em https://ondapay.com.br
2. Obtenha suas credenciais no painel
3. Configure o webhook URL: `https://seu-dominio.com/api/ondapay/webhook`
4. Adicione as keys no `.env`

### PlayFivers (Jogos de Cassino)

1. Entre em contato com PlayFivers para obter credenciais de agente
2. Configure webhook: `https://seu-dominio.com/api/playfivers/webhook`
3. Adicione as keys no `.env`

---

## Comandos Úteis PM2

```bash
pm2 list              # Ver apps rodando
pm2 logs in1bet       # Ver logs
pm2 restart in1bet    # Reiniciar
pm2 stop in1bet       # Parar
pm2 monit             # Monitor em tempo real
```

---

## Conectar Domínio (Hostinger)

1. No painel Hostinger, vá em "DNS Zone"
2. Adicione registro A:
   - Nome: `@`
   - Valor: IP do seu VPS
3. Adicione registro A para www:
   - Nome: `www`
   - Valor: IP do seu VPS
4. Aguarde propagação (até 24h)

---

## Checklist Final

- [ ] Node.js 20 instalado
- [ ] PM2 instalado e configurado
- [ ] Nginx configurado como proxy
- [ ] SSL ativo (Let's Encrypt)
- [ ] Banco de dados PostgreSQL configurado
- [ ] Variáveis de ambiente configuradas
- [ ] Firewall ativo (UFW)
- [ ] Domínio apontando para VPS
- [ ] Webhooks configurados (OndaPay, PlayFivers)
- [ ] App iniciando automaticamente (pm2 startup)

---

## Suporte e Debugging

```bash
# Ver logs do app
pm2 logs in1bet

# Ver logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Testar conexão com banco
psql $DATABASE_URL -c "SELECT 1"

# Verificar se porta está aberta
sudo netstat -tlnp | grep 5000
```

---

## Custos Estimados (Mínimo)

| Serviço | Custo Mensal |
|---------|--------------|
| VPS Hostinger (2GB RAM) | R$20-40 |
| Domínio .com.br | R$40/ano |
| PostgreSQL (Neon) | Grátis |
| SSL (Let's Encrypt) | Grátis |
| **Total** | ~R$25/mês |

Para produção robusta, considere:
- VPS com 4GB+ RAM: R$60-100/mês
- PostgreSQL gerenciado: $15-25/mês
