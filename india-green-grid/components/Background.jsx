'use client';

import Lightfall from './Lightfall';

// Full-viewport animated backdrop shared by every page. It sits behind the
// content and ignores clicks; the darkening layer keeps text readable.
export default function Background() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <Lightfall
        colors={['#34d399', '#a7f3d0', '#fbbf24', '#ffffff']}
        backgroundColor="#10b981"
        speed={0.28}
        streakCount={3}
        streakWidth={0.8}
        streakLength={1.1}
        twinkle={0.3}
        backgroundGlow={0.16}
        headGlow={0.6}
        bloom={0.4}
        depth={0.55}
        mouseInteraction
        holdToWarp={false}
        intro
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,transparent_0%,rgba(4,7,6,0.35)_55%,rgba(4,7,6,0.9)_100%)]" />
    </div>
  );
}
