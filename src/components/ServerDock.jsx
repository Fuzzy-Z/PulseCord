import React from 'react';
import { Plus } from 'lucide-react';
import { useServer } from '../context/ServerContext';
import { VoxelLogo } from './VoxelLogo';

export const ServerDock = () => {
  const {
    servers,
    currentServerId,
    selectServer,
    activeView,
    setActiveView,
    setIsAddServerOpen,
    unread
  } = useServer();

  const dmUnread = Object.entries(unread || {}).reduce((sum, [id, item]) => {
    if (id.startsWith('dm-')) return sum + (item?.count || 0);
    return sum;
  }, 0);
  const dmMentions = Object.entries(unread || {}).reduce((sum, [id, item]) => {
    if (id.startsWith('dm-')) return sum + (item?.mentions || 0);
    return sum;
  }, 0);

  const getMonogram = (server) => {
    if (server.icon && server.icon.length <= 3 && !/[\uD800-\uDFFF]/.test(server.icon)) {
      return server.icon;
    }
    return server.name ? server.name.substring(0, 2).toUpperCase() : 'VX';
  };

  return (
    <div className="flex items-center gap-1.5 min-w-0 flex-1 app-no-drag">
      {/* Home / DMs */}
      <button
        onClick={() => setActiveView('dms')}
        className={`voxel-dock-item flex-shrink-0 relative ${
          activeView === 'dms' ? 'voxel-dock-item--active' : ''
        }`}
        title="Início & Mensagens Diretas"
      >
        <VoxelLogo className="w-4 h-4" />
        {dmUnread > 0 && (
          <span className={`voxel-badge ${dmMentions > 0 ? 'voxel-badge--mention' : ''}`}>
            {dmMentions > 0 ? '@' : dmUnread > 9 ? '9+' : dmUnread}
          </span>
        )}
      </button>

      <div className="w-px h-5 bg-sys-border flex-shrink-0 mx-0.5" />

      {/* Server pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
        {servers.map((server) => {
          const isSelected = server.id === currentServerId && activeView === 'server';
          const monogram = getMonogram(server);
          const serverUnread = (server.channels || []).reduce((sum, ch) => sum + (unread?.[ch.id]?.count || 0), 0);
          const serverMentions = (server.channels || []).reduce((sum, ch) => sum + (unread?.[ch.id]?.mentions || 0), 0);

          return (
            <button
              key={server.id}
              onClick={() => {
                setActiveView('server');
                selectServer(server.id);
              }}
              className={`voxel-dock-item flex-shrink-0 relative ${
                isSelected ? 'voxel-dock-item--active' : ''
              }`}
              title={server.name}
            >
              <span className="text-[10px] font-bold tracking-wide">{monogram}</span>
              {serverUnread > 0 && (
                <span className={`voxel-badge ${serverMentions > 0 ? 'voxel-badge--mention' : ''}`}>
                  {serverMentions > 0 ? '@' : serverUnread > 9 ? '9+' : serverUnread}
                </span>
              )}
            </button>
          );
        })}

        <button
          onClick={() => setIsAddServerOpen(true)}
          className="voxel-dock-item voxel-dock-item--add flex-shrink-0"
          title="Criar um Servidor"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
