# ⚡ PulseCord - Aplicativo Desktop estilo Discord

Um aplicativo desktop completo inspirado no Discord, desenvolvido com **Electron**, **React**, **Tailwind CSS**, **WebRTC** e **Socket.io**.

---

## 🚀 Funcionalidades Implementadas

1. **🎙️ Canais de Voz em Tempo Real (WebRTC)**
   - Conexão de áudio peer-to-peer de altíssima qualidade com baixa latência.
   - Detecção de Atividade de Voz (VAD) via Web Audio API com anel verde pulsante no avatar ao falar.
   - Cancelamento de eco acústico, supressão de ruído e controle automático de ganho integrados.
   - Controles rápidos de **Mutar Microfone** e **Ensurdecer (Deafen)**.

2. **🖥️ Compartilhamento de Tela em 60 FPS**
   - Transmissão em tempo real de **Telas Inteiras** ou **Janelas de Aplicativos Específicas** (jogos, navegadores, softwares) com miniaturas ao vivo.
   - Palco de vídeo com modo teatro / spotlight e visualização em alta definição.

3. **💬 Canais de Texto & Chat Completo**
   - Suporte a múltiplos canais de texto com tópicos.
   - Envio de mensagens com pré-visualização de **imagens e arquivos anexados**.
   - Seletor de reações e emojis.
   - Histórico de mensagens persistente por canal.

4. **🛡️ Sistema de Cargos e Permissões Granulares**
   - Criação e personalização de cargos com **seletor de cores Hex** e paleta Discord.
   - Badges coloridas no chat e separação na lista de membros.
   - 8 permissões individuais (Administrador, Gerenciar Canais, Gerenciar Cargos, Enviar Mensagens, Conectar em Voz, Transmitir Tela, Controlar Bot de Música, Expulsar Membros).

5. **🎵 Bot de Música Integrado & Rádio 24/7**
   - Bot virtual estilo Rythm/Groovy operando nos canais de voz.
   - Estações de rádio pré-configuradas (Lofi Chill, Synthwave 80s, Gaming EDM, Piano Ambient, Hip Hop Boom Bap).
   - Suporte a busca por palavras-chave ou URLs diretas de áudio/streaming.
   - Painel interativo com barra de reprodução, controle de volume, fila de músicas e controles de reprodução (Play, Pause, Skip, Stop).
   - Comandos de barra no chat: `/play`, `/skip`, `/pause`, `/resume`, `/stop`, `/queue`, `/roles`, `/help`.

6. **🎨 Interface Dark Theme Fiel ao Discord**
   - Barra de título customizada com botões de minimizar, maximizar e fechar.
   - Barra lateral de servidores com botão de adicionar servidor (+) e indicador ativo.
   - Barra lateral de canais com status de conexão de voz ao vivo.
   - Painel inferior de perfil com avatar, microfone, fone e engrenagem de configurações.

---

## 📂 Localização do Executável (.exe)

O executável pronto para uso já foi gerado na pasta:
```
C:\Users\Kayky\PulseCord\dist-electron\win-unpacked\PulseCord.exe
```

Basta dar dois cliques em `PulseCord.exe` para abrir e usar!

---

## 🛠️ Comandos de Desenvolvimento

- **Iniciar modo desenvolvimento (Vite + Electron)**:
  ```bash
  npm run dev
  ```
- **Compilar apenas o Frontend**:
  ```bash
  npm run build:vite
  ```
- **Iniciar apenas o Servidor de Sinalização (Backend)**:
  ```bash
  npm run server
  ```
