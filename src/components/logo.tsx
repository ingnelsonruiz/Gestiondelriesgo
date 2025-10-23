import { Feather } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="bg-primary text-primary-foreground p-2 rounded-md">
        <Feather className="h-5 w-5" />
      </div>
      {!iconOnly && (
        <h1 className="text-lg font-headline font-semibold text-sidebar-foreground">
          Fenix Reports
        </h1>
      )}
    </div>
  );
}
