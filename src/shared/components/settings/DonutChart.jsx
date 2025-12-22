/**
 * Donut Chart Component
 * Displays storage breakdown as a donut chart
 * Uses pure SVG for lightweight rendering
 */

import React from 'react';

const DonutChart = ({ data, total, size = 200 }) => {
  const radius = size / 2 - 20;
  const circumference = 2 * Math.PI * radius;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90; // Start from top

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const angle = (percentage / 100) * 360;
    
    const rotation = currentAngle;
    currentAngle += angle;

    return {
      ...item,
      strokeDasharray,
      rotation,
      percentage
    };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="30"
            className="dark:stroke-gray-700"
          />
          
          {/* Data segments */}
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="30"
              strokeDasharray={segment.strokeDasharray}
              strokeDashoffset={0}
              style={{
                transform: `rotate(${segment.rotation}deg)`,
                transformOrigin: 'center',
                transition: 'all 0.3s ease'
              }}
              className="hover:opacity-80"
            />
          ))}
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
            {(total / 1024 / 1024).toFixed(1)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">MB USED</p>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full max-w-sm">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">
                {item.label}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {(item.value / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
