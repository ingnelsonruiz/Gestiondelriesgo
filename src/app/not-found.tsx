import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-4">
          <Logo iconOnly />
          <h1 className="text-6xl font-bold font-headline text-primary">404</h1>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Oops! Page Not Found.
        </h2>
        <p className="max-w-md text-muted-foreground">
          The page you are looking for does not exist, has been moved, or you do
          not have permission to access it.
        </p>
        <Button asChild className="mt-4">
          <Link href="/">Go to Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
