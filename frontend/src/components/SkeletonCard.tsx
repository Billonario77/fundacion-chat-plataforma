import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-gray-200 rounded"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        <div className="h-3 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="h-3 bg-gray-200 rounded col-span-1"></div>
          <div className="h-3 bg-gray-200 rounded col-span-1"></div>
          <div className="h-3 bg-gray-200 rounded col-span-1"></div>
          <div className="h-3 bg-gray-200 rounded col-span-1"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4">
            <div className="h-3 bg-gray-200 rounded col-span-1"></div>
            <div className="h-3 bg-gray-200 rounded col-span-1"></div>
            <div className="h-3 bg-gray-200 rounded col-span-1"></div>
            <div className="h-3 bg-gray-200 rounded col-span-1"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SkeletonChart: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
      <div className="h-48 bg-gray-200 rounded"></div>
    </div>
  );
};

export const SkeletonStats: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 ${className}`}>
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonButton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`h-10 w-24 bg-gray-200 rounded-lg animate-pulse ${className}`}></div>
  );
};
