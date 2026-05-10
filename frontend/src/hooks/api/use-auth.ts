import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth.provider';
import { apiClient } from '@/lib/api-client';
import { Role } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';

export function useLogin() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  return useMutation({
    mutationFn: async ({ email, password }: Record<string, string>) => {
      await authLogin(email, password);
      return apiClient.get<{ role: Role }>('/users/me');
    },
    onSuccess: (userProfile) => {
      const redirectPath = searchParams.get('redirect');
      
      if (redirectPath) {
        router.push(redirectPath);
      } else if (userProfile.role === Role.APPLICANT) {
        router.push('/applications');
      } else {
        router.push('/dashboard');
      }
    },
  });
}
