import React, { useEffect, useState } from 'react';
import { Disc3, Hash, Palette, Volume2, X, Search, ChevronRight } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useServer } from '../context/ServerContext';

const STEPS = [
  {
    icon: Hash,
    color: 'from-indigo-500 to-violet-600',
    title: 'Servidores no topo',
    body: 'Troque de comunidade pelo dock na barra superior. O painel da esquerda mostra os canais da casa atual.',
    tip: 'Clique no ícone do servidor para mudar'
  },
  {
    icon: Volume2,
    color: 'from-emerald-500 to-teal-600',
    title: 'Entre numa sala de voz',
    body: 'Clique num canal de voz para falar, compartilhar tela ou assistir junto. Mute e ensurdecer ficam na barra do usuário.',
    tip: 'Ícone de alto-falante = canal de voz'
  },
  {
    icon: Disc3,
    color: 'from-amber-500 to-orange-600',
    title: 'Música com /play',
    body: 'No chat, digite /play com um link ou rádio. O player também abre pelo atalho na barra superior.',
    tip: 'Funciona com YouTube e rádios online'
  },
  {
    icon: Search,
    color: 'from-cyan-500 to-blue-600',
    title: 'Busca rápida — Ctrl+K',
    body: 'Pressione Ctrl+K para abrir a busca global. Encontre canais, DMs e membros em um só lugar, sem precisar navegar.',
    tip: 'Ctrl+K em qualquer momento'
  },
  {
    icon: Palette,
    color: 'from-rose-500 to-pink-600',
    title: 'Temas e aparência',
    body: 'Em Ajustes → Aparência você muda as cores, o estilo visual e muito mais. Suave, Agressivo ou Liquid Glass — tudo sem Nitro.',
    tip: 'Mais de 20 temas disponíveis'
  }
];

export const OnboardingTour = () => {
  const { isAuthenticated } = useSocket();
  const { setIsUserSettingsOpen } = useServer();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (localStorage.getItem('voxel_onboarded') === 'true') return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  if (!open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;
  const progress = ((step + 1) / STEPS.length) * 100;

  const finish = () => {
    setExiting(true);
    setTimeout(() => {
      localStorage.setItem('voxel_onboarded', 'true');
      setOpen(false);
      setExiting(false);
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-200 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      onClick={finish}
    >
      <div
        className="w-full max-w-sm bg-sys-s2 border border-sys-border rounded-2xl shadow-2xl overflow-hidden animate-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-0.5 bg-sys-border">
          <div
            className="h-full bg-sys-accent transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-sys-border">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sys-muted">
            Boas-vindas ao Voxel · {step + 1} de {STEPS.length}
          </span>
          <button
            onClick={finish}
            className="p-1 text-sys-muted hover:text-sys-text transition rounded-md hover:bg-sys-s3"
            title="Pular tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {/* Icon with gradient */}
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-7 h-7 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-extrabold text-sys-text tracking-tight">{current.title}</h2>
            <p className="text-sm text-sys-muted leading-relaxed">{current.body}</p>
          </div>

          {/* Tip pill */}
          <div className="flex items-center gap-2 px-3 py-2 bg-sys-s3 rounded-xl border border-sys-border">
            <span className="text-[9px] font-black uppercase tracking-widest text-sys-accent">Dica</span>
            <span className="text-xs text-sys-muted">{current.tip}</span>
          </div>

          {/* Dots */}
          <div className="flex gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === step ? 'w-6 bg-sys-accent' : i < step ? 'w-2 bg-sys-accent/50' : 'w-2 bg-sys-border'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-sys-border flex justify-between items-center">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="px-3 py-2 text-xs font-semibold text-sys-muted disabled:opacity-30 hover:text-sys-text transition rounded-lg hover:bg-sys-s3 disabled:hover:bg-transparent"
          >
            Voltar
          </button>
          <button
            onClick={() => {
              if (isLast) {
                finish();
                setTimeout(() => setIsUserSettingsOpen(true), 250);
              } else {
                setStep((s) => s + 1);
              }
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-bold rounded-xl btn-interactive bg-gradient-to-r ${current.color} shadow-sm`}
          >
            {isLast ? 'Abrir aparência' : 'Próximo'}
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
