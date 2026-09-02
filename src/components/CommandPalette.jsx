import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Hash, MessageSquare, Search, User, Volume2 } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';

export const CommandPalette = () => {
  const {
    servers,
    dms,
    onlineMembers,
    selectServer,
    selectChannel,
    selectDM,
    openDM,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen
  } = useServer();
  const { currentUser } = useSocket();
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      const isPalette = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      if (isPalette) {
        e.preventDefault();
        setIsCommandPaletteOpen((open) => !open);
      } else if (e.key === 'Escape') {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setIsCommandPaletteOpen]);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isCommandPaletteOpen]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = [];

    servers.forEach((server) => {
      (server.channels || []).forEach((channel) => {
        items.push({
          id: `ch-${channel.id}`,
          type: channel.type,
          label: `#${channel.name}`,
          hint: server.name,
          run: () => {
            selectServer(server.id);
            selectChannel(channel.id);
          }
        });
      });
    });

    dms.forEach((dm) => {
      items.push({
        id: `dm-${dm.id}`,
        type: 'dm',
        label: dm.name || 'Conversa',
        hint: 'Mensagem direta',
        run: () => selectDM(dm.id)
      });
    });

    const seen = new Set();
    onlineMembers.forEach((member) => {
      if (!member?.id || member.id === currentUser?.id || seen.has(member.id)) return;
      seen.add(member.id);
      items.push({
        id: `user-${member.id}`,
        type: 'user',
        label: member.displayName || member.username,
        hint: member.username ? `@${member.username}` : 'Membro',
        run: () => openDM(member.id, member)
      });
    });

    if (!q) return items.slice(0, 12);
    return items
      .filter((item) => `${item.label} ${item.hint}`.toLowerCase().includes(q))
      .slice(0, 16);
  }, [query, servers, dms, onlineMembers, currentUser, selectServer, selectChannel, selectDM, openDM]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  if (!isCommandPaletteOpen) return null;

  const runItem = (item) => {
    item.run();
    setIsCommandPaletteOpen(false);
  };

  const iconFor = (type) => {
    if (type === 'voice') return <Volume2 className="w-3.5 h-3.5 text-emerald-400" />;
    if (type === 'forum') return <MessageSquare className="w-3.5 h-3.5 text-sys-accent" />;
    if (type === 'dm' || type === 'user') return <User className="w-3.5 h-3.5 text-sys-accent" />;
    return <Hash className="w-3.5 h-3.5 text-sys-muted" />;
  };

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/50 flex items-start justify-center pt-[12vh] px-4"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-sys-s2 border border-sys-border rounded-2xl shadow-2xl overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-sys-border">
          <Search className="w-4 h-4 text-sys-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex((i) => Math.max(i - 1, 0));
              } else if (e.key === 'Enter' && results[activeIndex]) {
                e.preventDefault();
                runItem(results[activeIndex]);
              }
            }}
            placeholder="Buscar canais, DMs e membros..."
            className="flex-1 bg-transparent text-sm text-sys-text outline-none placeholder-sys-muted"
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-sys-s3 border border-sys-border text-sys-muted">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1 thin-scrollbar">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-sys-muted">Nenhum resultado.</p>
          ) : (
            results.map((item, index) => (
              <button
                key={item.id}
                onClick={() => runItem(item)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-xs ${
                  index === activeIndex ? 'bg-sys-accent/15 text-sys-text' : 'text-sys-muted hover:bg-sys-s3'
                }`}
              >
                {iconFor(item.type)}
                <span className="flex-1 truncate font-medium text-sys-text">{item.label}</span>
                <span className="text-[10px] text-sys-muted truncate max-w-[140px]">{item.hint}</span>
              </button>
            ))
          )}
        </div>
        <div className="px-4 py-2 border-t border-sys-border text-[10px] text-sys-muted">
          Ctrl+K · ↑↓ para navegar · Enter para abrir
        </div>
      </div>
    </div>
  );
};
