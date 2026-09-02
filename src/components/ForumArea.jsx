import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, Plus, Search, Tag, X } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { useSocket } from '../context/SocketContext';

const storageKey = (channelId) => `voxel_forum_${channelId}`;

const loadPosts = (channelId) => {
  try {
    const raw = localStorage.getItem(storageKey(channelId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const ForumArea = () => {
  const { currentChannel } = useServer();
  const { currentUser } = useSocket();
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [activePost, setActivePost] = useState(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (!currentChannel?.id) return;
    setPosts(loadPosts(currentChannel.id));
    setActivePost(null);
    setComposerOpen(false);
  }, [currentChannel?.id]);

  const persist = (next) => {
    setPosts(next);
    if (currentChannel?.id) {
      localStorage.setItem(storageKey(currentChannel.id), JSON.stringify(next));
    }
  };

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) =>
      `${p.title} ${p.author} ${(p.tags || []).join(' ')}`.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const createPost = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const post = {
      id: `post-${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      author: currentUser?.displayName || currentUser?.username || 'Você',
      authorId: currentUser?.id,
      replies: [],
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 4),
      isFollowed: true,
      createdAt: Date.now()
    };
    persist([post, ...posts]);
    setTitle('');
    setBody('');
    setTags('');
    setComposerOpen(false);
    setActivePost(post.id);
  };

  const toggleFollow = (id) => {
    persist(posts.map((p) => (p.id === id ? { ...p, isFollowed: !p.isFollowed } : p)));
  };

  const addReply = (e) => {
    e.preventDefault();
    if (!reply.trim() || !activePost) return;
    persist(
      posts.map((p) =>
        p.id === activePost
          ? {
              ...p,
              replies: [
                ...(p.replies || []),
                {
                  id: `r-${Date.now()}`,
                  author: currentUser?.displayName || currentUser?.username || 'Você',
                  text: reply.trim(),
                  createdAt: Date.now()
                }
              ]
            }
          : p
      )
    );
    setReply('');
  };

  if (!currentChannel) return null;

  const selected = posts.find((p) => p.id === activePost);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none voxel-workspace-inner">
      <div className="h-11 px-5 flex items-center justify-between flex-shrink-0 border-b border-sys-border bg-sys-s1/60">
        <div className="flex items-center space-x-2.5 truncate">
          <MessageSquare className="w-4 h-4 text-sys-accent flex-shrink-0" />
          <span className="font-bold text-sys-text text-[13px] tracking-tight truncate">{currentChannel.name}</span>
          <span className="text-sys-muted">/</span>
          <span className="text-xs text-sys-muted truncate">Fórum</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 thin-scrollbar">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-sys-muted" />
            <input
              type="text"
              placeholder="Buscar posts ou tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-sys-s3 border border-sys-border rounded-xl pl-9 pr-4 py-2 text-xs text-sys-text focus:outline-none focus:border-sys-accent"
            />
          </div>
          <button
            onClick={() => setComposerOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-sys-accent hover:bg-sys-accentHov text-white text-xs font-bold rounded-xl btn-interactive"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Postagem</span>
          </button>
        </div>

        {composerOpen && (
          <form onSubmit={createPost} className="bg-sys-s3 border border-sys-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-sys-text">Novo tópico</h3>
              <button type="button" onClick={() => setComposerOpen(false)} className="text-sys-muted hover:text-sys-text">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do tópico"
              className="w-full bg-sys-s1 border border-sys-border rounded-xl px-3 py-2 text-xs text-sys-text outline-none"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escreva o contexto..."
              rows={4}
              className="w-full bg-sys-s1 border border-sys-border rounded-xl px-3 py-2 text-xs text-sys-text outline-none resize-none"
            />
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Tags (separadas por vírgula)"
              className="w-full bg-sys-s1 border border-sys-border rounded-xl px-3 py-2 text-xs text-sys-text outline-none"
            />
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 bg-sys-accent text-white text-xs font-bold rounded-xl btn-interactive">
                Publicar
              </button>
            </div>
          </form>
        )}

        {selected ? (
          <div className="space-y-3">
            <button onClick={() => setActivePost(null)} className="text-xs text-sys-accent font-semibold">
              ← Voltar à lista
            </button>
            <div className="bg-sys-s3 border border-sys-border rounded-2xl p-4">
              <h3 className="text-sm font-bold text-sys-text">{selected.title}</h3>
              <p className="text-[11px] text-sys-muted mt-1">{selected.author}</p>
              {selected.body && <p className="text-xs text-sys-text mt-3 leading-relaxed whitespace-pre-wrap">{selected.body}</p>}
            </div>
            <div className="space-y-2">
              {(selected.replies || []).map((r) => (
                <div key={r.id} className="bg-sys-s1 border border-sys-border rounded-xl px-3 py-2">
                  <p className="text-[11px] font-semibold text-sys-text">{r.author}</p>
                  <p className="text-xs text-sys-muted mt-0.5">{r.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addReply} className="flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Responder o tópico..."
                className="flex-1 bg-sys-s3 border border-sys-border rounded-xl px-3 py-2 text-xs text-sys-text outline-none"
              />
              <button type="submit" className="px-3 py-2 bg-sys-accent text-white text-xs font-bold rounded-xl">
                Enviar
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-sys-muted text-xs">
                Nenhum tópico ainda. Abra a primeira discussão deste fórum.
              </div>
            ) : (
              filtered.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setActivePost(post.id)}
                  className="bg-sys-s3 border border-sys-border rounded-2xl p-4 flex items-start justify-between hover:border-sys-accent/40 transition-colors group cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-sys-text group-hover:text-sys-accent">{post.title}</h3>
                    <div className="flex items-center flex-wrap gap-2 mt-2 text-[11px] text-sys-muted">
                      <span className="font-medium text-sys-text">{post.author}</span>
                      <span>•</span>
                      <span>{(post.replies || []).length} respostas</span>
                      {(post.tags || []).map((tag) => (
                        <span key={tag} className="flex items-center gap-1 bg-sys-s1 px-2 py-0.5 rounded-md border border-sys-border">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFollow(post.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border btn-interactive ${
                      post.isFollowed
                        ? 'bg-sys-accent/20 text-sys-accent border-sys-accent/30'
                        : 'bg-sys-s1 text-sys-muted border-sys-border'
                    }`}
                  >
                    {post.isFollowed ? 'Seguindo' : 'Seguir'}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
