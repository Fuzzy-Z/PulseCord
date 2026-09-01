import React, { useState, useEffect } from 'react';

// In-memory cache for static first-frames of animated GIFs
const staticFrameCache = new Map();

export const AvatarImage = ({
  src,
  alt = 'Avatar',
  className = '',
  isSpeaking = false,
  forceAnimate = false,
  onMouseEnter,
  onMouseLeave,
  ...props
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [staticDataUrl, setStaticDataUrl] = useState(() => (src ? staticFrameCache.get(src) || null : null));

  const isGif = Boolean(
    src &&
    (src.toLowerCase().includes('.gif') ||
     src.startsWith('data:image/gif') ||
     src.includes('image/gif'))
  );

  useEffect(() => {
    if (!isGif || !src) {
      setStaticDataUrl(null);
      return;
    }

    if (staticFrameCache.has(src)) {
      setStaticDataUrl(staticFrameCache.get(src));
      return;
    }

    // Extract first frame using offscreen image + canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 64;
        canvas.height = img.naturalHeight || 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          staticFrameCache.set(src, dataUrl);
          setStaticDataUrl(dataUrl);
        }
      } catch (err) {
        // Fallback if cross-origin tainted canvas
        staticFrameCache.set(src, src);
        setStaticDataUrl(src);
      }
    };
    img.onerror = () => {
      setStaticDataUrl(src);
    };
    img.src = src;
  }, [src, isGif]);

  const shouldAnimate = forceAnimate || isSpeaking || isHovered;
  const currentSrc = isGif && !shouldAnimate && staticDataUrl ? staticDataUrl : src;

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      onMouseEnter={(e) => {
        setIsHovered(true);
        if (onMouseEnter) onMouseEnter(e);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        if (onMouseLeave) onMouseLeave(e);
      }}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

export default AvatarImage;
