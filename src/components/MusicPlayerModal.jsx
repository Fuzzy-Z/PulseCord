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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 select-none animate-in fade-in">
      <div className="bg-discord-dark w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-discord-darker flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 flex items-center justify-between border-b border-discord-darker bg-discord-darkest">
          <div className="flex items-center space-x-2">
            <Disc3 className="w-6 h-6 text-discord-yellow animate-spin" style={{ animationDuration: '8s' }} />
            <div>
              <h2 className="text-xl font-bold text-discord-header">Bot de Música & Rádio 24/7</h2>
              <p className="text-xs text-discord-muted">
                {activeVoiceChannel
                  ? 'Conectado ao seu canal de voz atual'
                  : '⚠️ Entre em um canal de voz para ouvir com seus amigos'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsMusicModalOpen(false)}
            className="text-discord-muted hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-6">
          {/* Search / URL Input */}
          <form onSubmit={handleSearchSubmit} className="flex space-x-2">
            <div className="flex-1 bg-discord-darkest rounded-lg flex items-center px-3 border border-discord-dark focus-within:border-discord-yellow">
              <Search className="w-4 h-4 text-discord-muted mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar música, gênero (ex: lofi, synthwave) ou colar URL de áudio..."
                className="w-full bg-transparent py-2.5 text-discord-text text-sm focus:outline-none placeholder-discord-muted/60"
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="px-5 py-2.5 bg-discord-yellow hover:bg-yellow-500 disabled:opacity-50 text-black font-bold rounded-lg text-sm transition"
            >
              Tocar
            </button>
          </form>

          {/* Now Playing Card */}
          {musicPlayer.currentTrack ? (
            <div className="bg-discord-darkest rounded-xl p-4 border border-discord-yellow/30 shadow-lg flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="relative group">
                <img
                  src={musicPlayer.currentTrack.cover}
                  alt="Cover"
                  className="w-24 h-24 rounded-lg object-cover shadow-md"
                />
                <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Radio className="w-6 h-6 text-discord-yellow animate-pulse" />
                </div>
              </div>

              <div className="flex-1 text-center md:text-left truncate">
                <div className="text-[10px] font-bold uppercase tracking-wider text-discord-yellow">
                  Tocando Agora
                </div>
                <h3 className="text-base font-bold text-discord-header truncate mt-0.5">
                  {musicPlayer.currentTrack.title}
                </h3>
                <p className="text-xs text-discord-muted truncate">
                  {musicPlayer.currentTrack.artist} • Pedido por: {musicPlayer.currentTrack.requestedBy || 'Você'}
                </p>

                {/* Controls */}
                <div className="flex items-center justify-center md:justify-start space-x-3 mt-3">
                  <button
                    onClick={() => sendMusicControl(musicPlayer.isPlaying ? 'pause' : 'resume')}
                    className="p-2 rounded-full bg-discord-yellow hover:bg-yellow-500 text-black font-bold transition shadow"
                  >
                    {musicPlayer.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => sendMusicControl('skip')}
                    className="p-2 rounded-full bg-discord-darker hover:bg-discord-hover text-white transition"
                    title="Pular Música"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => sendMusicControl('stop')}
                    className="p-2 rounded-full bg-discord-darker hover:bg-discord-red text-white transition"
                    title="Parar e Limpar Fila"
                  >
                    <Square className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-discord-darkest rounded-xl text-center text-discord-muted border border-discord-dark">
              <Disc3 className="w-10 h-10 mx-auto mb-2 text-discord-muted/50" />
              <p className="text-sm font-semibold text-discord-header">Nenhuma música tocando</p>
              <p className="text-xs mt-1">Escolha uma das estações abaixo ou pesquise uma música.</p>
            </div>
          )}

          {/* Curated Radio Stations */}
          <div>
            <h4 className="text-xs font-bold uppercase text-discord-muted tracking-wider mb-3">
              Estações de Rádio e Playlists Populares
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handlePlayPreset(preset.id)}
                  className="flex items-center space-x-3 p-2.5 bg-discord-darkest hover:bg-discord-hover/60 rounded-lg cursor-pointer border border-discord-dark transition group"
                >
                  <img
                    src={preset.cover}
                    alt={preset.title}
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-discord-header truncate group-hover:text-discord-yellow transition">
                      {preset.title}
                    </div>
                    <div className="text-[11px] text-discord-muted truncate">{preset.genre}</div>
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full bg-discord-yellow/20 group-hover:bg-discord-yellow text-discord-yellow group-hover:text-black flex items-center justify-center transition flex-shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Queue List */}
          {musicPlayer.queue && musicPlayer.queue.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase text-discord-muted tracking-wider mb-2">
                <ListMusic className="w-4 h-4" />
                <span>Próximas na Fila ({musicPlayer.queue.length})</span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {musicPlayer.queue.map((track, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 rounded bg-discord-darkest text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="text-discord-muted font-bold w-4">{i + 1}.</span>
                      <span className="text-discord-text font-medium truncate">{track.title}</span>
                    </div>
                    <span className="text-[10px] text-discord-muted flex-shrink-0">
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
