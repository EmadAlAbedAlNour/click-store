import React from 'react';

export const SkeletonBar = ({ className = '' }) => <div className={`skeleton ${className}`}></div>;

export const PageSkeleton = () => (
  <div className="container mx-auto px-6 max-w-7xl py-12 space-y-6">
    <SkeletonBar className="h-10 w-72" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="premium-panel p-4 space-y-4">
          <SkeletonBar className="h-44 w-full rounded-2xl" />
          <SkeletonBar className="h-4 w-2/3" />
          <SkeletonBar className="h-4 w-1/2" />
          <SkeletonBar className="h-8 w-1/3" />
        </div>
      ))}
    </div>
  </div>
);


