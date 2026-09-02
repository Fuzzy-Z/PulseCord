import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  PlusCircle,
  Disc3,
  Users,
  User,
  Image as ImageIcon,
  X,
  Sparkles,
  Paperclip,
  Pin,
  PinOff,
  Clock,
  Video,
  File,
  CheckCheck
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { UserProfileCard } from './UserProfileCard';
import { UserContextMenu } from './UserContextMenu';
import { AvatarImage } from './AvatarImage';

export const ChatArea = () => {
  const { currentChannel, currentServer, messages, sendMessage, setIsMusicModalOpen, onlineMembers, pinMessage, unpinMessage, pinnedMessages, activeView, openDM } = useServer();
  const { sendMusicControl, activeVoiceChannel } = useVoice();
  const { currentUser } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showSlashHints, setShowSlashHints] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);
  const [selectedUserForCard, setSelectedUserForCard] = useState(null);
  const [contextMenuUser, setContextMenuUser] = useState(null);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('pulsecord_compact_mode') === 'true';
  });

  const [contextMenuMsg, setContextMenuMsg] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const slashCommands = [
    { cmd: '/play', desc: 'Toca uma música, rádio lofi/synthwave ou link de áudio' },
    { cmd: '/skip', desc: 'Pula a música atual no canal de voz' },
    { cmd: '/pause', desc: 'Pausa a reprodução atual' },
    { cmd: '/resume', desc: 'Retoma a reprodução' },
    { cmd: '/stop', desc: 'Para o bot de música e limpa a fila' },
    { cmd: '/queue', desc: 'Exibe a lista de músicas na fila' },
    { cmd: '/roles', desc: 'Mostra os cargos e permissões do servidor' },
    { cmd: '/help', desc: 'Ajuda e guia de comandos do Voxel' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleInsertMention = (e) => {
      const { username } = e.detail || {};
      if (username) {
        setInputMessage((prev) => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} @${username} ` : `@${username} `;
        });
        setTimeout(() => {
          const inputElem = document.getElementById('chat-input-textarea');
          if (inputElem) {
            inputElem.focus();
            const len = inputElem.value.length;
            inputElem.setSelectionRange(len, len);
          }
        }, 50);
      }
    };
    window.addEventListener('pulsecord-insert-mention', handleInsertMention);
    return () => window.removeEventListener('pulsecord-insert-mention', handleInsertMention);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputMessage(val);
    setShowSlashHints(val.startsWith('/') && !val.includes(' '));
  };

  const handleSelectCommand = (cmd) => {
    setInputMessage(cmd + ' ');
    setShowSlashHints(false);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        // Upload Limits (Non-Nitro: 25MB, Nitro: 500MB)
        const isNitro = currentUser?.nitro === true;
        const limitMB = isNitro ? 500 : 25;
        if (file.size > limitMB * 1024 * 1024) {
          alert(`O arquivo ${file.name} excede o limite de upload (${limitMB}MB).`);
          return;
        }

        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            dataUrl: event.target.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (idx) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() && attachments.length === 0) return;

    sendMessage(inputMessage, attachments);
    setInputMessage('');
    setAttachments([]);
    setShowSlashHints(false);
  };

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center text-sys-muted text-sm voxel-workspace-inner">
        Selecione um canal para conversar
      </div>
    );
  }

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getMonogram = (username) => {
    return (username || 'User').substring(0, 2).toUpperCase();
  };

  const isDM = currentChannel?.type === 'dm';
  const currentPinnedList = messages.filter((m) => m.isPinned || (pinnedMessages[currentChannel.id] || []).some(pm => pm.id === m.id));

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none voxel-workspace-inner">
      {/* Channel Header */}
      <div className="h-11 px-5 flex items-center justify-between flex-shrink-0 border-b border-sys-border bg-sys-s1/60">
        <div className="flex items-center space-x-2.5 truncate">
          {isDM ? (
            <div className="flex items-center space-x-2 truncate">
              <span className="text-sys-accent font-bold text-base">@</span>
              <span className="font-bold text-sys-text text-[13px] tracking-tight truncate">
                {currentChannel.name}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20">
                DM
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 truncate">
              <Hash className="w-4 h-4 text-sys-accent flex-shrink-0" />
              <span className="font-bold text-sys-text text-[13px] tracking-tight truncate">{currentChannel.name}</span>
              {currentChannel.topic && (
                <>
                  <span className="text-sys-muted">/</span>
                  <span className="text-xs text-sys-muted truncate max-w-[350px]">
                    {currentChannel.topic}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 text-sys-muted">
          {/* Pinned Messages Button */}
          <button
            onClick={() => setShowPinnedModal(!showPinnedModal)}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition btn-interactive ${
              showPinnedModal || currentPinnedList.length > 0
                ? 'text-amber-300 bg-amber-400/10 border border-amber-400/20'
                : 'text-sys-muted hover:text-sys-text hover:bg-sys-s1'
            }`}
            title="Mensagens Fixadas"
          >
            <Pin className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold">{currentPinnedList.length}</span>
          </button>

          {!isDM && (
            <button
              onClick={() => setIsMusicModalOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sys-s1 border border-sys-border text-sys-text text-xs font-medium transition btn-interactive"
              title="Abrir Player de Música"
            >
              <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
              <span className="hidden sm:inline">Player</span>
            </button>
          )}

          {isDM ? (
            <button
              onClick={() => setShowMemberList(!showMemberList)}
              className={`p-2 rounded-xl transition btn-interactive ${
                showMemberList ? 'text-sys-text bg-sys-s1' : 'text-sys-muted hover:text-sys-text hover:bg-sys-s1'
              }`}
              title="Exibir/Ocultar Perfil do Usuário"
            >
              <User className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowMemberList(!showMemberList)}
              className={`p-2 rounded-xl transition btn-interactive ${
                showMemberList ? 'text-sys-text bg-sys-s1' : 'text-sys-muted hover:text-sys-text hover:bg-sys-s1'
              }`}
              title="Lista de Membros"
            >
              <Users className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body: Messages Feed + Member List */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Messages Feed */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 thin-scrollbar">
            {/* Channel Welcome Header */}
            <div className="mb-4 pt-2 px-2 space-y-1.5">
              <div className="w-12 h-12 rounded-full bg-sys-s3 flex items-center justify-center mb-2 shadow-sm border border-white/5">
                {isDM ? (
                  <span className="text-xl font-black text-sys-accent">@</span>
                ) : (
                  <Hash className="w-6 h-6 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {isDM ? `Conversa Direta com @${currentChannel.name}` : `Bem-vindo ao #${currentChannel.name}!`}
              </h2>
              <p className="text-sys-muted text-xs leading-relaxed max-w-lg">
                {isDM
                  ? 'Este é o início do histórico da sua conversa direta.'
                  : currentChannel.topic || `Este é o início do canal #${currentChannel.name}.`}
              </p>

              {/* 1-Hour Ephemeral Notice */}
              <div className="mt-2 inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-sys-s2/80 border border-white/5 text-[11px] text-sys-muted">
                <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span>
                  Mensagens temporárias ativas (1 hora). <strong>Fixe 📌</strong> mensagens importantes para salvá-las permanentemente.
                </span>
              </div>
            </div>

            <div className="w-full h-[1px] bg-white/[0.06] my-3" />

            {/* Messages Feed (Discord Native Left-Aligned Stream) */}
            <div className="space-y-1">
              {messages.map((msg) => {
                const isBot = msg.author.isBot;
                const monogram = getMonogram(msg.author.username);
                const isPinned = msg.isPinned === true || (pinnedMessages[currentChannel.id] || []).some((m) => m.id === msg.id);

                return (
                  <div
                    key={msg.id}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenuMsg(contextMenuMsg === msg.id ? null : msg.id);
                    }}
                    className={`flex space-x-4 hover:bg-white/[0.035] -mx-4 px-4 py-1.5 rounded-lg transition-colors group relative ${
                      isPinned ? 'bg-amber-500/[0.06] border-l-2 border-amber-400/80' : ''
                    } ${compactMode ? 'py-0.5 space-x-2' : ''}`}
                  >
                    {/* Quick Action Pin Button on Hover */}
                    <div className="absolute right-3 top-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 bg-sys-s3 border border-sys-border rounded-lg p-0.5 shadow-md z-20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (isPinned) unpinMessage(currentChannel.id, msg.id);
                          else pinMessage(currentChannel.id, msg);
                        }}
                        className={`p-1.5 rounded-md text-xs transition cursor-pointer ${
                          isPinned
                            ? 'text-amber-300 bg-amber-400/20 hover:bg-amber-400/30'
                            : 'text-sys-muted hover:text-sys-text hover:bg-sys-s1'
                        }`}
                        title={isPinned ? 'Desfixar Mensagem' : 'Fixar Mensagem (Salvar do reset de 1h)'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-300 text-amber-300' : ''}`} />
                      </button>
                    </div>

                    {/* Avatar */}
                    {!compactMode && (
                      <div
                        className="flex-shrink-0 mt-0.5 cursor-pointer"
                        onClick={() => setSelectedUserForCard(msg.author)}
                      >
                        {msg.author.avatarUrl ? (
                          <AvatarImage 
                            src={msg.author.avatarUrl} 
                            alt={msg.author.username} 
                            className="w-10 h-10 rounded-full object-cover shadow-sm" 
                          />
                        ) : (
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${msg.author.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
                            {monogram}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="flex-1 min-w-0">
                      <div className={`flex items-center space-x-2 ${compactMode ? 'inline-flex mr-2' : ''}`}>
                        {compactMode && (
                          <span className="text-[10px] text-sys-muted font-medium w-12 text-right">
                            {formatTime(msg.timestamp)}
                          </span>
                        )}
                        <span
                          onClick={() => setSelectedUserForCard(msg.author)}
                          className={`font-semibold text-xs hover:underline cursor-pointer tracking-tight ${compactMode ? 'ml-2' : ''}`}
                          style={{ color: msg.author.roleColor || '#ffffff' }}
                        >
                          {msg.author.displayName || msg.author.username}
                        </span>

                        {/* Bot / Role Tag */}
                        {isBot ? (
                          <span className="bg-sys-accent text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                            BOT
                          </span>
                        ) : (
                          msg.author.roleName && (
                            <span
                              className="text-[9px] font-semibold px-2 py-0.5 rounded-full border border-sys-border text-sys-muted bg-sys-s1"
                            >
                              {msg.author.roleName.replace(/[\uD800-\uDFFF].*/g, '').trim()}
                            </span>
                          )
                        )}

                        {!compactMode && (
                          <span className="text-[10px] text-sys-muted font-normal ml-1.5">
                            {formatTime(msg.timestamp)}
                          </span>
                        )}

                        {/* Pinned Badge */}
                        {isPinned && (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[9px] font-bold tracking-wide">
                            <Pin className="w-2.5 h-2.5" />
                            <span>Fixada</span>
                          </span>
                        )}
                      </div>

                      {/* Text Content */}
                      {msg.content && (
                        <div className={`text-[13px] text-[#dbdee1] mt-0.5 leading-relaxed whitespace-pre-wrap select-text font-normal ${compactMode ? 'mt-0 inline' : ''}`}>
                          {msg.content}
                        </div>
                      )}

                      {/* Attachments: Video, Image, Audio, Files */}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-3">
                          {msg.attachments.map((att, i) => {
                            const isVideo =
                              att.type?.startsWith('video/') ||
                              att.dataUrl?.startsWith('data:video') ||
                              /\.(mp4|webm|mov|mkv|ogg|m4v)$/i.test(att.name || '');

                            const isImage =
                              att.type?.startsWith('image/') ||
                              att.dataUrl?.startsWith('data:image') ||
                              /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(att.name || '');

                            const isAudio =
                              att.type?.startsWith('audio/') ||
                              att.dataUrl?.startsWith('data:audio') ||
                              /\.(mp3|wav|ogg|m4a|aac)$/i.test(att.name || '');

                            if (isVideo) {
                              return (
                                <div key={i} className="max-w-md w-full rounded-xl overflow-hidden bg-black/60 border border-white/10 shadow-md">
                                  <video
                                    src={att.dataUrl}
                                    controls
                                    preload="metadata"
                                    playsInline
                                    className="max-h-72 w-full object-contain rounded-xl"
                                  />
                                  <div className="px-3 py-1.5 bg-sys-s2 flex items-center justify-between text-[11px] text-sys-muted">
                                    <span className="truncate font-medium">{att.name}</span>
                                  </div>
                                </div>
                              );
                            }

                            if (isImage) {
                              return (
                                <div key={i} className="max-w-md rounded-xl overflow-hidden border border-white/10 shadow-md bg-sys-s1">
                                  <img
                                    src={att.dataUrl}
                                    alt={att.name}
                                    className="max-h-72 object-contain rounded-xl hover:opacity-95 transition"
                                  />
                                </div>
                              );
                            }

                            if (isAudio) {
                              return (
                                <div key={i} className="w-full max-w-sm p-3 bg-sys-s2 rounded-xl border border-sys-border space-y-2">
                                  <span className="text-xs font-semibold text-sys-text truncate block">{att.name}</span>
                                  <audio src={att.dataUrl} controls className="w-full h-8" />
                                </div>
                              );
                            }

                            return (
                              <div key={i} className="p-3 bg-sys-s2 border border-sys-border rounded-xl flex items-center space-x-2.5 text-xs">
                                <Paperclip className="w-4 h-4 text-sys-accent" />
                                <span className="font-semibold text-sys-text">{att.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Context Menu / Pin Actions */}
                    {contextMenuMsg === msg.id && (
                      <div className="absolute right-4 top-2 bg-sys-s3 border border-sys-border shadow-2xl rounded-xl py-1 z-30 text-xs">
                        {isPinned ? (
                          <button 
                            onClick={() => { unpinMessage(currentChannel.id, msg.id); setContextMenuMsg(null); }}
                            className="w-full text-left px-4 py-2 hover:bg-sys-s1 text-sys-text transition flex items-center space-x-2"
                          >
                            <PinOff className="w-3.5 h-3.5 text-amber-400" />
                            <span>Desfixar Mensagem</span>
                          </button>
                        ) : (
                          <button 
                            onClick={() => { pinMessage(currentChannel.id, msg); setContextMenuMsg(null); }}
                            className="w-full text-left px-4 py-2 hover:bg-sys-s1 text-sys-text transition flex items-center space-x-2"
                          >
                            <Pin className="w-3.5 h-3.5 text-amber-400" />
                            <span>Fixar Mensagem (Salvar)</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Bar before sending */}
          {attachments.length > 0 && (
            <div className="px-5 py-2.5 bg-sys-s2 flex items-center space-x-3 border-t border-sys-border overflow-x-auto thin-scrollbar">
              {attachments.map((att, i) => {
                const isVideo =
                  att.type?.startsWith('video/') ||
                  att.dataUrl?.startsWith('data:video') ||
                  /\.(mp4|webm|mov|mkv|ogg)$/i.test(att.name || '');

                return (
                  <div key={i} className="relative group rounded-xl bg-sys-s3 p-1.5 border border-sys-border shadow-md flex-shrink-0">
                    <button
                      onClick={() => handleRemoveAttachment(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 rounded-full text-white flex items-center justify-center shadow-lg transition z-10"
                    >
                      <X className="w-3 h-3" />
                    </button>

                    {isVideo ? (
                      <div className="w-16 h-16 rounded-lg bg-black flex flex-col items-center justify-center relative overflow-hidden">
                        <video src={att.dataUrl} className="w-full h-full object-cover opacity-60" muted playsInline />
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <Video className="w-5 h-5 drop-shadow" />
                        </div>
                      </div>
                    ) : (
                      <img src={att.dataUrl} alt={att.name} className="w-16 h-16 object-cover rounded-lg" />
                    )}
                    <span className="text-[9px] text-sys-muted truncate max-w-[64px] block mt-1 text-center">
                      {att.name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Slash Commands Autocomplete Popup */}
          {showSlashHints && (
            <div className="mx-5 mb-2 bg-sys-s3 rounded-2xl border border-sys-border shadow-2xl p-2 z-20 space-y-1 animate-dropdown">
              <div className="text-[10px] font-semibold text-sys-muted uppercase px-2.5 py-1 tracking-wider">
                Comandos
              </div>
              {slashCommands
                .filter((c) => c.cmd.startsWith(inputMessage))
                .map((c) => (
                  <button
                    key={c.cmd}
                    type="button"
                    onClick={() => handleSelectCommand(c.cmd)}
                    className="w-full text-left flex items-center justify-between px-3 py-2 rounded-xl hover:bg-sys-s1 text-sys-text transition group text-xs"
                  >
                    <span className="font-semibold text-sys-accent group-hover:text-sys-accentHov">{c.cmd}</span>
                    <span className="text-sys-muted truncate max-w-xs">{c.desc}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Message Input Box */}
          <div className="px-5 pb-5 relative">
            <form
              onSubmit={handleSend}
              className="bg-sys-s2 border border-sys-border rounded-xl flex items-center px-4 py-3 space-x-3 transition-colors focus-within:border-sys-accent shadow-sm"
            >
              {/* File Attachment Upload */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,video/*,audio/*"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-sys-muted hover:text-sys-text p-1 rounded-lg hover:bg-white/5 transition btn-interactive"
                title="Adicionar Foto ou Vídeo"
              >
                <PlusCircle className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                id="chat-input-textarea"
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder={
                  isDM
                    ? `Enviar mensagem direta para @${currentChannel.name}`
                    : `Mensagem em #${currentChannel.name} (use / para comandos)`
                }
                className="flex-1 bg-transparent text-sys-text text-xs focus:outline-none placeholder-sys-muted"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() && attachments.length === 0}
                className="text-sys-accent hover:text-sys-accentHov disabled:text-sys-muted disabled:opacity-40 transition btn-interactive p-1.5 rounded-xl hover:bg-sys-accent/10"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Pinned Messages Slide-over Panel */}
        {showPinnedModal && (
          <div className="w-80 bg-sys-base border-l border-sys-border flex flex-col h-full select-none shadow-2xl z-30 animate-fadeIn">
            <div className="h-12 border-b border-sys-border px-4 flex items-center justify-between bg-sys-s2">
              <div className="flex items-center space-x-2">
                <Pin className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold text-sys-text">Mensagens Fixadas ({currentPinnedList.length})</h3>
              </div>
              <button
                onClick={() => setShowPinnedModal(false)}
                className="text-sys-muted hover:text-sys-text p-1 rounded-lg hover:bg-sys-s1 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 thin-scrollbar">
              {currentPinnedList.length === 0 ? (
                <div className="py-12 text-center text-xs text-sys-muted space-y-2">
                  <Pin className="w-8 h-8 mx-auto text-sys-muted/40" />
                  <p>Nenhuma mensagem fixada neste canal.</p>
                  <p className="text-[11px] text-sys-muted/60">
                    Fixe mensagens para que elas não sejam apagadas pelo ciclo de 1 hora.
                  </p>
                </div>
              ) : (
                currentPinnedList.map((m) => (
                  <div key={m.id} className="p-3 bg-sys-s2 border border-white/5 rounded-xl space-y-2 relative group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 rounded-full bg-sys-accent flex items-center justify-center text-[9px] font-bold text-white">
                          {(m.author.username || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-sys-text">{m.author.displayName || m.author.username}</span>
                      </div>
                      <button
                        onClick={() => unpinMessage(currentChannel.id, m.id)}
                        className="text-[10px] text-rose-400 hover:underline font-semibold"
                        title="Desfixar"
                      >
                        Desfixar
                      </button>
                    </div>

                    {m.content && (
                      <p className="text-xs text-gray-300 whitespace-pre-wrap leading-relaxed">
                        {m.content}
                      </p>
                    )}

                    {m.attachments && m.attachments.length > 0 && (
                      <div className="space-y-1 pt-1">
                        {m.attachments.map((att, idx) => {
                          const isVid = att.type?.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(att.name || '');
                          if (isVid) {
                            return (
                              <video key={idx} src={att.dataUrl} controls className="max-h-40 rounded-lg w-full bg-black" />
                            );
                          }
                          return (
                            <img key={idx} src={att.dataUrl} alt={att.name} className="max-h-40 rounded-lg object-cover" />
                          );
                        })}
                      </div>
                    )}

                    <div className="text-[9px] text-amber-300/80 font-medium">
                      Fixada permanentemente
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Direct Messages: Recipient User Profile Sidebar */}
        {isDM && showMemberList && currentChannel.recipient && (
          <div className="w-80 bg-sys-s1 p-3 overflow-y-auto hidden xl:block select-none border-l border-sys-border thin-scrollbar">
            <UserProfileCard user={currentChannel.recipient} inline={true} />
          </div>
        )}

        {/* Server Members List Sidebar */}
        {!isDM && showMemberList && currentServer && (
          <div className="w-56 bg-sys-s1/40 p-3 overflow-y-auto hidden lg:block select-none border-l border-sys-border thin-scrollbar">
            <div className="text-[10px] font-semibold text-sys-muted uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
              <span>Membros</span>
              <span className="text-[9px] bg-sys-s2 px-1.5 py-0.5 rounded-full text-sys-muted font-bold">
                {(() => {
                  const uniqueIds = new Set();
                  if (currentUser) uniqueIds.add(currentUser.id);
                  (currentServer.members || []).forEach(m => uniqueIds.add(m.id));
                  return uniqueIds.size;
                })()}
              </span>
            </div>

            {currentServer.roles?.map((role) => {
              const cleanRoleName = (role.name || '').replace(/[\uD800-\uDFFF].*/g, '').trim();

              // Collect members for this role
              const allMembersList = [...(currentServer.members || [])];
              if (currentUser && !allMembersList.some(m => m.id === currentUser.id)) {
                allMembersList.push(currentUser);
              }

              const membersInRole = allMembersList.filter((m) => {
                const userRoleId = m.roleId || 'role-member';
                if (role.id === 'role-member' || role.id === 'role-everyone') {
                  return userRoleId === role.id || userRoleId === 'role-member' || userRoleId === 'role-everyone' || !userRoleId;
                }
                return userRoleId === role.id;
              });

              // Deduplicate members by id
              const uniqueMembers = [];
              const seen = new Set();
              for (const m of membersInRole) {
                if (!seen.has(m.id)) {
                  seen.add(m.id);
                  uniqueMembers.push(m);
                }
              }

              // Sort: Online first, then offline, then alphabetical
              uniqueMembers.sort((a, b) => {
                const aOnline = onlineMembers.some(om => om.id === a.id) || (currentUser && currentUser.id === a.id) || a.status === 'online';
                const bOnline = onlineMembers.some(om => om.id === b.id) || (currentUser && currentUser.id === b.id) || b.status === 'online';
                if (aOnline && !bOnline) return -1;
                if (!aOnline && bOnline) return 1;
                return (a.displayName || a.username || '').localeCompare(b.displayName || b.username || '');
              });

              const isVipWithBot = role.id === 'role-vip';
              const totalCount = uniqueMembers.length + (isVipWithBot ? 1 : 0);

              if (totalCount === 0) return null;

              return (
                <div key={role.id} className="mb-4">
                  <div
                    className="text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1 flex items-center justify-between"
                    style={{ color: role.color }}
                  >
                    <span>{cleanRoleName || role.name}</span>
                    <span className="text-[9px] opacity-70">({totalCount})</span>
                  </div>

                  <div className="space-y-1">
                    {uniqueMembers.map((member) => {
                      const isMe = currentUser?.id === member.id;
                      const liveData = onlineMembers.find(om => om.id === member.id) || (isMe ? currentUser : null) || member;
                      const isOnline = onlineMembers.some(om => om.id === member.id) || isMe || liveData.status === 'online';
                      const displayName = liveData.displayName || liveData.username || 'Usuário';

                      return (
                        <div
                          key={member.id}
                          onClick={() => setSelectedUserForCard(liveData)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setContextMenuUser({
                              user: liveData,
                              x: e.clientX,
                              y: e.clientY
                            });
                          }}
                          className={`flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-sys-s2 cursor-pointer transition group ${
                            !isOnline ? 'opacity-50 hover:opacity-100' : ''
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            {liveData.avatarUrl ? (
                              <AvatarImage
                                src={liveData.avatarUrl}
                                alt={displayName}
                                className="w-7 h-7 rounded-full object-cover border border-white/10"
                              />
                            ) : (
                              <div
                                className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${
                                  liveData.avatarColor || 'from-indigo-500 to-purple-600'
                                } text-white flex items-center justify-center text-[10px] font-bold`}
                              >
                                {getMonogram(displayName)}
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-sys-s1 ${
                                isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' : 'bg-zinc-600'
                              }`}
                            />
                          </div>

                          <div className="flex flex-col truncate flex-1 min-w-0">
                            <div className="flex items-center space-x-1">
                              <span
                                className="text-xs font-semibold truncate group-hover:text-white transition"
                                style={{ color: role.color }}
                              >
                                {displayName}
                              </span>
                              {isMe && (
                                <span className="bg-sys-s3 border border-sys-border text-sys-muted text-[8px] font-bold px-1 py-0.2 rounded">
                                  Você
                                </span>
                              )}
                            </div>
                            {liveData.customStatus?.text ? (
                              <span className="text-[9px] text-sys-muted truncate">
                                {liveData.customStatus.emoji ? `${liveData.customStatus.emoji} ` : ''}
                                {liveData.customStatus.text}
                              </span>
                            ) : liveData.gameStatus ? (
                              <span className="text-[9px] text-emerald-400/80 truncate">
                                Jogando {liveData.gameStatus}
                              </span>
                            ) : (
                              <span className="text-[9px] text-sys-muted/60 truncate">
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {isVipWithBot && (
                      <div className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-sys-s2 cursor-pointer transition">
                        <div className="relative flex-shrink-0">
                          <div className="w-7 h-7 rounded-lg bg-sys-s3 text-amber-300 border border-amber-400/30 flex items-center justify-center text-xs">
                            <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sys-s1 shadow-sm shadow-emerald-500/50" />
                        </div>
                        <div className="flex flex-col truncate">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-semibold text-amber-300">
                              PulseRadio
                            </span>
                            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[7px] font-bold px-1 rounded-full">
                              BOT
                            </span>
                          </div>
                          <span className="text-[9px] text-sys-muted">Áudio 24/7</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* User Context Menu (Right Click) */}
      {contextMenuUser && (
        <UserContextMenu
          targetUser={contextMenuUser.user}
          position={{ x: contextMenuUser.x, y: contextMenuUser.y }}
          onClose={() => setContextMenuUser(null)}
          onOpenProfile={(u) => setSelectedUserForCard(u)}
          onMention={(u) => {
            setInputMessage((prev) => `${prev ? `${prev} ` : ''}@${u.username || u.displayName} `);
          }}
        />
      )}

      {selectedUserForCard && (
        <UserProfileCard
          user={selectedUserForCard}
          onClose={() => setSelectedUserForCard(null)}
        />
      )}
    </div>
  );
};
