import React, { useState } from 'react';
import { Shield, Users, Plus, Trash2, Check, X, Palette, Lock } from 'lucide-react';
import { useServer } from '../context/ServerContext';

export const ServerSettingsModal = () => {
  const { isServerSettingsOpen, setIsServerSettingsOpen, currentServer, updateRoles } = useServer();
  const [activeTab, setActiveTab] = useState('roles'); // 'overview' | 'roles' | 'members'
  const [roles, setRoles] = useState(() => currentServer?.roles || []);
  const [selectedRoleId, setSelectedRoleId] = useState(() => currentServer?.roles?.[0]?.id || null);

  if (!isServerSettingsOpen || !currentServer) return null;

  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const colorPresets = [
    '#f23f43', // Red
    '#5865f2', // Discord Blurple
    '#23a55a', // Green
    '#f0b232', // Yellow/Gold
    '#eb459e', // Pink
    '#9b59b6', // Purple
    '#1abc9c', // Teal
    '#e67e22', // Orange
    '#949ba4'  // Grey/Default
  ];

  const handleCreateRole = () => {
    const newRole = {
      id: `role-${Date.now()}`,
      name: 'Novo Cargo',
      color: '#5865f2',
      permissions: {
        administrator: false,
        manageServer: false,
        manageRoles: false,
        manageChannels: false,
        kickMembers: false,
        sendMessages: true,
        connectVoice: true,
        shareScreen: true,
        controlMusic: false
      }
    };
    const updated = [...roles, newRole];
    setRoles(updated);
    setSelectedRoleId(newRole.id);
    updateRoles(updated);
  };

  const handleDeleteRole = (roleId) => {
    if (roles.length <= 1) return;
    const updated = roles.filter((r) => r.id !== roleId);
    setRoles(updated);
    setSelectedRoleId(updated[0]?.id || null);
    updateRoles(updated);
  };

  const handleRoleNameChange = (name) => {
    const updated = roles.map((r) => (r.id === selectedRole.id ? { ...r, name } : r));
    setRoles(updated);
    updateRoles(updated);
  };

  const handleRoleColorChange = (color) => {
    const updated = roles.map((r) => (r.id === selectedRole.id ? { ...r, color } : r));
    setRoles(updated);
    updateRoles(updated);
  };

  const handlePermissionToggle = (permKey) => {
    const updated = roles.map((r) => {
      if (r.id === selectedRole.id) {
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [permKey]: !r.permissions[permKey]
          }
        };
      }
      return r;
    });
    setRoles(updated);
    updateRoles(updated);
  };

  const permissionList = [
    {
      key: 'administrator',
      name: 'Administrador',
      desc: 'Membros com esta permissão têm todas as permissões e ignoram restrições de canal.'
    },
    {
      key: 'manageChannels',
      name: 'Gerenciar Canais',
      desc: 'Permite criar, editar ou excluir canais de voz e texto.'
    },
    {
      key: 'manageRoles',
      name: 'Gerenciar Cargos',
      desc: 'Permite criar novos cargos e editar permissões ou cargos inferiores.'
    },
    {
      key: 'sendMessages',
      name: 'Enviar Mensagens',
      desc: 'Permite que os membros conversem nos canais de texto.'
    },
    {
      key: 'connectVoice',
      name: 'Conectar em Voz',
      desc: 'Permite que os membros entrem e conversem nos canais de voz.'
    },
    {
      key: 'shareScreen',
      name: 'Compartilhar Tela / Vídeo',
      desc: 'Permite que os membros transmitam suas telas ou janelas de jogos.'
    },
    {
      key: 'controlMusic',
      name: 'Controlar Bot de Música',
      desc: 'Permite usar comandos de DJ, adicionar músicas à fila, pular e pausar o bot.'
    },
    {
      key: 'kickMembers',
      name: 'Expulsar Membros',
      desc: 'Permite remover membros do servidor.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6 select-none">
      <div className="bg-sys-base w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden border border-sys-border flex animate-modal">
        {/* Left Sidebar of Modal */}
        <div className="w-56 bg-sys-s2 p-5 flex flex-col justify-between border-r border-sys-border">
          <div>
            <h3 className="text-[10px] font-bold text-sys-muted uppercase tracking-wider px-2 mb-3">
              {currentServer.name}
            </h3>
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center space-x-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition ${
                  activeTab === 'roles'
                    ? 'bg-sys-s3 text-sys-text shadow-sm border border-sys-border'
                    : 'text-sys-muted hover:bg-sys-s1 hover:text-sys-text'
                }`}
              >
                <Shield className="w-4 h-4 text-sys-accent" />
                <span>Cargos & Acesso</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-sys-border">
            <button
              onClick={() => setIsServerSettingsOpen(false)}
              className="flex items-center space-x-2 text-sys-muted hover:text-sys-text text-xs font-semibold px-2 py-1 transition"
            >
              <X className="w-4 h-4" />
              <span>Fechar</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-sys-border bg-sys-s3 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-sys-text tracking-tight">Cargos do Servidor</h2>
              <p className="text-xs text-sys-muted mt-1">
                Configure permissões e hierarquia de acesso dos membros.
              </p>
            </div>
            <button
              onClick={handleCreateRole}
              className="flex items-center space-x-1.5 px-4 py-2 bg-sys-accent hover:bg-sys-accentHov text-white rounded-xl text-xs font-semibold transition shadow-sm btn-interactive"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Cargo</span>
            </button>
          </div>

          {/* Body: Roles Column + Role Config Column */}
          <div className="flex-1 flex overflow-hidden">
            {/* Roles List */}
            <div className="w-52 bg-sys-s2 p-3 overflow-y-auto border-r border-sys-border space-y-1 thin-scrollbar">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                const cleanName = (r.name || '').replace(/[\uD800-\uDFFF].*/g, '').trim();

                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition border ${
                      isSelected
                        ? 'bg-sys-s3 text-sys-text border-sys-border'
                        : 'border-transparent text-sys-muted hover:bg-sys-s1 hover:text-sys-text hover:border-sys-border'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="truncate">{cleanName || r.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Settings */}
            {selectedRole && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6 thin-scrollbar">
                {/* Role Name */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2">
                    Nome do Cargo
                  </label>
                  <input
                    type="text"
                    value={(selectedRole.name || '').replace(/[\uD800-\uDFFF].*/g, '').trim() || selectedRole.name}
                    onChange={(e) => handleRoleNameChange(e.target.value)}
                    className="w-full max-w-md bg-sys-s1 border border-sys-border text-sys-text px-4 py-3 rounded-2xl text-xs focus:outline-none focus:border-sys-accent/50 transition-colors placeholder-sys-muted/50"
                  />
                </div>

                {/* Role Color */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-2.5">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleRoleColorChange(c)}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition shadow-md ${
                          selectedRole.color === c ? 'ring-2 ring-white scale-110' : 'hover:opacity-90 hover:scale-105'
                        }`}
                      >
                        {selectedRole.color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={selectedRole.color}
                      onChange={(e) => handleRoleColorChange(e.target.value)}
                      className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border-0"
                      title="Cor personalizada"
                    />
                  </div>
                </div>

                {/* Permissions List */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-sys-muted mb-3">
                    Permissões
                  </label>
                  <div className="space-y-2.5">
                    {permissionList.map((p) => {
                      const enabled = !!selectedRole.permissions?.[p.key];
                      return (
                        <div
                          key={p.key}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-sys-s1 border border-sys-border"
                        >
                          <div className="pr-4">
                            <div className="text-xs font-semibold text-sys-text">{p.name}</div>
                            <div className="text-[11px] text-sys-muted mt-0.5">{p.desc}</div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handlePermissionToggle(p.key)}
                            className={`w-11 h-6 flex items-center rounded-full p-1 transition-all duration-200 border ${
                              enabled ? 'bg-sys-accent border-sys-accent justify-end shadow-sm' : 'bg-sys-s3 border-sys-border justify-start'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delete Role */}
                {roles.length > 1 && (
                  <div className="pt-4 border-t border-sys-border flex justify-end">
                    <button
                      onClick={() => handleDeleteRole(selectedRole.id)}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-500/15 transition btn-interactive"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Excluir Cargo</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
