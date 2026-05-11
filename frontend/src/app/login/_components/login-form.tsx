'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

import { Landmark } from 'lucide-react';
import { useLogin } from '@/hooks/api/use-auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { mutate: login, isPending: isLoading } = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    login(data);
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-[400px] border-0 shadow-lg ring-1 ring-slate-200">
        <CardHeader className="space-y-2 pt-8 pb-6">
          <div className="mb-4 flex justify-center">
            <div className="bg-primary/10 rounded-full p-3">
              <Landmark className="text-primary h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            Welcome to BNR Portal
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Sign in to your account to continue
          </CardDescription>
        </CardHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(onSubmit)(e);
          }}
        >
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@organization.rw"
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-red-500' : ''}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="h-11 w-full text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
