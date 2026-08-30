# 🌐 Guia de Deploy Gratuito do Servidor de Voz & Sinalização

Para que amigos em computadores diferentes consigam conversar por voz, compartilhar tela em tempo real e usar o bot de música juntos, o **Servidor de Sinalização (Signaling Server)** precisa estar hospedado na nuvem com um endereço acessível (HTTPS / WSS).

---

## ❓ Por que a Vercel sozinha não suporta Canais de Voz & WebSockets?

A **Vercel** é uma plataforma **Serverless (Funções Lambda)**:
- Cada requisição é tratada por uma função que roda por poucos segundos e é destruída em seguida.
- **WebRTC e Voz em Tempo Real** exigem uma conexão contínua de **WebSockets persistentes (`ws://` / `wss://`)** que fiquem abertas 24/7 para trocar eventos como: `signal-offer`, `signal-answer`, `ice-candidate`, status de quem está falando e streaming contínuo de áudio do bot.
- A Vercel encerra essas conexões longas devido ao tempo limite de execução (timeout).

---

## ⚡ Como Usar o Redis no PulseCord

O **Redis** (como o **Upstash Redis**, que possui plano 100% gratuito) é excelente para:
1. **Sincronização entre instâncias (Socket.io Redis Adapter)**: Permite que múltiplos servidores de sinalização conversem entre si.
2. **Armazenamento de Estado em Memória**: Salva mensagens de chat, lista de cargos, canais e salas ativas com leitura instantânea (< 1ms).

---

## 🚀 Opções 100% Gratuitas para Hospedar o Servidor de Sinalização

### 🟢 Opção 1: Render.com (Mais Recomendado e Fácil)

O **Render** oferece plano gratuito para *Web Services* com suporte total a Node.js e WebSockets persistentes:

1. **Suba a pasta do backend para o seu GitHub**:
   - Crie um repositório no GitHub contendo os arquivos `server/index.js`, `server/signaling.js`, `server/musicService.js` e o `package.json`.
2. **Crie uma conta no [Render.com](https://render.com/)**.
3. **Clique em "New +" -> "Web Service"** e selecione seu repositório.
4. **Configurações do serviço**:
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server/index.js`
   - **Instance Type**: `Free`
5. **Clique em "Create Web Service"**.
6. O Render gerará uma URL HTTPS pública, por exemplo:
   ```
   https://pulsecord-server.onrender.com
   ```

---

### 🟣 Opção 2: Railway.app / Fly.io / Glitch

- **Railway**: Permite deploy com 1 clique a partir do GitHub, com suporte a WebSockets nativos.
- **Fly.io**: Roda containers Docker/Node.js com 3 micro-máquinas gratuitas.
- **Glitch**: Permite colar o código do Node.js e ter um endpoint WebSocket gratuito instantaneamente.

---

## 🔄 Como o WebRTC Funciona e Por Que o Custo de Banda é Zero

No PulseCord, o áudio dos microfones e o vídeo de compartilhamento de tela em 60 FPS fluem **Ponto a Ponto (Peer-to-Peer Mesh)** diretamente entre os usuários, usando os servidores **STUN públicos gratuitos do Google** (`stun:stun.l.google.com:19302`).

- O servidor na nuvem (Render) **só troca as mensagens leves de handshake JSON** (oferta, resposta e candidatos ICE).
- **Todo o tráfego pesado de vídeo e áudio não consome banda do seu servidor na nuvem!**

---

## 🔗 Conectando o Executável (.exe) ao Servidor na Nuvem

Após subir o servidor no Render (ou outro serviço):

1. Abra o **PulseCord.exe**.
2. Clique no ícone de **Configurações (Engrenagem ⚙️)** no canto inferior esquerdo.
3. Acesse a aba **Servidor / Nuvem**.
4. No campo **URL do Servidor de Sinalização**, substitua `http://localhost:4000` pela URL do seu servidor na nuvem:
   ```
   https://pulsecord-1-w3xw.onrender.com
   ```
5. Clique em **Conectar ao Servidor**.
6. Pronto! O PulseCord já vem pré-configurado por padrão com a URL oficial: `https://pulsecord-1-w3xw.onrender.com`. Agora qualquer pessoa que abrir o executável estará conectada na mesma rede para conversar por voz, transmitir tela e ouvir música juntos!
