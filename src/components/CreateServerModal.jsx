import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const CreateServerModal = () => {
  const { isAddServerOpen, setIsAddServerOpen, createServer } = useServer();
  const [newServerName, setNewServerName] = useState('');
  const [selectedColor, setSelectedColor] = useState('from-indigo-500 to-purple-600');

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

  return (
    <div className="fixed inset-0 bg-sys-s3 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-sys-base border border-sys-border w-full max-w-md rounded-3xl p-6 shadow-2xl border border-sys-border animate-modal">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-sys-accent flex items-center justify-center text-sys-text shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-sys-text tracking-tight">Criar Espaço</h2>
              <p className="text-sys-muted text-xs">Novo servidor de voz e texto</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddServerOpen(false)}
            className="text-sys-muted hover:text-sys-text p-1.5 rounded-xl hover:bg-sys-s1 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
              placeholder="Ex: Espaço de Criação"
              className="w-full bg-sys-s1 border border-sys-border text-sys-text text-sys-text px-4 py-3 rounded-2xl focus:outline-none text-xs placeholder-sys-muted/50"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-sys-border">
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
      </div>
    </div>
  );
};

