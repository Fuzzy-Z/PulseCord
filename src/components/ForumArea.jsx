import React, { useState } from 'react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';
import { Search, Plus, MessageSquare, Tag } from 'lucide-react';

export const ForumArea = () => {
  const { currentChannel } = useServer();
  const { currentUser } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mock data for forum posts
  const [posts, setPosts] = useState([
    { id: 1, title: 'Como configurar o bot de música?', author: 'João', replies: 5, tags: ['Suporte', 'Bot'], isFollowed: false },
    { id: 2, title: 'Sugestão: Adicionar temas claros', author: 'Maria', replies: 12, tags: ['Feedback', 'UI'], isFollowed: true }
  ]);

  const toggleFollow = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, isFollowed: !p.isFollowed } : p));
  };

  if (!currentChannel) return null;

  return (
    <div className="flex-1 bg-black/20 backdrop-blur-2xl flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="h-12 border-b border-sys-border px-4 flex items-center justify-between flex-shrink-0 bg-sys-s3">
        <div className="flex items-center space-x-2.5 truncate">
          <MessageSquare className="w-4 h-4 text-sys-accent flex-shrink-0" />
          <span className="font-bold text-sys-text text-[13px] tracking-tight truncate">{currentChannel.name}</span>
          <span className="text-sys-muted">/</span>
          <span className="text-xs text-sys-muted truncate max-w-[350px]">Fórum de discussões</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 thin-scrollbar">
        {/* Forum Header & Actions */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-sys-muted" />
            <input 
              type="text" 
              placeholder="Buscar posts ou tags..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sys-s3 border border-sys-border rounded-xl pl-9 pr-4 py-2 text-xs text-sys-text focus:outline-none focus:border-sys-accent"
            />
          </div>
          <button className="flex items-center space-x-1.5 px-4 py-2 bg-sys-accent hover:bg-sys-accentHov text-white text-xs font-bold rounded-xl shadow-md transition btn-interactive">
            <Plus className="w-4 h-4" />
            <span>Nova Postagem</span>
          </button>
        </div>

        {/* Posts List */}
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-sys-s3 border border-sys-border rounded-2xl p-4 flex items-start justify-between hover:border-sys-accent/40 transition-colors group cursor-pointer">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-sys-text group-hover:text-sys-accent transition-colors">{post.title}</h3>
                <div className="flex items-center space-x-3 mt-2 text-[11px] text-sys-muted">
                  <span className="font-medium text-sys-text">{post.author}</span>
                  <span>•</span>
                  <span>{post.replies} respostas</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    {post.tags.map(tag => (
                      <span key={tag} className="flex items-center space-x-1 bg-sys-s1 px-2 py-0.5 rounded-md border border-sys-border">
                        <Tag className="w-3 h-3" />
                        <span>{tag}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleFollow(post.id); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition btn-interactive border ${
                  post.isFollowed 
                  ? 'bg-sys-accent/20 text-sys-accent border-sys-accent/30' 
                  : 'bg-sys-s1 text-sys-muted border-sys-border hover:bg-sys-s2 hover:text-sys-text'
                }`}
              >
                {post.isFollowed ? 'Seguindo' : 'Seguir Tópico'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
