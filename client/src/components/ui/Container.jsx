import React from 'react';

export function Container({
  children,
  className = '',
  clean = false
}) {
  return (
    <div className={`w-full max-w-[1440px] mx-auto ${clean ? '' : 'px-6 md:px-12 lg:px-20'} ${className}`}>
      {children}
    </div>
  );
}
