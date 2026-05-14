import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Application, AuditLog } from '@/types';

export const APPLICATION_KEYS = {
  all: ['applications'] as const,
  lists: () => [...APPLICATION_KEYS.all, 'list'] as const,
  details: (id: string) => [...APPLICATION_KEYS.all, 'detail', id] as const,
  audit: (id: string) => [...APPLICATION_KEYS.details(id), 'audit'] as const,
};

export function useGetApplications(params: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery<{ data: Application[]; meta: { total: number; page: number; limit: number; totalPages: number } }>({
    queryKey: [...APPLICATION_KEYS.lists(), params],
    queryFn: () => apiClient.get('/applications', params),
  });
}

export function useGetApplicationById(id: string) {
  return useQuery<Application>({
    queryKey: APPLICATION_KEYS.details(id),
    queryFn: () => apiClient.get(`/applications/${id}`),
    enabled: !!id,
  });
}

export function useGetApplicationAudit(id: string, enabled = true) {
  return useQuery<AuditLog[]>({
    queryKey: APPLICATION_KEYS.audit(id),
    queryFn: () => apiClient.get(`/applications/${id}/audit`),
    enabled: !!id && enabled,
  });
}

export function useAssignApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/applications/${id}/assign-reviewer`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string, notes: string }) => 
      apiClient.post(`/applications/${id}/approve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/applications/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Application>) => apiClient.post<Application>('/applications', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useRequestInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string, notes: string }) => 
      apiClient.post(`/applications/${id}/request-info`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useCompleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewerNotes }: { id: string, reviewerNotes: string }) => 
      apiClient.post(`/applications/${id}/complete-review`, { reviewerNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string, rejectionReason: string }) => 
      apiClient.post(`/applications/${id}/reject`, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Application> }) => 
      apiClient.patch<Application>(`/applications/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useResubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/applications/${id}/resubmit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, documentId }: { applicationId: string, documentId: string }) => 
      apiClient.delete(`/applications/${applicationId}/documents/${documentId}`),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.details(applicationId) });
    },
  });
}
