import React, { useState, useRef, useEffect } from 'react';
import { USER_STATUSES, StatusBadge } from './StatusBadge';
import { useSocket } from '../context/SocketContext';
import { Smile, Edit3, X, Check } from 'lucide-react';

export const StatusPickerPopover = ({ isOpen, onClose, anchorRef }) => {
  const { currentUser, updateProfile } = useSocket();
  const [isEditingCustom, setIsEditingCustom] = useState(false);
  const [customText, setCustomText] = useState(currentUser?.customStatus?.text || '');
  const [customEmoji, setCustomEmoji] = useState(currentUser?.customStatus?.emoji || '💬');

  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        anchorRef?.current &&
        !anchorRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const currentStatus = currentUser?.status || 'online';

  const handleSelectStatus = async (statusId) => {
    await updateProfile({ status: statusId });
    onClose();
  };

  const handleSaveCustomStatus = async (e) => {
    e?.preventDefault();
    await updateProfile({
      customStatus: {
        text: customText.trim(),
        emoji: customEmoji
      }
    });
    setIsEditingCustom(false);
    onClose();
  };

  const handleClearCustomStatus = async () => {
    await updateProfile({
      customStatus: { text: '', emoji: '' }
    });
    setCustomText('');
    setIsEditingCustom(false);
  };

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-16 left-2 z-50 w-72 bg-sys-s2/95 backdrop-blur-xl border border-sys-border shadow-2xl rounded-2xl p-2 animate-in fade-in slide-in-from-bottom-3 duration-150 select-none text-sys-text"
    >
      {/* Custom Status Card */}
      <div className="p-2 mb-1 bg-sys-s3/80 border border-sys-border/60 rounded-xl">
        {isEditingCustom ? (
          <form onSubmit={handleSaveCustomStatus} className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                className="w-8 h-8 text-center bg-sys-s1 border border-sys-border rounded-lg text-sm"
                placeholder="💬"
                maxLength={4}
              />
              <input
                type="text"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="No que está pensando?"
                className="flex-1 px-2.5 py-1.5 bg-sys-s1 border border-sys-border rounded-lg text-xs text-sys-text focus:outline-none focus:border-sys-accent"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-1.5">
              <button
                type="button"
                onClick={() => setIsEditingCustom(false)}
                className="px-2 py-1 text-[11px] text-sys-muted hover:text-sys-text rounded-md hover:bg-sys-s1"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-2.5 py-1 text-[11px] bg-sys-accent text-white font-semibold rounded-md shadow-sm"
              >
                Salvar
              </button>
            </div>
          </form>
        ) : (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsEditingCustom(true)}
              className="flex items-center gap-2 text-left flex-1 min-w-0 group hover:opacity-90"
            >
              <span className="text-base flex-shrink-0">
                {currentUser?.customStatus?.emoji || '💬'}
              </span>
              <span className="text-xs text-sys-text font-medium truncate">
                {currentUser?.customStatus?.text || (
                  <span className="text-sys-muted italic">Definir status personalizado...</span>
                )}
              </span>
            </button>
            {currentUser?.customStatus?.text && (
              <button
                onClick={handleClearCustomStatus}
                className="p-1 text-sys-muted hover:text-red-400 rounded-lg hover:bg-sys-s1 ml-1"
                title="Limpar status"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="h-[1px] bg-sys-border/50 my-1" />

      {/* Main Statuses List */}
      <div className="space-y-0.5">
        {USER_STATUSES.map((status) => {
          const isSelected = currentStatus === status.id;
          return (
            <button
              key={status.id}
              onClick={() => handleSelectStatus(status.id)}
              className={`w-full flex items-center justify-between p-2 rounded-xl transition text-left group ${
                isSelected ? 'bg-sys-s1/90 font-semibold' : 'hover:bg-sys-s3'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-0.5">
                  <StatusBadge status={status.id} size="md" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-xs text-sys-text font-medium group-hover:text-sys-accent transition-colors">
                    {status.name}
                  </span>
                  <span className="text-[10px] text-sys-muted truncate">
                    {status.desc}
                  </span>
                </div>
              </div>
              {isSelected && <Check className="w-3.5 h-3.5 text-sys-accent flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
