import React, { useState } from 'react';
import { X, Play, Share2, Trash2, Video, Download } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const ClipManagerModal = () => {
  const { isClipManagerOpen, setIsClipManagerOpen } = useServer();
  const [selectedClip, setSelectedClip] = useState(null);

  // Mock clips data
  const [clips, setClips] = useState([
    {
      id: 1,
      title: 'Clutch no CS:GO',
      date: '2026-10-10 14:30',
      duration: '0:30',
      thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400',
      size: '25 MB'
    },
    {
      id: 2,
      title: 'Meme Engraçado',
      date: '2026-10-09 21:15',
      duration: '0:15',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400',
      size: '12 MB'
    }
  ]);

  if (!isClipManagerOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none animate-fade-in">
      <div className="bg-sys-base w-full max-w-4xl h-[75vh] rounded-3xl shadow-2xl overflow-hidden border border-sys-border flex flex-col animate-modal">
        {/* Header */}
        <div className="h-14 px-6 border-b border-sys-border bg-sys-s2 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <Video className="w-5 h-5 text-sys-accent" />
            <h2 className="text-sm font-bold text-sys-text">Meus Clipes</h2>
            <span className="bg-sys-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ml-2">Beta</span>
          </div>
          <button
            onClick={() => setIsClipManagerOpen(false)}
            className="p-2 text-sys-muted hover:text-sys-text hover:bg-sys-s3 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Clips List */}
          <div className="w-1/3 bg-sys-s1 border-r border-sys-border p-4 overflow-y-auto thin-scrollbar">
            {clips.length === 0 ? (
              <div className="text-center text-sys-muted text-xs mt-10">
                Nenhum clipe gravado ainda. Use Alt+C durante uma chamada.
              </div>
            ) : (
              <div className="space-y-3">
                {clips.map(clip => (
                  <div
                    key={clip.id}
                    onClick={() => setSelectedClip(clip)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                      selectedClip?.id === clip.id
                        ? 'bg-sys-s3 border-sys-accent shadow-md'
                        : 'bg-sys-s2 border-sys-border hover:border-sys-accent/40'
                    }`}
                  >
                    <div className="relative rounded-xl overflow-hidden mb-2 border border-black/20">
                      <img src={clip.thumbnail} alt={clip.title} className="w-full h-24 object-cover" />
                      <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] font-bold text-white backdrop-blur-md">
                        {clip.duration}
                      </div>
                    </div>
                    <h3 className="text-xs font-bold text-sys-text truncate">{clip.title}</h3>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-sys-muted font-medium">
                      <span>{clip.date}</span>
                      <span>{clip.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Clip Viewer */}
          <div className="w-2/3 bg-black flex flex-col items-center justify-center relative p-6">
            {selectedClip ? (
              <div className="w-full h-full flex flex-col relative bg-sys-s3 border border-sys-border rounded-3xl overflow-hidden shadow-2xl">
                <div className="flex-1 relative flex items-center justify-center bg-black">
                  <img src={selectedClip.thumbnail} alt="Video Player Placeholder" className="w-full h-full object-cover opacity-60" />
                  <button className="absolute w-16 h-16 bg-sys-accent/80 hover:bg-sys-accent text-white rounded-full flex items-center justify-center transition-all shadow-xl backdrop-blur-sm hover:scale-110">
                    <Play className="w-6 h-6 ml-1" />
                  </button>
                </div>
                <div className="h-20 bg-sys-s2 px-5 flex items-center justify-between border-t border-sys-border">
                  <div>
                    <h3 className="text-sm font-bold text-sys-text">{selectedClip.title}</h3>
                    <p className="text-xs text-sys-muted">{selectedClip.date}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 bg-sys-s3 hover:bg-sys-s1 border border-sys-border rounded-xl text-sys-text transition" title="Baixar">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-sys-accent hover:bg-sys-accentHov text-white rounded-xl transition shadow-sm" title="Compartilhar">
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        setClips(clips.filter(c => c.id !== selectedClip.id));
                        setSelectedClip(null);
                      }}
                      className="p-2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-transparent rounded-xl transition" 
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sys-muted text-center space-y-3">
                <Video className="w-12 h-12 mx-auto opacity-20" />
                <p className="text-xs">Selecione um clipe para visualizar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
