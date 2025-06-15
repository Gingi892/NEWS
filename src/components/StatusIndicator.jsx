import React from 'react';
import { Shield, AlertTriangle, AlertCircle } from 'lucide-react';

const statusConfig = {
  green: {
    icon: Shield,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'שקט',
    description: 'המצב רגוע'
  },
  yellow: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    label: 'זהירות',
    description: 'מצב מוגבר'
  },
  red: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'חירום',
    description: 'מצב חירום'
  }
};

export default function StatusIndicator({ status, size = 'normal' }) {
  const config = statusConfig[status] || statusConfig.green;
  const Icon = config.icon;
  
  const sizeClasses = size === 'large' 
    ? 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 p-2 sm:p-3 md:p-4' 
    : 'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 p-1 sm:p-2 md:p-3';
  
  const iconSizeClasses = size === 'large' 
    ? 'w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8' 
    : 'w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6';

  return (
    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
      <div className={`${sizeClasses} ${config.bgColor} ${config.borderColor} border-2 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Icon className={`${iconSizeClasses} ${config.color}`} />
      </div>
      <div className="min-w-0">
        <h3 className={`font-bold ${config.color} ${size === 'large' ? 'text-base sm:text-lg md:text-xl' : 'text-sm sm:text-base md:text-lg'} leading-tight`}>
          {config.label}
        </h3>
        <p className="text-slate-500 text-xs sm:text-sm leading-tight">{config.description}</p>
      </div>
    </div>
  );
}