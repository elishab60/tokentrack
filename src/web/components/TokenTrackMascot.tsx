import React from 'react';

export function TokenTrackMascot({ size = 32 }: { size?: number }) {
  const P = 4; // pixel size in 32×32 viewBox (8×8 grid)
  const o = 'var(--accent-orange)';
  const d = 'var(--ink)';
  const lens = 'rgba(106,155,204,0.4)';

  // Body pixels [col, row] on 8×8 grid
  const body: [number, number][] = [
    // Head top
    [2,0],[3,0],[4,0],[5,0],
    // Head wider
    [1,1],[2,1],[3,1],[4,1],[5,1],[6,1],
    // Face row (eyes here, drawn separately)
    [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
    // Body + arms
    [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
    // Body
    [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
    // Lower body
    [1,5],[2,5],[3,5],[4,5],[5,5],[6,5],
    // Legs (2 pairs with gap)
    [1,6],[2,6],[5,6],[6,6],
    [1,7],[2,7],[5,7],[6,7],
  ];

  // Eyes (dark, behind lenses)
  const eyes: [number, number][] = [[2,2],[5,2]];

  // Glasses frame (dark outlines)
  const frame: [number, number][] = [
    // Left frame top
    [1,1],[2,1],[3,1],
    // Left frame sides
    [1,2],[3,2],
    // Left frame bottom
    [1,3],[2,3],[3,3],
    // Bridge
    [4,2],
    // Right frame top
    [4,1],[5,1],[6,1],
    // Right frame sides
    [4,2],[6,2],
    // Right frame bottom
    [4,3],[5,3],[6,3],
    // Arms extending out
    [0,2],[7,2],
  ];

  // Lens tint (over eyes)
  const lenses: [number, number][] = [[2,2],[5,2]];

  return (
    <svg
      width={size} height={size}
      viewBox="0 0 32 32"
      fill="none"
      style={{ imageRendering: 'pixelated' }}
      aria-label="TokenTrack mascot"
    >
      {/* Body (orange creature) */}
      {body.map(([x, y]) => (
        <rect key={`b${x}-${y}`} x={x*P} y={y*P} width={P} height={P} fill={o} />
      ))}
      {/* Eyes (dark) */}
      {eyes.map(([x, y]) => (
        <rect key={`e${x}-${y}`} x={x*P} y={y*P} width={P} height={P} fill={d} />
      ))}
      {/* Glasses frame (semi-transparent dark) */}
      {frame.map(([x, y]) => (
        <rect key={`f${x}-${y}`} x={x*P} y={y*P} width={P} height={P} fill={d} opacity="0.6" />
      ))}
      {/* Lens tint */}
      {lenses.map(([x, y]) => (
        <rect key={`l${x}-${y}`} x={x*P} y={y*P} width={P} height={P} fill={lens} />
      ))}
    </svg>
  );
}
