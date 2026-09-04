import React, { useState } from 'react';
import { Sparkles, X, UserPlus, LogIn, Compass, ArrowRight } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const CreateServerModal = () => {
  const { isAddServerOpen, setIsAddServerOpen, createServer, joinServerInvite } = useServer();
  const [tab, setTab] = useState('create'); // 'create' | 'join'
  
  // Create state
  const [newServerName, setNewServerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('from-indigo-500 to-purple-600');

  // Join state
  const [inviteInput, setInviteInput] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joining, setJoining] = useState(false);

  const colorPresets = [
    { name: 'Indigo', gradient: 'from-indigo-500 to-purple-600' },
    { name: 'Cyan', gradient: 'from-cyan-500 to-blue-600' },
    { name: 'Rose', gradient: 'from-rose-500 to-pink-600' },
    { name: 'Emerald', gradient: 'from-emerald-500 to-teal-600' },
    { name: 'Amber', gradient: 'from-amber-500 to-orange-600' },
    { name: 'Violet', gradient: 'from-purple-500 to-indigo-600' }
  ];

  if (!isAddServerOpen) return null;

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newServerName.trim()) return;
    const monogram = newServerName.trim().substring(0, 2).toUpperCase();
    createServer(newServerName.trim(), monogram);
    setNewServerName('');
    setIsAddServerOpen(false);
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    if (!inviteInput.trim()) return;
    setJoinError('');
    setJoining(true);

    const res = await joinServerInvite(inviteInput.trim());
    setJoining(false);

    if (res && res.success) {
      setInviteInput('');
      setIsAddServerOpen(false);
    } else {
      setJoinError(res?.error || 'Convite inválido ou expirado.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
      <div className="bg-sys-base border border-sys-border w-full max-w-md rounded-3xl p-6 shadow-2xl space-y-5 animate-modal">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sys-accent/20 border border-sys-accent/30 flex items-center justify-center text-sys-accent shadow-sm">
              {tab === 'create' ? <Sparkles className="w-5 h-5" /> : <Compass className="w-5 h-5" />}
            </div>
            <div className="text-left">
              <h2 className="text-base font-bold text-sys-text tracking-tight">
                {tab === 'create' ? 'Criar um Espaço' : 'Entrar em um Espaço'}
              </h2>
              <p className="text-sys-muted text-xs">
                {tab === 'create' ? 'Crie um servidor exclusivo para você e seus amigos' : 'Junte-se a um servidor existente através de um convite'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsAddServerOpen(false);
              setJoinError('');
            }}
            className="text-sys-muted hover:text-sys-text p-1.5 rounded-xl hover:bg-sys-s1 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-sys-s1 rounded-2xl border border-sys-border">
          <button
            type="button"
            onClick={() => {
              setTab('create');
              setJoinError('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              tab === 'create'
                ? 'bg-sys-accent text-sys-text shadow-sm'
                : 'text-sys-muted hover:text-sys-text hover:bg-sys-s2'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Criar Servidor</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('join');
              setJoinError('');
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
              tab === 'join'
                ? 'bg-sys-accent text-sys-text shadow-sm'
                : 'text-sys-muted hover:text-sys-text hover:bg-sys-s2'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Entrar com Convite</span>
          </button>
        </div>

        {/* Create Server Form */}
        {tab === 'create' && (
          <form onSubmit={handleCreateSubmit} className="text-left space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                Estilo Visual
              </label>
              <div className="flex justify-center gap-2 py-2.5 px-3 bg-sys-s2 rounded-2xl border border-sys-border">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setSelectedColor(preset.gradient)}
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${preset.gradient} transition-all ${
                      selectedColor === preset.gradient
                        ? 'ring-2 ring-white scale-110 shadow-lg'
                        : 'opacity-70 hover:opacity-100 hover:scale-105'
                    }`}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                Nome do Servidor
              </label>
              <input
                type="text"
                required
                value={newServerName}
                onChange={(e) => setNewServerName(e.target.value)}
                placeholder="Ex: Espaço de Jogos, Cyber Lounge..."
                className="w-full bg-sys-s1 border border-sys-border text-sys-text px-4 py-3 rounded-2xl focus:outline-none focus:border-sys-accent text-xs placeholder-sys-muted/50"
                autoFocus
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-sys-border">
              <button
                type="button"
                onClick={() => setIsAddServerOpen(false)}
                className="px-4 py-2 text-xs font-medium text-sys-muted hover:text-sys-text transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-sys-accent hover:bg-sys-accentHov text-sys-text rounded-xl text-xs font-semibold transition shadow-lg btn-interactive"
              >
                Criar Espaço
              </button>
            </div>
          </form>
        )}

        {/* Join Server Form */}
        {tab === 'join' && (
          <form onSubmit={handleJoinSubmit} className="text-left space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                Link ou Código de Convite *
              </label>
              <input
                type="text"
                required
                value={inviteInput}
                onChange={(e) => {
                  setInviteInput(e.target.value);
                  setJoinError('');
                }}
                placeholder="Ex: https://voxel.gg/invite/ABC123Z ou ABC123Z"
                className="w-full bg-sys-s1 border border-sys-border text-sys-text px-4 py-3 rounded-2xl focus:outline-none focus:border-sys-accent text-xs placeholder-sys-muted/50 font-mono"
                autoFocus
              />
              <p className="text-[11px] text-sys-muted mt-2">
                Exemplos de convite aceitos:
                <br />
                <span className="font-mono text-sys-accent/90">https://voxel.gg/invite/X1Y2Z3</span>, <span className="font-mono text-sys-accent/90">PC-X1Y2Z3</span> ou <span className="font-mono text-sys-accent/90">X1Y2Z3</span>
              </p>
            </div>

            {joinError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-medium">
                {joinError}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-3 border-t border-sys-border">
              <button
                type="button"
                onClick={() => setIsAddServerOpen(false)}
                className="px-4 py-2 text-xs font-medium text-sys-muted hover:text-sys-text transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={joining || !inviteInput.trim()}
                className="px-6 py-2.5 bg-sys-accent hover:bg-sys-accentHov text-sys-text rounded-xl text-xs font-semibold transition shadow-lg btn-interactive disabled:opacity-50 flex items-center gap-2"
              >
                <span>{joining ? 'Entrando...' : 'Entrar no Espaço'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
