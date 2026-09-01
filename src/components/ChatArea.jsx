import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  PlusCircle,
  Disc3,
  Users,
  Image as ImageIcon,
  X,
  Sparkles,
  Paperclip
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useVoice } from '../context/VoiceContext';
import { useSocket } from '../context/SocketContext';
import { UserProfileCard } from './UserProfileCard';

export const ChatArea = () => {
  const { currentChannel, currentServer, messages, sendMessage, setIsMusicModalOpen, onlineMembers } = useServer();
  const { sendMusicControl, activeVoiceChannel } = useVoice();
  const { currentUser } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showSlashHints, setShowSlashHints] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);
  const [selectedUserForCard, setSelectedUserForCard] = useState(null);
  
  const [compactMode, setCompactMode] = useState(() => {
    return localStorage.getItem('pulsecord_compact_mode') === 'true';
  });

  const [contextMenuMsg, setContextMenuMsg] = useState(null);
  const { pinMessage, unpinMessage, pinnedMessages, activeView } = useServer();

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
    { cmd: '/help', desc: 'Ajuda e guia de comandos do PulseCord' }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      <div className="flex-1 bg-sys-s2 flex items-center justify-center text-sys-muted text-sm">
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

  return (
    <div className="flex-1 bg-black/20 backdrop-blur-2xl flex flex-col h-full overflow-hidden select-none">
      {/* Channel Header */}
      <div className="h-12 border-b border-sys-border px-4 flex items-center justify-between flex-shrink-0 bg-sys-s3">
        <div className="flex items-center space-x-2.5 truncate">
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

        <div className="flex items-center space-x-2 text-sys-muted">
          <button
            onClick={() => setIsMusicModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-sys-s1 border border-sys-border text-sys-text text-xs font-medium transition btn-interactive"
            title="Abrir Player de Música"
          >
            <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span className="hidden sm:inline">Player</span>
          </button>

          <button
            onClick={() => setShowMemberList(!showMemberList)}
            className={`p-2 rounded-xl transition btn-interactive ${
              showMemberList ? 'text-sys-text bg-sys-s1' : 'text-sys-muted hover:text-sys-text hover:bg-sys-s1'
            }`}
            title="Lista de Membros"
          >
            <Users className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body: Messages Feed + Member List */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4 thin-scrollbar">
            {/* Channel Welcome Banner */}
            <div className="mb-6 pt-4 px-3 bg-sys-s3 rounded-3xl p-5 border border-sys-border">
              <div className="w-12 h-12 rounded-2xl bg-sys-accent flex items-center justify-center mb-3 shadow-sm">
                <Hash className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-sys-text tracking-tight">
                Canal #{currentChannel.name}
              </h2>
              <p className="text-sys-muted text-xs mt-1 leading-relaxed">
                {currentChannel.topic || `Este é o início do canal #${currentChannel.name}. Envie mensagens em tempo real ou digite / para comandos.`}
              </p>
            </div>

            <div className="w-full h-[1px] bg-sys-border my-4" />

            {/* Messages List */}
            {messages.map((msg) => {
              const isBot = msg.author.isBot;
              const monogram = getMonogram(msg.author.username);
              const isPinned = (pinnedMessages[currentChannel.id] || []).some(m => m.id === msg.id);

              return (
                <div
                  key={msg.id}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenuMsg(contextMenuMsg === msg.id ? null : msg.id);
                  }}
                  className={`flex space-x-3.5 hover:bg-sys-s1 -mx-4 px-4 py-2 rounded-2xl transition-all group relative ${isPinned ? 'bg-yellow-500/10 border border-yellow-500/20' : ''} ${compactMode ? 'py-0.5 space-x-2' : ''}`}
                >
                  {/* Avatar */}
                  {!compactMode && (
                    <div className="flex-shrink-0 mt-0.5">
                      {msg.author.avatarUrl ? (
                        <img 
                          src={msg.author.avatarUrl} 
                          alt={msg.author.username} 
                          className="w-9 h-9 rounded-xl object-cover border border-sys-border shadow-sm" 
                        />
                      ) : (
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${msg.author.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-xs font-bold text-white border border-sys-border shadow-sm`}>
                          {monogram}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center space-x-2 ${compactMode ? 'inline-flex mr-2' : ''}`}>
                      {compactMode && (
                        <span className="text-[10px] text-sys-muted font-medium w-12 text-right">
                          {formatTime(msg.timestamp)}
                        </span>
                      )}
                      <span
                        className={`font-semibold text-xs hover:underline cursor-pointer tracking-tight ${compactMode ? 'ml-2' : ''}`}
                        style={{ color: msg.author.roleColor || '#ffffff' }}
                      >
                        {msg.author.username}
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

                      {!compactMode && <span className="text-[10px] text-sys-muted font-medium">{formatTime(msg.timestamp)}</span>}
                    </div>

                    {/* Text Message Body */}
                    <div className={`text-xs text-sys-text mt-1 leading-relaxed whitespace-pre-wrap select-text font-normal ${compactMode ? 'mt-0 inline' : ''}`}>
                      {msg.content}
                    </div>

                    {/* Image / File Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-2.5">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="max-w-md rounded-2xl overflow-hidden border border-sys-border shadow-sm">
                            {att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image') ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="max-h-64 object-contain rounded-2xl bg-sys-s1 hover:opacity-95 transition"
                              />
                            ) : (
                              <div className="p-3 bg-sys-s1 flex items-center space-x-2 text-xs">
                                <ImageIcon className="w-4 h-4 text-sys-accent" />
                                <span className="font-medium text-sys-text">{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.attachmentExpired && (
                      <div className="mt-1.5 text-[10px] text-sys-muted italic flex items-center space-x-1">
                        <span>Imagem removida após 1h para economizar dados do servidor.</span>
                      </div>
                    )}
                  </div>

                  {/* Context Menu / Pin Actions */}
                  {contextMenuMsg === msg.id && (
                    <div className="absolute right-4 top-2 bg-sys-s3 border border-sys-border shadow-2xl rounded-xl py-1 z-20 text-xs">
                      {isPinned ? (
                        <button 
                          onClick={() => { unpinMessage(currentChannel.id, msg.id); setContextMenuMsg(null); }}
                          className="w-full text-left px-4 py-2 hover:bg-sys-s1 text-sys-text transition"
                        >
                          Desfixar Mensagem
                        </button>
                      ) : (
                        <button 
                          onClick={() => { pinMessage(currentChannel.id, msg); setContextMenuMsg(null); }}
                          className="w-full text-left px-4 py-2 hover:bg-sys-s1 text-sys-text transition"
                        >
                          Fixar Mensagem
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Attachment Preview Bar */}
          {attachments.length > 0 && (
            <div className="px-5 py-2 bg-sys-s2 flex items-center space-x-3 border-t border-sys-border">
              {attachments.map((att, i) => (
                <div key={i} className="relative group rounded-2xl bg-sys-s3 p-1.5 border border-sys-border shadow-md">
                  <button
                    onClick={() => handleRemoveAttachment(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 hover:bg-rose-600 rounded-full text-white flex items-center justify-center shadow-lg transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <img src={att.dataUrl} alt={att.name} className="w-16 h-16 object-cover rounded-xl" />
                </div>
              ))}
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
              className="bg-sys-s3 border border-sys-border rounded-2xl flex items-center px-4 py-3 space-x-3 transition-all focus-within:border-sys-accent focus-within:shadow-[0_0_10px_var(--color-accent)] focus-within:shadow-sys-accent/20"
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
                className="text-sys-muted hover:text-sys-text transition btn-interactive"
                title="Adicionar Arquivo"
              >
                <PlusCircle className="w-4 h-4" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder={`Mensagem em #${currentChannel.name} (use / para bot)`}
                className="flex-1 bg-transparent text-sys-text text-xs focus:outline-none placeholder-sys-muted"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() && attachments.length === 0}
                className="text-sys-accent hover:text-sys-accentHov disabled:text-sys-muted disabled:opacity-50 transition btn-interactive p-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Server Members List Sidebar */}
        {showMemberList && (
          <div className="w-56 bg-sys-s1 p-3 overflow-y-auto hidden lg:block select-none border-l border-sys-border thin-scrollbar">
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
                          className={`flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-sys-s2 cursor-pointer transition group ${
                            !isOnline ? 'opacity-50 hover:opacity-100' : ''
                          }`}
                        >
                          <div className="relative flex-shrink-0">
                            {liveData.avatarUrl ? (
                              <img
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

      {selectedUserForCard && (
        <UserProfileCard
          user={selectedUserForCard}
          onClose={() => setSelectedUserForCard(null)}
        />
      )}
    </div>
  );
};
