import React from 'react';

export const USER_STATUSES = [
  {
    id: 'online',
    name: 'Disponível',
    desc: 'Visível e pronto para conversar',
    color: '#10b981',
    bgColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500'
  },
  {
    id: 'idle',
    name: 'Ausente',
    desc: 'Ausente temporariamente',
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500'
  },
  {
    id: 'dnd',
    name: 'Não Perturbe',
    desc: 'Não receberá sons de notificações nem chamadas',
    color: '#ef4444',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500'
  },
  {
    id: 'invisible',
    name: 'Invisível',
    desc: 'Aparece como offline para os outros',
    color: '#71717a',
    bgColor: 'bg-zinc-500',
    borderColor: 'border-zinc-500'
  }
];

export const getStatusInfo = (status) => {
  if (!status || status === 'offline') {
    return {
      id: 'offline',
      name: 'Offline',
      desc: 'Desconectado',
      color: '#71717a',
      bgColor: 'bg-zinc-500',
      borderColor: 'border-zinc-500'
    };
  }
  return USER_STATUSES.find((s) => s.id === status) || USER_STATUSES[0];
};

export const StatusBadge = ({ status = 'online', size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
    xl: 'w-5 h-5'
  };

  const currentSize = sizeClasses[size] || sizeClasses.sm;

  if (status === 'idle') {
    return (
      <div
        className={`relative rounded-full bg-amber-500 flex items-center justify-center ${currentSize} ${className}`}
        title="Ausente"
      >
        <div className="absolute top-0 left-0 w-[55%] h-[55%] rounded-full bg-sys-s2 -translate-x-[15%] -translate-y-[15%]" />
      </div>
    );
  }

  if (status === 'dnd') {
    return (
      <div
        className={`relative rounded-full bg-red-500 flex items-center justify-center ${currentSize} ${className}`}
        title="Não Perturbe"
      >
        <div className="w-[60%] h-[20%] bg-white rounded-full" />
      </div>
    );
  }

  if (status === 'invisible' || status === 'offline') {
    return (
      <div
        className={`relative rounded-full bg-zinc-500 flex items-center justify-center ${currentSize} ${className}`}
        title={status === 'invisible' ? 'Invisível' : 'Offline'}
      >
        <div className="w-[50%] h-[50%] rounded-full bg-sys-s2" />
      </div>
    );
  }

  // Default: Online
  return (
    <div
      className={`rounded-full bg-emerald-500 ${currentSize} ${className}`}
      title="Disponível"
    />
  );
};
