import * as React from 'react';
import { cn } from './lib/utils';

export interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  icon?: React.ReactNode;
}

const variantStyles = {
  default: 'bg-muted text-foreground',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/10 text-warning border border-warning/20',
  info: 'bg-info/10 text-info border border-info/20',
  danger: 'bg-danger/10 text-danger border border-danger/20',
};

const StatPill = React.forwardRef<HTMLDivElement, StatPillProps>(
  ({ className, label, value, variant = 'default', icon, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        <div className="flex items-center gap-1.5">
          <span className="text-xs opacity-80">{label}</span>
          <span className="font-bold text-base">{value}</span>
        </div>
      </div>
    );
  }
);
StatPill.displayName = 'StatPill';

export { StatPill };