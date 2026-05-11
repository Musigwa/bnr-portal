'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldX } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-1">
          <div className="mb-2 flex justify-center">
            <ShieldX className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Access Denied
          </CardTitle>
          <CardDescription>
            You do not have permission to access this page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            If you believe this is an error, please contact your administrator
            or try logging in with a different account.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-2">
          <Button onClick={() => router.back()} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => router.push('/login')}>Log In</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
