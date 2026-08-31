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

export const ChatArea = () => {
  const { currentChannel, currentServer, messages, sendMessage, setIsMusicModalOpen } = useServer();
  const { sendMusicControl, activeVoiceChannel } = useVoice();
  const { currentUser } = useSocket();

  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [showSlashHints, setShowSlashHints] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);

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

              return (
                <div
                  key={msg.id}
                  className="flex space-x-3.5 hover:bg-sys-s1 -mx-4 px-4 py-2 rounded-2xl transition-all group"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-xl bg-sys-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5 border border-sys-border">
                    {monogram}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className="font-semibold text-xs hover:underline cursor-pointer tracking-tight"
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

                      <span className="text-[10px] text-sys-muted font-medium">{formatTime(msg.timestamp)}</span>
                    </div>

                    {/* Text Message Body */}
                    <div className="text-xs text-sys-text mt-1 leading-relaxed whitespace-pre-wrap select-text font-normal">
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
          <div className="w-56 bg-sys-s1 p-3 overflow-y-auto hidden lg:block select-none border-l border-sys-border">
            <div className="text-[10px] font-semibold text-sys-muted uppercase tracking-wider mb-2 px-1">
              Membros
            </div>

            {currentServer.roles?.map((role) => {
              const cleanRoleName = (role.name || '').replace(/[\uD800-\uDFFF].*/g, '').trim();

              return (
                <div key={role.id} className="mb-3">
                  <div
                    className="text-[10px] font-bold uppercase tracking-wider mb-1 px-1 flex items-center space-x-1"
                    style={{ color: role.color }}
                  >
                    <span>{cleanRoleName || role.name}</span>
                  </div>

                  <div className="space-y-1">
                    {/* Current User in this role */}
                    {currentUser?.roleId === role.id && (
                      <div className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-sys-s2 cursor-pointer">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-lg bg-sys-accent text-white flex items-center justify-center text-[10px] font-bold">
                            {getMonogram(currentUser.username)}
                          </div>
                          {/* Keeping the active green dot just for presence, as discussed in the plan */}
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-2 border-sys-s1" />
                        </div>
                        <div className="flex flex-col truncate">
                          <span className="text-xs font-semibold text-sys-text truncate">
                            {currentUser.username}
                          </span>
                          <span className="text-[9px] text-sys-muted">Você</span>
                        </div>
                      </div>
                    )}

                    {role.id === 'role-vip' && (
                      <div className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-sys-s2 cursor-pointer">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-lg bg-sys-s3 text-sys-accent flex items-center justify-center text-xs">
                            <Disc3 className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-2 border-sys-s1" />
                        </div>
                        <div className="flex flex-col truncate">
                          <div className="flex items-center space-x-1">
                            <span className="text-xs font-semibold text-sys-text">
                              PulseRadio
                            </span>
                            <span className="bg-sys-accent text-white text-[7px] font-bold px-1 rounded-full">
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
    </div>
  );
};
