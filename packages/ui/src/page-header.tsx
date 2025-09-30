import * as React from 'react';
import { cn } from './lib/utils';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  variant?: 'default' | 'dark';
}

const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ className, children, variant = 'default', ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'w-full px-4 py-6 md:px-6 lg:px-8',
          variant === 'dark' && 'bg-charcoal text-white',
          variant === 'default' && 'bg-white border-b border-border',
          className
        )}
        {...props}
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </header>
    );
  }
);
PageHeader.displayName = 'PageHeader';

export { PageHeader };