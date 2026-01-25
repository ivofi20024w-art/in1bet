# Configuração Nginx para WebSocket - IN1BET

## Problema
WebSockets precisam de headers especiais (`Upgrade` e `Connection`) para funcionar através do Nginx.
Sem essa configuração, conexões WebSocket podem ser fechadas inesperadamente.

## Solução

Adicione ou atualize a configuração do Nginx na VPS (CloudPanel):

### Localização do arquivo
```bash
/etc/nginx/sites-enabled/in1bet.com.br.conf
```

### Configuração necessária

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name in1bet.com.br www.in1bet.com.br;
    
    # SSL (se configurado pelo CloudPanel)
    # ssl_certificate ...
    # ssl_certificate_key ...
    
    # Configuração geral
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # IMPORTANTE: Headers para WebSocket
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts para WebSocket (aumentados)
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_connect_timeout 60s;
        
        # Buffer settings
        proxy_buffering off;
        proxy_cache off;
    }
    
    # Rota específica para WebSocket do chat (opcional, mas recomendado)
    location /ws/chat {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Headers WebSocket obrigatórios
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeout longo para manter conexão viva
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        
        # Desabilitar buffering para WebSocket
        proxy_buffering off;
    }
}
```

### Comandos para aplicar

```bash
# 1. Editar o arquivo de configuração
sudo nano /etc/nginx/sites-enabled/in1bet.com.br.conf

# 2. Testar a configuração
sudo nginx -t

# 3. Recarregar o Nginx
sudo systemctl reload nginx
```

### Verificar se está funcionando

```bash
# Ver logs do Nginx em tempo real
sudo tail -f /var/log/nginx/error.log

# Testar conexão WebSocket
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: test" \
  -H "Sec-WebSocket-Version: 13" \
  https://in1bet.com.br/ws/chat
```

## Pontos críticos

1. **`proxy_set_header Upgrade $http_upgrade;`** - Passa o header de upgrade para o backend
2. **`proxy_set_header Connection "upgrade";`** - Indica que é uma conexão de upgrade
3. **`proxy_read_timeout 86400s;`** - Timeout de 24 horas para manter conexão viva
4. **`proxy_buffering off;`** - Desabilita buffering para mensagens em tempo real
