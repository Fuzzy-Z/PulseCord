import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  X,
  Copy,
  Check,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Send,
  ShieldCheck
} from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';
import { AvatarImage } from './AvatarImage';
import { StatusBadge } from './StatusBadge';
import { encodeServerToInvite } from '../utils/inviteUtils';

export const InviteModal = () => {
  const {
    isInviteModalOpen,
    setIsInviteModalOpen,
    currentServer,
    getServerInvite,
    generateNewInvite,
    sendInviteDM,
    onlineMembers
  } = useServer();
  const { currentUser } = useSocket();

  const [inviteData, setInviteData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentMap, setSentMap] = useState({}); // userId -> true

  const initialCode = inviteData?.inviteCode || currentServer?.inviteCode || encodeServerToInvite(currentServer);
  const inviteCode = inviteData?.inviteCode || initialCode;
  const inviteUrl = inviteData?.inviteUrl || `https://voxel.gg/invite/${inviteCode}`;

  useEffect(() => {
    if (isInviteModalOpen && currentServer) {
      setLoading(true);
      getServerInvite(currentServer.id).then((res) => {
        setLoading(false);
        if (res && res.success && res.inviteCode) {
          setInviteData(res);
        }
      });
    } else {
      setCopied(false);
      setSentMap({});
      setSearchTerm('');
    }
  }, [isInviteModalOpen, currentServer]);

  if (!isInviteModalOpen || !currentServer) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerateNew = async () => {
    setGenerating(true);
    const fresh = encodeServerToInvite(currentServer, true);

    // Immediate optimistic local update with new unique link
    setInviteData({
      success: true,
      inviteCode: fresh,
      inviteUrl: `https://voxel.gg/invite/${fresh}`,
      serverId: currentServer.id,
      serverName: currentServer.name,
      memberCount: currentServer.members?.length || 1
    });

    try {
      const res = await generateNewInvite(currentServer.id);
      if (res && res.success && res.inviteCode) {
        setInviteData(res);
      }
    } catch (e) {
      console.warn('Invite generation server fallback used', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendInviteToUser = async (userId) => {
    if (sentMap[userId]) return;
    setSentMap((prev) => ({ ...prev, [userId]: 'sending' }));
    const res = await sendInviteDM(userId, currentServer.id);
    if (res && res.success) {
      setSentMap((prev) => ({ ...prev, [userId]: 'sent' }));
    } else {
      setSentMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // Filter users to invite (exclude myself and users already members of the server)
  const existingMemberIds = new Set([
    currentServer.ownerId,
    ...(currentServer.memberIds || []),
    ...(currentServer.members || []).map((m) => m.id)
  ]);

  const candidates = (onlineMembers || []).filter(
    (u) => u.id !== currentUser?.id
  );

  const filteredCandidates = candidates.filter((u) => {
    const name = u.displayName || u.username || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
      <div className="bg-sys-base border border-sys-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-modal">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sys-accent/20 border border-sys-accent/30 flex items-center justify-center text-sys-accent shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-sys-text tracking-tight">
                Convidar amigos para {currentServer.name}
              </h2>
              <p className="text-sys-muted text-xs flex items-center gap-1.5 mt-0.5">
                <Users className="w-3.5 h-3.5" />
                <span>{currentServer.members?.length || 1} membros no espaço</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsInviteModalOpen(false)}
            className="text-sys-muted hover:text-sys-text p-1.5 rounded-xl hover:bg-sys-s1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Send to Friends */}
        <div>
          <div className="relative mb-2.5">
            <Search className="w-4 h-4 text-sys-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar amigos para convidar..."
              className="w-full bg-sys-s1 border border-sys-border text-sys-text text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-sys-accent placeholder-sys-muted/50 transition"
            />
          </div>

          <div className="max-h-40 overflow-y-auto space-y-1 thin-scrollbar pr-1">
            {filteredCandidates.length > 0 ? (
              filteredCandidates.map((user) => {
                const isAlreadyMember = existingMemberIds.has(user.id);
                const sendStatus = sentMap[user.id];
                const displayName = user.displayName || user.username || 'Usuário';

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-sys-s1 transition group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="relative flex-shrink-0">
                        {user.avatarUrl ? (
                          <AvatarImage
                            src={user.avatarUrl}
                            alt={displayName}
                            className="w-8 h-8 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${
                              user.avatarColor || 'from-indigo-500 to-purple-600'
                            } text-white flex items-center justify-center text-xs font-bold`}
                          >
                            {displayName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="absolute -bottom-0.5 -right-0.5 border-2 border-sys-base rounded-full">
                          <StatusBadge status={user.status || 'online'} size="xs" />
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold text-sys-text truncate group-hover:text-sys-accent transition">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-sys-muted truncate">@{user.username || 'usuario'}</span>
                      </div>
                    </div>

                    <div>
                      {isAlreadyMember ? (
                        <span className="text-[11px] text-sys-muted font-medium px-2.5 py-1 bg-sys-s2 rounded-lg flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Membro</span>
                        </span>
                      ) : sendStatus === 'sent' ? (
                        <span className="text-[11px] text-emerald-400 font-bold px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          <span>Enviado</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendInviteToUser(user.id)}
                          disabled={sendStatus === 'sending'}
                          className="px-3 py-1 bg-sys-accent hover:bg-sys-accentHov text-sys-text font-semibold rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 btn-interactive disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>{sendStatus === 'sending' ? 'Enviando...' : 'Convidar'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-xs text-sys-muted">
                {candidates.length === 0 ? 'Nenhum amigo online para convidar no momento.' : 'Nenhum amigo encontrado na busca.'}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative flex items-center justify-center">
          <div className="border-t border-sys-border w-full"></div>
          <span className="bg-sys-base px-3 text-[10px] font-bold uppercase tracking-wider text-sys-muted flex-shrink-0">
            Ou envie um link de convite
          </span>
        </div>

        {/* Copyable Invite Link Box */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="w-full bg-sys-s1 border border-sys-border text-sys-text font-mono text-xs px-3.5 py-2.5 rounded-xl focus:outline-none select-all"
              />
            </div>
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md flex-shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                  : 'bg-sys-accent hover:bg-sys-accentHov text-sys-text shadow-sys-accent/20'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-sys-muted px-1">
            <span>Código de Convite: <strong className="text-sys-accent font-mono">{inviteCode}</strong></span>
            <button
              onClick={handleGenerateNew}
              disabled={generating}
              className="text-sys-accent hover:underline flex items-center gap-1 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
              <span>Gerar novo link</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
