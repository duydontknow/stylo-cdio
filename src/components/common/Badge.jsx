import React from 'react';
import { cn } from './Button';

const Badge = ({
  children,
  className,
  variant = 'default',
  size = 'md',
}) => {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    primary: 'bg-primary text-white',
    ai: 'bg-ai/10 text-ai border border-ai/20',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 rounded-lg',
    md: 'text-sm px-3 py-1 rounded-xl',
  };

  return (
    <span className={cn("inline-flex items-center font-medium", variants[variant], sizes[size], className)}>
      {children}
    </span>
  );
};

export default Badge;
