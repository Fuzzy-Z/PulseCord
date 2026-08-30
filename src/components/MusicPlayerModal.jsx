import React, { useState } from 'react';
import {
  Disc3,
  Search,
  Play,
  Pause,
  SkipForward,
  Square,
  Volume2,
  ListMusic,
  Radio,
  X,
  Plus
} from 'lucide-react';
import { useVoice } from '../context/VoiceContext';
import { useServer } from '../context/ServerContext';

export const MusicPlayerModal = () => {
  const { isMusicModalOpen, setIsMusicModalOpen } = useServer();
  const { musicPlayer, sendMusicControl, activeVoiceChannel } = useVoice();
  const [searchQuery, setSearchQuery] = useState('');

  if (!isMusicModalOpen) return null;

  const presets = [
    {
      id: 'lofi',
      title: 'Lofi Chill Study Beats',
      artist: 'PulseCord Music Bot',
      cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=300&h=300&fit=crop',
      genre: 'Lofi / Chill'
    },
    {
      id: 'synthwave',
      title: 'Synthwave & Retrowave 80s',
      artist: 'Nightdrive FM',
      cover: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=300&h=300&fit=crop',
      genre: 'Synthwave'
    },
    {
      id: 'gaming',
      title: 'Gaming Energy & Electronic Drops',
      artist: 'Pulse EDM',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
      genre: 'EDM / Trap'
    },
    {
      id: 'piano',
      title: 'Chillout Ambient Lounge & Piano',
      artist: 'Acoustic Vibes',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
      genre: 'Acoustic / Piano'
    },
    {
      id: 'hiphop',
      title: 'Classic Boom Bap & Underground',
      artist: 'Street Beats Bot',
      cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
      genre: 'Hip Hop / Rap'
    }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    sendMusicControl('play', searchQuery.trim());
    setSearchQuery('');
  };

  const handlePlayPreset = (presetId) => {
    sendMusicControl('play', presetId);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xl flex items-center justify-center z-50 p-4 select-none">
      <div className="glass-modal w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/15 flex flex-col max-h-[85vh] animate-modal">
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/[0.06] bg-black/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
              <Disc3 className="w-5 h-5 text-amber-300 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Player de Áudio & Rádio 24/7</h2>
              <p className="text-xs text-slate-400">
                {activeVoiceChannel
                  ? 'Conectado ao seu canal de voz ativo'
                  : 'Entre em um canal de voz para ouvir em sincronia'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMusicModalOpen(false)}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition btn-interactive"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6 thin-scrollbar">
          {/* Search / URL Input */}
          <div className="space-y-2">
            <form onSubmit={handleSearchSubmit} className="flex space-x-2.5">
              <div className="flex-1 glass-input rounded-2xl flex items-center px-4">
                <Search className="w-4 h-4 text-slate-400 mr-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cole links do YouTube, Spotify, SoundCloud ou busque qualquer música..."
                  className="w-full bg-transparent py-3 text-white text-xs focus:outline-none placeholder-slate-500"
                />
              </div>
              <button
                type="submit"
                disabled={!searchQuery.trim()}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold rounded-2xl text-xs transition shadow-lg btn-interactive"
              >
                Tocar
              </button>
            </form>

            <div className="flex items-center space-x-2 px-1 text-[11px] text-slate-400">
              <span className="text-slate-500">Suporte integrado:</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-semibold">YouTube</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold">Spotify</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-semibold">SoundCloud</span>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">Web Audio</span>
            </div>
          </div>

          {/* Now Playing Card */}
          {musicPlayer.currentTrack ? (
            <div className="glass-panel rounded-3xl p-5 border border-amber-400/30 shadow-2xl flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-5">
              <div className="relative group">
                <img
                  src={musicPlayer.currentTrack.cover}
                  alt="Cover"
                  className="w-24 h-24 rounded-2xl object-cover shadow-md border border-white/10"
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Radio className="w-6 h-6 text-amber-300 animate-pulse" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left truncate">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Reproduzindo Agora
                </div>
                <h3 className="text-base font-bold text-white truncate mt-0.5">
                  {musicPlayer.currentTrack.title}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {musicPlayer.currentTrack.artist}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-center md:justify-start space-x-2.5 mt-3.5">
                  <button
                    onClick={() => sendMusicControl(musicPlayer.isPlaying ? 'pause' : 'resume')}
                    className="p-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-bold transition shadow-lg btn-interactive"
                  >
                    {musicPlayer.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                  </button>
                  <button
                    onClick={() => sendMusicControl('skip')}
                    className="p-2.5 rounded-2xl glass-pill text-slate-300 hover:text-white transition btn-interactive"
                    title="Pular"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => sendMusicControl('stop')}
                    className="p-2.5 rounded-2xl glass-pill hover:bg-rose-500/30 text-slate-300 hover:text-rose-400 transition btn-interactive"
                    title="Parar"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 glass-panel rounded-3xl text-center text-slate-400">
              <Disc3 className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">Nenhuma faixa em reprodução</p>
              <p className="text-xs mt-1 text-slate-500">Selecione uma estação abaixo ou pesquise uma faixa.</p>
            </div>
          )}

          {/* Curated Radio Stations */}
          <div>
            <h4 className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-3 px-1">
              Estações e Playlists em Destaque
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handlePlayPreset(preset.id)}
                  className="flex items-center space-x-3 p-3 glass-panel rounded-2xl cursor-pointer hover:border-white/20 transition group"
                >
                  <img
                    src={preset.cover}
                    alt={preset.title}
                    className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate group-hover:text-amber-300 transition">
                      {preset.title}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{preset.genre}</div>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-amber-400 text-slate-300 group-hover:text-black flex items-center justify-center transition flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Queue List */}
          {musicPlayer.queue && musicPlayer.queue.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-2 px-1">
                <ListMusic className="w-4 h-4" />
                <span>Fila de Reprodução ({musicPlayer.queue.length})</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto thin-scrollbar">
                {musicPlayer.queue.map((track, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-black/30 text-xs border border-white/[0.04]"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-slate-500 font-bold w-4">{i + 1}.</span>
                      <span className="text-slate-200 font-medium truncate">{track.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 flex-shrink-0">
                      {track.requestedBy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
