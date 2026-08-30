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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6 select-none animate-in fade-in">
      <div className="bg-discord-dark w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl overflow-hidden border border-discord-darker flex">
        {/* Left Sidebar of Modal */}
        <div className="w-56 bg-discord-darker p-4 flex flex-col justify-between border-r border-discord-darkest">
          <div>
            <h3 className="text-xs font-bold text-discord-muted uppercase px-2 mb-2">
              {currentServer.name}
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('roles')}
                className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm font-medium transition ${
                  activeTab === 'roles'
                    ? 'bg-discord-hover text-white'
                    : 'text-discord-channel hover:bg-discord-hover/50 hover:text-discord-text'
                }`}
              >
                <Shield className="w-4 h-4 text-discord-brand" />
                <span>Cargos & Permissões</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-discord-darkest">
            <button
              onClick={() => setIsServerSettingsOpen(false)}
              className="flex items-center space-x-2 text-discord-muted hover:text-white text-xs font-semibold"
            >
              <X className="w-4 h-4" />
              <span>ESC / Fechar</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col bg-discord-dark overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-discord-darker flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-xl font-bold text-discord-header">Cargos do Servidor</h2>
              <p className="text-xs text-discord-muted mt-1">
                Use os cargos para organizar os membros do servidor e conceder permissões.
              </p>
            </div>
            <button
              onClick={handleCreateRole}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-discord-brand hover:bg-discord-brandHover text-white rounded text-xs font-bold transition shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Cargo</span>
            </button>
          </div>

          {/* Body: Roles Column + Role Config Column */}
          <div className="flex-1 flex overflow-hidden">
            {/* Roles List */}
            <div className="w-48 bg-discord-darkest/60 p-3 overflow-y-auto border-r border-discord-darker space-y-1">
              {roles.map((r) => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRoleId(r.id)}
                    className={`w-full text-left flex items-center justify-between px-2.5 py-2 rounded text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-discord-active text-white'
                        : 'text-discord-channel hover:bg-discord-hover hover:text-discord-text'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: r.color }}
                      />
                      <span className="truncate">{r.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Role Settings */}
            {selectedRole && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {/* Role Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                    Nome do Cargo
                  </label>
                  <input
                    type="text"
                    value={selectedRole.name}
                    onChange={(e) => handleRoleNameChange(e.target.value)}
                    className="w-full max-w-md bg-discord-darkest text-discord-text px-3 py-2 rounded border border-discord-dark focus:border-discord-brand focus:outline-none text-sm"
                  />
                </div>

                {/* Role Color */}
                <div>
                  <label className="block text-xs font-bold uppercase text-discord-muted mb-2">
                    Cor do Cargo
                  </label>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    {colorPresets.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleRoleColorChange(c)}
                        style={{ backgroundColor: c }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                          selectedRole.color === c ? 'ring-2 ring-white scale-110' : 'hover:opacity-90'
                        }`}
                      >
                        {selectedRole.color === c && <Check className="w-4 h-4 text-white drop-shadow" />}
                      </button>
                    ))}
                    <input
                      type="color"
                      value={selectedRole.color}
                      onChange={(e) => handleRoleColorChange(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      title="Cor personalizada"
                    />
                  </div>
                </div>

                {/* Permissions List */}
                <div>
                  <label className="block text-xs font-bold uppercase text-discord-muted mb-3">
                    Permissões do Cargo
                  </label>
                  <div className="space-y-3">
                    {permissionList.map((p) => {
                      const enabled = !!selectedRole.permissions?.[p.key];
                      return (
                        <div
                          key={p.key}
                          className="flex items-center justify-between p-3 rounded-lg bg-discord-darkest border border-discord-darker"
                        >
                          <div className="pr-4">
                            <div className="text-sm font-semibold text-discord-header">{p.name}</div>
                            <div className="text-xs text-discord-muted mt-0.5">{p.desc}</div>
                          </div>

                          {/* Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => handlePermissionToggle(p.key)}
                            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ${
                              enabled ? 'bg-discord-green justify-end' : 'bg-discord-hover justify-start'
                            }`}
                          >
                            <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Delete Role */}
                {roles.length > 1 && (
                  <div className="pt-4 border-t border-discord-darker flex justify-end">
                    <button
                      onClick={() => handleDeleteRole(selectedRole.id)}
                      className="flex items-center space-x-1.5 px-3 py-2 rounded text-xs font-bold text-discord-red hover:bg-discord-red/10 transition"
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
