'use client'
import React, { useState } from 'react';
import GaugeChart from 'react-gauge-chart';

const ClaireCallsGauge = () => {
  // Calculate percentage (assuming 20 out of 30 total calls for this example)
  const totalCalls = 30;
  const claireHandledCalls = 20;
  const othersHandledCalls = totalCalls - claireHandledCalls;
  const percentage = claireHandledCalls / totalCalls;
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipData, setTooltipData] = useState({ type: '', value: 0, percentage: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Handle mouse events for tooltip
  const handleMouseEnter = (event: React.MouseEvent, type: 'claire' | 'others') => {
    const value = type === 'claire' ? claireHandledCalls : othersHandledCalls;
    const percent = type === 'claire' ? (claireHandledCalls / totalCalls) * 100 : (othersHandledCalls / totalCalls) * 100;
    
    setTooltipData({
      type: type === 'claire' ? 'Claire' : 'Others',
      value,
      percentage: Math.round(percent)
    });
    setMousePosition({ x: event.clientX, y: event.clientY });
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (showTooltip) {
      setMousePosition({ x: event.clientX, y: event.clientY });
    }
  };

  return (
    <div className="content-area">

      <div
        className="flex items-center justify-center min-h-screen"
        style={{ backgroundColor: '#4a5568' }}
        onMouseMove={handleMouseMove}
      >
      <div className="rounded-xl p-8 shadow-2xl max-w-md w-full" style={{ backgroundColor: '#4a5568' }}>
        <div className="text-center">
          <div className="relative mb-6">
            {/* SVG overlay for hover zones */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <svg width="100%" height="100%" viewBox="0 0 400 200" className="pointer-events-auto">
                {/* Claire's section hover area (left arc) */}
                <path
                  d="M 80 160 A 80 80 0 0 1 200 80 L 200 120 A 40 40 0 0 0 120 160 Z"
                  fill="transparent"
                  className="cursor-pointer pointer-events-auto"
                  onMouseEnter={(e) => handleMouseEnter(e, 'claire')}
                  onMouseLeave={handleMouseLeave}
                />
                {/* Others section hover area (right arc) */}
                <path
                  d="M 200 80 A 80 80 0 0 1 320 160 L 280 160 A 40 40 0 0 0 200 120 Z"
                  fill="transparent"
                  className="cursor-pointer pointer-events-auto"
                  onMouseEnter={(e) => handleMouseEnter(e, 'others')}
                  onMouseLeave={handleMouseLeave}
                />
              </svg>
            </div>

            <GaugeChart
              id="claire-calls-gauge"
              nrOfLevels={2}
              colors={['#8B5CF6', '#9CA3AF']}
              arcWidth={0.2}
              percent={percentage}
              textColor="transparent"
              needleColor="transparent"
              needleBaseColor="transparent"
              hideText={true}
              animDelay={0}
              animateDuration={1500}
              cornerRadius={10}
              marginInPercent={0.02}
            />
            
            {/* Custom center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-7xl font-bold text-white mb-1" style={{ fontSize: '4.5rem' }}>
                {claireHandledCalls}
              </div>
              <div className="text-gray-300 text-base font-medium leading-tight">
                Calls handled by Claire
              </div>
              <div className="text-gray-400 text-sm mt-3">
                Last Updated on 21 Apr
              </div>
            </div>
          </div>
          
          {/* Legend with labels pointing to the arc */}
          <div className="relative">
            {/* Claire label */}
            <div className="absolute left-8 top-0 flex items-center">
              <span className="text-gray-300 text-sm mr-2">Claire</span>
              <div className="w-8 h-0.5 bg-gray-300"></div>
            </div>
            
            {/* Others label */}
            <div className="absolute right-8 top-0 flex items-center">
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <span className="text-gray-300 text-sm ml-2">Others</span>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Custom Tooltip */}
      {showTooltip && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: mousePosition.x + 10,
            top: mousePosition.y - 10,
            transform: 'translate(0, -100%)'
          }}
        >
          <div className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg border border-gray-600">
            <div className="text-sm font-semibold">{tooltipData.type}</div>
            <div className="text-xs text-gray-300">
              {tooltipData.value} calls ({tooltipData.percentage}%)
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaireCallsGauge;
