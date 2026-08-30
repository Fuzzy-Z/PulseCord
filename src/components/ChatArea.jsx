import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  PlusCircle,
  Smile,
  Disc3,
  Users,
  Image as ImageIcon,
  X,
  Bot,
  Play,
  SkipForward,
  Square
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMemberList, setShowMemberList] = useState(true);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ['😀', '🔥', '❤️', '🎮', '🚀', '⭐', '🎧', '⚡', '🤖', '👑', '😎', '🎉', '👏', '✨'];

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
    setShowEmojiPicker(false);
  };

  if (!currentChannel) {
    return (
      <div className="flex-1 bg-discord-dark flex items-center justify-center text-discord-muted">
        Selecione um canal para conversar
      </div>
    );
  }

  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex-1 bg-discord-dark flex flex-col h-full overflow-hidden">
      {/* Channel Header */}
      <div className="h-12 border-b border-discord-darkest px-4 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center space-x-2 truncate">
          <Hash className="w-6 h-6 text-discord-channel flex-shrink-0" />
          <span className="font-bold text-discord-header text-base truncate">{currentChannel.name}</span>
          {currentChannel.topic && (
            <>
              <span className="text-discord-muted/40">|</span>
              <span className="text-xs text-discord-muted truncate max-w-[400px]">
                {currentChannel.topic}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3 text-discord-muted">
          <button
            onClick={() => setIsMusicModalOpen(true)}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-discord-darker hover:bg-discord-hover text-discord-yellow text-xs transition"
            title="Abrir Player de Música"
          >
            <Disc3 className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline font-medium">Bot de Música</span>
          </button>

          <button
            onClick={() => setShowMemberList(!showMemberList)}
            className={`p-1.5 rounded hover:bg-discord-hover transition ${
              showMemberList ? 'text-discord-header' : 'text-discord-muted'
            }`}
            title="Lista de Membros"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Body: Messages Feed + Member List */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {/* Channel Welcome Banner */}
            <div className="mb-6 pt-4">
              <div className="w-16 h-16 rounded-full bg-discord-darker flex items-center justify-center mb-2">
                <Hash className="w-10 h-10 text-discord-header" />
              </div>
              <h2 className="text-2xl font-bold text-discord-header">
                Bem-vindo ao #{currentChannel.name}!
              </h2>
              <p className="text-discord-muted text-sm mt-1">
                {currentChannel.topic || `Este é o início do canal #${currentChannel.name}.`}
              </p>
            </div>

            <div className="w-full h-[1px] bg-discord-hover/40 my-4" />

            {/* Messages List */}
            {messages.map((msg) => {
              const isBot = msg.author.isBot;

              return (
                <div
                  key={msg.id}
                  className="flex space-x-3.5 hover:bg-discord-darker/40 -mx-4 px-4 py-1.5 rounded transition group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-discord-darkest flex items-center justify-center text-lg flex-shrink-0 mt-0.5 shadow">
                    {msg.author.avatar || '👤'}
                  </div>

                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span
                        className="font-semibold text-sm hover:underline cursor-pointer"
                        style={{ color: msg.author.roleColor || '#f2f3f5' }}
                      >
                        {msg.author.username}
                      </span>

                      {/* Bot / Role Tag */}
                      {isBot ? (
                        <span className="bg-discord-brand text-white text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                          BOT
                        </span>
                      ) : (
                        msg.author.roleName && (
                          <span
                            className="text-[10px] font-semibold px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor: `${msg.author.roleColor || '#5865f2'}22`,
                              color: msg.author.roleColor || '#5865f2'
                            }}
                          >
                            {msg.author.roleName}
                          </span>
                        )
                      )}

                      <span className="text-[11px] text-discord-muted">{formatTime(msg.timestamp)}</span>
                    </div>

                    {/* Text Message Body */}
                    <div className="text-sm text-discord-text mt-1 leading-relaxed whitespace-pre-wrap select-text">
                      {msg.content}
                    </div>

                    {/* Image / File Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {msg.attachments.map((att, i) => (
                          <div key={i} className="max-w-md rounded-lg overflow-hidden border border-discord-darker">
                            {att.type?.startsWith('image/') || att.dataUrl?.startsWith('data:image') ? (
                              <img
                                src={att.dataUrl}
                                alt={att.name}
                                className="max-h-64 object-contain rounded bg-black/40"
                              />
                            ) : (
                              <div className="p-3 bg-discord-darkest flex items-center space-x-2 text-xs">
                                <ImageIcon className="w-4 h-4 text-discord-brand" />
                                <span>{att.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
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
            <div className="px-4 py-2 bg-discord-darker/60 flex items-center space-x-3 border-t border-discord-darkest">
              {attachments.map((att, i) => (
                <div key={i} className="relative group rounded bg-discord-darkest p-1.5 border border-discord-dark">
                  <button
                    onClick={() => handleRemoveAttachment(i)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-discord-red rounded-full text-white flex items-center justify-center shadow"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <img src={att.dataUrl} alt={att.name} className="w-16 h-16 object-cover rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Slash Commands Autocomplete Popup */}
          {showSlashHints && (
            <div className="mx-4 mb-2 bg-discord-darkest rounded-lg border border-discord-darker shadow-2xl p-2 z-20 space-y-1">
              <div className="text-[11px] font-bold text-discord-muted uppercase px-2 py-1">
                Comandos de Barra (PulseCord Bot)
              </div>
              {slashCommands
                .filter((c) => c.cmd.startsWith(inputMessage))
                .map((c) => (
                  <button
                    key={c.cmd}
                    type="button"
                    onClick={() => handleSelectCommand(c.cmd)}
                    className="w-full text-left flex items-center justify-between px-2.5 py-1.5 rounded hover:bg-discord-brand text-discord-text hover:text-white transition"
                  >
                    <span className="font-bold text-sm text-discord-brand group-hover:text-white">{c.cmd}</span>
                    <span className="text-xs text-discord-muted truncate max-w-xs">{c.desc}</span>
                  </button>
                ))}
            </div>
          )}

          {/* Message Input Box */}
          <div className="px-4 pb-4 relative">
            <form
              onSubmit={handleSend}
              className="bg-discord-input rounded-lg flex items-center px-4 py-2.5 space-x-3 focus-within:ring-1 focus-within:ring-discord-brand"
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
                className="text-discord-muted hover:text-white transition"
                title="Adicionar Anexo ou Imagem"
              >
                <PlusCircle className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <input
                type="text"
                value={inputMessage}
                onChange={handleInputChange}
                placeholder={`Conversar em #${currentChannel.name} (use / para comandos de bot)`}
                className="flex-1 bg-transparent text-discord-text text-sm focus:outline-none placeholder-discord-muted/60"
              />

              {/* Emoji Picker Toggle */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="text-discord-muted hover:text-discord-yellow transition"
                  title="Emojis"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-10 right-0 bg-discord-darkest p-2 rounded-lg shadow-xl border border-discord-darker grid grid-cols-7 gap-1 z-30">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputMessage((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-8 h-8 flex items-center justify-center text-lg hover:bg-discord-hover rounded"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputMessage.trim() && attachments.length === 0}
                className="text-discord-brand hover:text-discord-brandHover disabled:text-discord-muted/40 transition"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Server Members List Sidebar */}
        {showMemberList && (
          <div className="w-60 bg-discord-darker p-3 overflow-y-auto hidden lg:block select-none border-l border-discord-darkest">
            <div className="text-xs font-bold text-discord-channel uppercase tracking-wider mb-2">
              Membros — {currentServer.roles?.length || 4} Cargos
            </div>

            {currentServer.roles?.map((role) => (
              <div key={role.id} className="mb-3">
                <div
                  className="text-[11px] font-bold uppercase tracking-wider mb-1 px-1 flex items-center space-x-1"
                  style={{ color: role.color }}
                >
                  <span>{role.name}</span>
                </div>

                <div className="space-y-1">
                  {/* Sample members for this role + current user */}
                  {currentUser?.roleId === role.id && (
                    <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-discord-hover cursor-pointer">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-discord-darkest flex items-center justify-center text-sm">
                          {currentUser.avatar || '👑'}
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-discord-green border-2 border-discord-darker" />
                      </div>
                      <div className="flex flex-col truncate">
                        <span className="text-xs font-medium" style={{ color: role.color }}>
                          {currentUser.username}
                        </span>
                        <span className="text-[10px] text-discord-muted">Você</span>
                      </div>
                    </div>
                  )}

                  {role.id === 'role-vip' && (
                    <div className="flex items-center space-x-2 p-1.5 rounded hover:bg-discord-hover cursor-pointer">
                      <div className="relative">
                        <div className="w-8 h-8 rounded-full bg-discord-yellow/20 flex items-center justify-center text-sm">
                          🎵
                        </div>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-discord-green border-2 border-discord-darker" />
                      </div>
                      <div className="flex flex-col truncate">
                        <div className="flex items-center space-x-1">
                          <span className="text-xs font-medium" style={{ color: role.color }}>
                            RythmPulse
                          </span>
                          <span className="bg-discord-brand text-white text-[8px] font-bold px-1 rounded">
                            BOT
                          </span>
                        </div>
                        <span className="text-[10px] text-discord-muted">Tocando música</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
