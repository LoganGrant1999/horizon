import * as React from 'react';
import { cn } from './lib/utils';

export interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(
  ({ className, title, subtitle, align = 'left', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'space-y-2',
          align === 'center' && 'text-center',
          align === 'left' && 'text-left',
          className
        )}
        {...props}
      >
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        {subtitle && <p className="text-lg text-muted-foreground max-w-2xl">{subtitle}</p>}
      </div>
    );
  }
);
SectionTitle.displayName = 'SectionTitle';

export { SectionTitle };