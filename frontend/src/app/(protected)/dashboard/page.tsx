'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useApproveApplication, useAssignApplication, useGetApplications } from '@/hooks/api/use-applications';
import { useAuth } from '@/providers/auth.provider';
import { ApplicationStatus, Role } from '@/types';
import { useMemo } from 'react';
import { DashboardStats } from './_components/dashboard-stats';
import { DashboardTable } from './_components/dashboard-table';

import { notify } from '@/lib/notifications';

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: applications, isLoading } = useGetApplications();
  const { mutateAsync: assignApp } = useAssignApplication();
  const { mutateAsync: approveApp } = useApproveApplication();

  const counts = useMemo(() => {
    const data = applications?.data || [];
    if (!data.length) return { total: 0, pending: 0, awaitingDecision: 0, decidedThisMonth: 0 };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      total: data.length,
      pending: data.filter(a => a.status === ApplicationStatus.SUBMITTED).length,
      awaitingDecision: data.filter(a => a.status === ApplicationStatus.REVIEWED).length,
      decidedThisMonth: data.filter(a => {
        if (!a.updatedAt) return false;
        return new Date(a.updatedAt) >= startOfMonth && 
               (a.status === ApplicationStatus.APPROVED || a.status === ApplicationStatus.REJECTED);
      }).length
    };
  }, [applications]);

  const handleAssign = async (id: string) => {
    try {
      await assignApp(id);
      notify.success('Application assigned successfully');
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to assign application');
      console.error('Failed to assign:', err);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveApp({ id, notes: 'Quick approved from dashboard' });
      notify.success('Application approved successfully');
    } catch (err: unknown) {
      const error = err as { message?: string };
      notify.error(error.message || 'Failed to approve application');
      console.error('Failed to approve:', err);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      
      <DashboardStats counts={counts} />

      <div className="pt-4">
        <DashboardTable 
          applications={applications?.data || []}
          userRole={user?.role || Role.APPLICANT}
          isLoading={isLoading}
          onAssign={handleAssign}
          onApprove={handleApprove}
        />
      </div>
    </div>
  );
}
