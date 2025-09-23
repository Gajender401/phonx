'use client'
import React, { useState } from 'react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  maxLength = 150,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Check if text needs truncation
  const shouldTruncate = text.length > maxLength;
  const displayText = shouldTruncate && !isExpanded
    ? text.substring(0, maxLength).trim() + '...'
    : text;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={className}>
      <div className="text-white">
        {displayText}
      </div>
      {shouldTruncate && (
        <button
          onClick={handleToggle}
          className="text-[#9D9D9D] underline hover:text-[#9D9D9D]/80 mt-1 block"
          style={{ color: '#9D9D9D' }}
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default ExpandableText;
