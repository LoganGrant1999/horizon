import { useState } from 'react';

interface RegionData {
  region: string;
  count: number;
  displayName: string;
  conditions?: string[];
}

interface BodyHeatmapProps {
  data: RegionData[];
  onRegionClick: (region: string) => void;
}

// Map database regions to body map anchors (where leader lines start on the body image)
// These coordinates are tuned for the body.png image placed at x=70, y=0, width=320, height=520
const REGION_ANCHORS: Record<string, [number, number]> = {
  HEAD: [230, 68],           // brain/head area
  NECK: [230, 104],          // neck area
  CHEST: [230, 160],         // upper torso/chest
  HEART: [240, 168],         // heart region (slightly left of center)
  LUNGS: [225, 150],         // lung area
  ABDOMEN: [240, 220],       // stomach/abdomen area
  UPPER_BACK: [230, 160],    // upper back (same as chest Y)
  LOW_BACK: [230, 220],      // lower back (same as abdomen Y)
  LEFT_ARM: [180, 190],      // left arm midpoint
  RIGHT_ARM: [280, 190],     // right arm midpoint
  LEFT_LEG: [210, 360],      // left leg midpoint
  RIGHT_LEG: [250, 360],     // right leg midpoint
  SKIN: [280, 140],          // side of torso for skin
  OTHER: [230, 450],         // below feet
};

export function BodyHeatmap({ data, onRegionClick }: BodyHeatmapProps) {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);

  const MAX_BULLETS = 3;

  // Theme tokens
  const leader = '#CBD5E1';
  const text = '#111827';
  const subtext = '#6B7280';

  // Right margin layout
  const gutterX = 460;
  const rowYStart = 110;
  const rowYStep = 64;

  // Filter and map regions with data
  const regionsWithData = data
    .filter(r => r.count > 0)
    .map(r => ({
      ...r,
      anchor: REGION_ANCHORS[r.region] || [230, 260],
      bullets: r.conditions || [],
    }));

  return (
    <div className="relative">
      <svg
        viewBox="0 0 720 520"
        className="w-full max-w-5xl mx-auto"
        role="img"
        aria-label="Human body map with organs and labeled regions"
      >
        {/* Base anatomy image - fixed background layer */}
        <image
          href="/body.png"
          x="70"
          y="0"
          width="320"
          height="520"
          preserveAspectRatio="xMidYMid meet"
          style={{ imageRendering: 'auto' }}
        />

        {/* Labels in right margin */}
        {regionsWithData.map((r, i) => {
          const y = rowYStart + i * rowYStep;
          const [ax, ay] = r.anchor;
          const bullets = r.bullets ?? [];
          const overflow = Math.max(0, bullets.length - MAX_BULLETS);
          const isHovered = hoveredRegion === r.region;

          return (
            <g
              key={r.region}
              aria-labelledby={`${r.region}-title`}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredRegion(r.region)}
              onMouseLeave={() => setHoveredRegion(null)}
              onClick={() => onRegionClick(r.region)}
            >
              {/* Leader line from organ anchor to gutter */}
              <path
                d={`M ${ax} ${ay} L ${gutterX - 8} ${y}`}
                stroke={isHovered ? '#00A7A0' : leader}
                strokeWidth={isHovered ? 1 : 0.75}
                fill="none"
              />

              {/* Title */}
              <text
                id={`${r.region}-title`}
                x={gutterX}
                y={y}
                fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
                fontSize={13}
                fontWeight={600}
                fill={isHovered ? '#00A7A0' : text}
                dominantBaseline="middle"
              >
                {r.displayName}
              </text>

              {/* Condition bullets */}
              {bullets.slice(0, MAX_BULLETS).map((b, j) => (
                <text
                  key={j}
                  x={gutterX}
                  y={y + 16 + j * 14}
                  fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
                  fontSize={12}
                  fill={subtext}
                >
                  • {b}
                </text>
              ))}

              {/* Overflow indicator */}
              {overflow > 0 && (
                <text
                  x={gutterX}
                  y={y + 16 + Math.min(bullets.length, MAX_BULLETS) * 14}
                  fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
                  fontSize={12}
                  fill={subtext}
                  fontStyle="italic"
                >
                  +{overflow} more…
                </text>
              )}

              {/* Show count if no condition names */}
              {bullets.length === 0 && r.count > 0 && (
                <text
                  x={gutterX}
                  y={y + 16}
                  fontFamily="system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
                  fontSize={11}
                  fill="#9CA3AF"
                  fontStyle="italic"
                >
                  {r.count} symptom{r.count !== 1 ? 's' : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}