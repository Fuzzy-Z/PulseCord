import React from 'react';

export const VoxelLogo = ({ className = 'w-6 h-6', size, alt = 'Voxel' }) => {
  const style = size ? { width: size, height: size } : {};

  return (
    <img
      src="/icon.png"
      alt={alt}
      className={`object-contain select-none pointer-events-none ${className}`}
      style={style}
      draggable={false}
    />
  );
};

export default VoxelLogo;
