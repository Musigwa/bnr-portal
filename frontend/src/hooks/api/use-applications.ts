import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { Application, AuditLog } from '@/types';
import { notify } from '@/lib/notifications';

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
    placeholderData: keepPreviousData,
  });
}

export function useGetApplicationsStats(params: Record<string, string | number | boolean | undefined> = {}) {
  return useQuery<{ total: number; drafts: number; submitted: number; underReview: number; pendingInfo: number; reviewed: number; approved: number; rejected: number }>({
    queryKey: [...APPLICATION_KEYS.all, 'stats', params],
    queryFn: () => apiClient.get('/applications/stats', params),
    placeholderData: keepPreviousData,
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
      notify.success('Application assigned successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to assign application');
    }
  });
}

export function useApproveApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string, notes: string }) => 
      apiClient.post(`/applications/${id}/approve`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      notify.success('Application approved successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to approve application');
    }
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/applications/${id}/submit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      notify.success('Application submitted successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to submit application');
    }
  });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Application> & { suppressNotification?: boolean }) => {
      const data = { ...payload };
      delete data.suppressNotification;
      return apiClient.post<Application>('/applications', data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      if (!variables.suppressNotification) {
        notify.success('Application created successfully');
      }
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to create application');
    }
  });
}

export function useRequestInfo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string, notes: string }) => 
      apiClient.post(`/applications/${id}/request-info`, { notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      notify.warning('Information requested successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to request information');
    }
  });
}

export function useCompleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewerNotes }: { id: string, reviewerNotes: string }) => 
      apiClient.post(`/applications/${id}/complete-review`, { reviewerNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      notify.success('Review completed successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to complete review');
    }
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, rejectionReason }: { id: string, rejectionReason: string }) => 
      apiClient.post(`/applications/${id}/reject`, { rejectionReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      notify.error('Application rejected successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to reject application');
    }
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Application>, suppressNotification?: boolean }) => 
      apiClient.patch<Application>(`/applications/${id}`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      if (!variables.suppressNotification) {
        notify.success('Application updated successfully');
      }
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to update application');
    }
  });
}

export function useResubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/applications/${id}/resubmit`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.all });
      notify.success('Application resubmitted successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to resubmit application');
    }
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, documentId }: { applicationId: string, documentId: string }) => 
      apiClient.delete(`/applications/${applicationId}/documents/${documentId}`),
    onSuccess: (_, { applicationId }) => {
      queryClient.invalidateQueries({ queryKey: APPLICATION_KEYS.details(applicationId) });
      notify.error('Document deleted successfully');
    },
    onError: (error: { message?: string }) => {
      notify.error(error.message || 'Failed to delete document');
    }
  });
}
