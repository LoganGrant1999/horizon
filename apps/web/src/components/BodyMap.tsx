import { useState } from 'react';

export type BodyPart =
  | 'head'
  | 'chest'
  | 'stomach'
  | 'left_shoulder'
  | 'right_shoulder'
  | 'left_arm'
  | 'right_arm'
  | 'left_leg'
  | 'right_leg'
  | 'left_hand'
  | 'right_hand'
  | 'left_foot'
  | 'right_foot';

export type MedicalLabel = {
  part: BodyPart;
  title: string;
  conditions: string[];
};

export interface BodyMapProps {
  labels: MedicalLabel[];
  onPartClick?: (part: BodyPart) => void;
}

// Coordinate map for leader lines (center of each body part)
const BODY_PART_COORDS: Record<BodyPart, { x: number; y: number }> = {
  head: { x: 103, y: 40 },
  left_shoulder: { x: 48, y: 90 },
  right_shoulder: { x: 158, y: 90 },
  chest: { x: 103, y: 110 },
  stomach: { x: 103, y: 160 },
  left_arm: { x: 25, y: 160 },
  right_arm: { x: 181, y: 160 },
  left_hand: { x: 5, y: 245 },
  right_hand: { x: 201, y: 245 },
  left_leg: { x: 80, y: 330 },
  right_leg: { x: 126, y: 330 },
  left_foot: { x: 80, y: 470 },
  right_foot: { x: 126, y: 470 },
};

export function BodyMap({ labels, onPartClick }: BodyMapProps) {
  const [hoveredPart, setHoveredPart] = useState<BodyPart | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<BodyPart | null>(null);

  const activeParts = new Set(labels.map((l) => l.part));
  const currentHover = hoveredPart || hoveredLabel;

  const getPartFill = (part: BodyPart) => {
    if (currentHover === part) return '#00BFA6';
    if (activeParts.has(part)) return '#E0F7F4';
    return '#CBD5E1';
  };

  const handlePartInteraction = (part: BodyPart) => ({
    onMouseEnter: () => setHoveredPart(part),
    onMouseLeave: () => setHoveredPart(null),
    onClick: () => onPartClick?.(part),
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center w-full max-w-7xl mx-auto p-6">
      {/* Body SVG Container */}
      <div className="flex-shrink-0 relative" style={{ width: '207px', height: '500px' }}>
        <div className="relative" style={{ width: '207px', height: '500px', margin: '0 auto' }}>
          {/* Head */}
          <svg
            {...handlePartInteraction('head')}
            aria-label="Head"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-28.5px', top: '-6px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="56.594"
            height="95.031"
            viewBox="0 0 56.594 95.031"
          >
            <path
              d="M 49.432 37.702 L 51.958 20.638 L 28.531 5.896 L 4.949 21.448 L 7.485 38.074 L 4.85 38.591 L 6.312 49.381 L 11.52 51.947 L 13.88 63.577 L 23.6 74.595 L 34.456 74.271 L 44.016 63.901 L 45.934 51.949 L 50.99 50.592 L 52.181 39.262 L 49.432 37.702 Z"
              fill={getPartFill('head')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Left Shoulder */}
          <svg
            {...handlePartInteraction('left_shoulder')}
            aria-label="Left Shoulder"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-53.5px', top: '69px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="46.594"
            viewBox="0 0 40 46.594"
          >
            <path
              d="M 38.244 -0.004 L 40.224 9.228 L 28.571 12.085 L 18.502 30.932 L 8.575 36.462 L 0.132 46.755 L 0.219 22.23 L 12.835 8.29 L 19.606 9.571 L 38.244 -0.004 Z"
              fill={getPartFill('left_shoulder')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Right Shoulder */}
          <svg
            {...handlePartInteraction('right_shoulder')}
            aria-label="Right Shoulder"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '13.5px', top: '69px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="46.594"
            viewBox="0 0 40 46.594"
          >
            <path
              d="M 3.276 -0.004 L 1.296 9.228 L 11.877 12.475 L 22.083 31.131 L 34.053 36.518 L 42.201 47.802 L 41.18 22.506 L 28.53 8.516 L 19.394 8.766 L 3.276 -0.004 Z"
              fill={getPartFill('right_shoulder')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Left Arm */}
          <svg
            {...handlePartInteraction('left_arm')}
            aria-label="Left Arm"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-78px', top: '112px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="119.25"
            viewBox="0 0 40 119.25"
          >
            <path
              d="M 17.229 50.062 L 18.682 43.737 L 16.442 16.358 L 33.128 0.155 L 39.953 9.973 L 29.237 79.632 L 10.364 119.167 L -0.977 115.813 L 6.654 77.532 L 17.229 50.062 Z"
              fill={getPartFill('left_arm')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Right Arm */}
          <svg
            {...handlePartInteraction('right_arm')}
            aria-label="Right Arm"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '38px', top: '112px', zIndex: 10001 }}
            xmlns="http://www.w3.org/2000/svg"
            width="41"
            height="119.25"
            viewBox="0 0 41 119.25"
          >
            <path
              d="M 6.186 57.362 L 0.01 10.154 L 7.047 0.015 L 18.284 8.364 L 22.997 18.252 L 21.226 43.483 L 33.91 77.03 L 40.918 112.541 L 35.761 118.994 L 29.43 118.465 L 11.079 79.559 L 6.186 57.362 Z"
              fill={getPartFill('right_arm')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Chest */}
          <svg
            {...handlePartInteraction('chest')}
            aria-label="Chest"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-43.5px', top: '88px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="86.594"
            height="45.063"
            viewBox="0 0 86.594 45.063"
          >
            <path
              d="M 19.32 0 L 9.58 14.601 L -0.005 21.544 L 6.145 26.38 L 10.977 40.45 L 22.177 45.066 L 38.91 36.349 L 46.11 36.037 L 64.211 45.157 L 75.21 40.048 L 79.956 26.138 L 87.048 21.573 L 76.817 14.103 L 66.985 0.152 L 51.079 1.833 L 48.807 5.171 L 36.261 5.483 L 34.051 1.394 L 19.32 0 Z"
              fill={getPartFill('chest')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Stomach */}
          <svg
            {...handlePartInteraction('stomach')}
            aria-label="Stomach"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-37.5px', top: '130px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="75.25"
            height="107.594"
            viewBox="0 0 75.25 107.594"
          >
            <path
              d="M 15.988 6.215 L 0.765 1.373 L 8.471 30.123 L 6.866 55.306 L 0.057 67.982 L 10.522 82.302 L 36.246 107.323 L 38.8 107.227 L 65.182 83.078 L 75.754 68.424 L 68.905 55.361 L 66.776 30.912 L 74.336 2.311 L 55.921 6.748 L 39.102 0.128 L 34.984 0.264 L 15.988 6.215 Z"
              fill={getPartFill('stomach')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Left Leg */}
          <svg
            {...handlePartInteraction('left_leg')}
            aria-label="Left Leg"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-46.5px', top: '205px', zIndex: 9999 }}
            xmlns="http://www.w3.org/2000/svg"
            width="45"
            height="254.625"
            viewBox="0 0 45 254.625"
          >
            <path
              d="M 34.822 170.168 L 35.794 164.644 L 36.888 158.794 L 39.264 152.9 L 34.561 129.077 L 39.58 87.961 L 43.599 36.561 L 10.799 0.928 L 0.232 30.113 L 5.641 63.554 L 4.668 89.142 L 11.542 121.956 L 10.806 159.345 L 9.017 195.132 L 16.544 224.793 L 22.674 252.725 L 30.692 253.507 L 33.937 215.649 L 38.807 201.895 L 39.47 186.808 L 34.822 170.168 Z"
              fill={getPartFill('left_leg')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Right Leg */}
          <svg
            {...handlePartInteraction('right_leg')}
            aria-label="Right Leg"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '1.5px', top: '205px', zIndex: 9999 }}
            xmlns="http://www.w3.org/2000/svg"
            width="45"
            height="257.679"
            viewBox="0 0 45 257.679"
          >
            <path
              d="M 34.308 1.138 L 1.595 32.897 L 4.199 87.843 L 8.051 128.404 L 5.559 134.166 L 4.78 153.519 L 9.418 161.961 L 8.838 170.375 L 5.001 186.538 L 5.695 201.551 L 10.359 215.894 L 9.982 257.679 L 21.301 252.703 L 36.543 194.712 L 32.595 162.705 L 32.401 129.906 L 30.401 125.278 L 40.239 89.299 L 40.455 61.267 L 43.818 30.666 L 34.308 1.138 Z"
              fill={getPartFill('right_leg')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Left Hand */}
          <svg
            {...handlePartInteraction('left_hand')}
            aria-label="Left Hand"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-102.5px', top: '224px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="38.938"
            viewBox="0 0 36 38.938"
          >
            <path
              d="M 21.893 1.486 L 27.006 7.43 L 34.992 8.871 L 32.786 21.329 L 28.465 37.109 L 25.906 37.527 L 25.942 26.637 L 24.121 26.34 L 20.721 38.408 L 17.921 37.644 L 19.769 25.545 L 18.824 25.174 L 12.102 37.76 L 9.056 36.89 L 13.974 23.747 L 13.575 23.347 L 4.346 34.19 L 1.008 32.363 L 12.081 12.581 L 11.506 11.545 L 0.665 14.72 L -1.914 10.998 L 21.893 1.486 Z"
              fill={getPartFill('left_hand')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Right Hand */}
          <svg
            {...handlePartInteraction('right_hand')}
            aria-label="Right Hand"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '66.5px', top: '224px', zIndex: 10000 }}
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="38.938"
            viewBox="0 0 36 38.938"
          >
            <path
              d="M 15.281 0.317 L 9.85 6.26 L 1.651 8.339 L 1.305 19.734 L 6.477 37.003 L 9.036 36.995 L 7.405 26.637 L 8.8 26.553 C 8.8 26.553 14.545 38.621 14.221 38.621 L 16.914 38.069 L 13.896 25.545 L 14.948 25.174 L 22.308 38.398 L 25.673 37.74 L 21.074 24.172 L 21.898 23.56 L 31.127 35.891 L 33.934 33.745 L 23.755 11.12 L 33.214 16.208 L 35.792 12.06 L 27.263 4.38 L 15.281 0.317 Z"
              fill={getPartFill('right_hand')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Left Foot */}
          <svg
            {...handlePartInteraction('left_foot')}
            aria-label="Left Foot"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '-35.5px', top: '455px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="33.71"
            viewBox="0 0 28 33.71"
          >
            <path
              d="M 2.167 22.595 L 14.491 2.905 L 22.295 3.398 L 26.954 7.665 L 23.162 33.553 L 18.986 33.71 L 17.194 25.729 L 16.559 31.003 L 15.009 31.095 L 13.441 25.263 L 12.93 30.591 L 10.683 29.829 L 9.88 24.825 L 9.052 29.4 L 6.436 29.455 L 6.018 24.163 L 5.097 29.251 L 2.073 28.438 L 2.167 22.595 Z"
              fill={getPartFill('left_foot')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>

          {/* Right Foot */}
          <svg
            {...handlePartInteraction('right_foot')}
            aria-label="Right Foot"
            className="absolute cursor-pointer transition-all duration-200"
            style={{ left: '50%', marginLeft: '5.5px', top: '455px' }}
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="33.198"
            viewBox="0 0 28 33.198"
          >
            <path
              d="M 6.378 3.485 L 6.18 26.763 L 7.958 33.198 L 11.794 33.082 L 11.963 27.717 L 13.86 32.134 L 15.962 31.932 L 15.795 27.255 L 18.39 31.123 L 20.696 30.607 L 19.257 26.201 L 23.069 29.834 L 24.706 29.107 L 23.997 24.581 L 26.322 27.261 L 27.578 25.159 L 20.436 6.313 L 13.535 1.527 L 6.378 3.485 Z"
              fill={getPartFill('right_foot')}
              stroke="#CBD5E1"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      {/* Medical Labels */}
      <div className="flex flex-col gap-4 w-full lg:w-96">
        {labels.map((label) => {
          const isHighlighted = currentHover === label.part;

          return (
            <div
              key={label.part}
              className={`
                relative z-10 bg-white rounded-lg p-4 border-2 shadow-md transition-all duration-200 cursor-pointer
                ${
                  isHighlighted
                    ? 'border-[#00BFA6] shadow-lg scale-105'
                    : 'border-[#F8B400] hover:border-[#00BFA6] hover:shadow-lg'
                }
              `}
              onMouseEnter={() => setHoveredLabel(label.part)}
              onMouseLeave={() => setHoveredLabel(null)}
              onClick={() => onPartClick?.(label.part)}
            >
              <h3 className="text-lg font-bold text-[#00BFA6] mb-2">
                {label.title}
              </h3>
              <ul className="space-y-1">
                {label.conditions.map((condition, idx) => (
                  <li
                    key={idx}
                    className="text-sm text-gray-700 flex items-start"
                  >
                    <span className="text-[#F8B400] mr-2">•</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}

        {labels.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-6 text-center border-2 border-dashed border-gray-300">
            <p className="text-gray-500">No medical conditions tracked yet.</p>
            <p className="text-sm text-gray-400 mt-2">
              Click on body parts to add conditions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}