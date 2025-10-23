import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
      <div className="flex items-center justify-center space-x-4">
        <Frown className="h-16 w-16 text-primary" />
        <div>
          <h1 className="text-6xl font-bold font-headline text-primary">404</h1>
        </div>
      </div>
      <h2 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
        Oops! Page Not Found.
      </h2>
      <p className="mt-2 text-muted-foreground">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link href="/dashboard">Go back to Dashboard</Link>
      </Button>
    </div>
  );
}
