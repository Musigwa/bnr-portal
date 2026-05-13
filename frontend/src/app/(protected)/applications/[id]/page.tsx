'use client';

import { AuditTimeline } from '@/components/shared/audit-timeline';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { DocumentList } from '@/components/shared/document-list';
import { StatusBadge } from '@/components/shared/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/providers/auth.provider';
import { Application, ApplicationStatus, AuditLog } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Building2, Calendar, CheckCircle2, Download, FileEdit, FileText, UserPlus, XCircle } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function ApplicationDetailsPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
    variant?: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', action: () => {} });

  // 1. Fetch Application
  const { data: app, isLoading, error } = useQuery<Application>({
    queryKey: ['applications', id],
    queryFn: () => apiClient.get(`/applications/${id}`),
  });

  // 2. Fetch Audit Logs (Only for internal staff)
  const isInternal = user?.role !== 'APPLICANT';
  const { data: auditLogs, isLoading: loadingAudit } = useQuery<AuditLog[]>({
    queryKey: ['applications', id, 'audit'],
    queryFn: () => apiClient.get(`/applications/${id}/audit`),
    enabled: isInternal && !!app,
  });

  // Mutations
  const actionMutation = useMutation({
    mutationFn: async ({ endpoint, payload }: { endpoint: string, payload?: Record<string, unknown> }) => {
      return apiClient.post(`/applications/${id}/${endpoint}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', id] });
      if (isInternal) {
        queryClient.invalidateQueries({ queryKey: ['applications', id, 'audit'] });
      }
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    }
  });

  const handleAction = (endpoint: string, title: string, description: string, payload?: Record<string, unknown>, variant: 'default' | 'destructive' = 'default') => {
    setConfirmDialog({
      open: true,
      title,
      description,
      variant,
      action: () => actionMutation.mutate({ endpoint, payload })
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pt-2">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="md:col-span-2 h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="pt-2">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load application details. It may not exist or you don&apos;t have permission to view it.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {app.institutionName}
            </h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="text-muted-foreground">
            {isInternal 
              ? "Review application details, documents, and audit history."
              : "Review your application details and uploaded documents."}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {user?.role === 'REVIEWER' && app.status === ApplicationStatus.SUBMITTED && (
            <Button onClick={() => handleAction('assign-reviewer', 'Assign to me', 'You will be responsible for reviewing this application.')}>
              <UserPlus className="mr-2 h-4 w-4" /> Assign to me
            </Button>
          )}

          {user?.role === 'REVIEWER' && app.status === ApplicationStatus.UNDER_REVIEW && app.reviewerId === user.id && (
            <>
              <Button variant="outline" onClick={() => handleAction('request-info', 'Request Info', 'Send application back to applicant for more information.', { reason: 'Please update documents.' })}>
                <FileEdit className="mr-2 h-4 w-4" /> Request Info
              </Button>
              <Button onClick={() => handleAction('complete-review', 'Complete Review', 'Forward this application to an approver.', { comments: 'Looks good.' })}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Review
              </Button>
            </>
          )}

          {user?.role === 'APPROVER' && app.status === ApplicationStatus.REVIEWED && app.reviewerId !== user.id && (
            <>
              <Button variant="destructive" onClick={() => handleAction('reject', 'Reject Application', 'This action is final.', { reason: 'Does not meet criteria' }, 'destructive')}>
                <XCircle className="mr-2 h-4 w-4" /> Reject
              </Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAction('approve', 'Approve Application', 'This will grant the license. This action is final.')}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Top Info Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Alerts */}
        {app.status === ApplicationStatus.APPROVED && (
          <div className="md:col-span-2 lg:col-span-3">
            <Alert className="bg-green-50 border-green-200 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-800 font-bold text-lg">License Approved</AlertTitle>
              <AlertDescription className="text-green-700 mt-1 text-base">
                Your bank licensing application has been successfully approved by the National Bank of Rwanda. You can now download your official license below.
                <div className="mt-4">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white shadow-sm font-semibold"
                    onClick={() => alert('Downloading Official License (Mock)')}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download Official License
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {app.rejectionReason && (
          <div className="md:col-span-2 lg:col-span-3">
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <XCircle className="h-5 w-5 text-red-600" />
              <AlertTitle className="text-red-800 font-bold text-lg">Application Rejected</AlertTitle>
              <AlertDescription className="text-red-700 mt-1 text-base">
                <span className="font-semibold">Reason:</span> {app.rejectionReason}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Core Details Card */}
        <Card className="shadow-sm border-slate-200/60 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-slate-400" />
              Application Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
            <div className="space-y-1">
              <p className="text-slate-500 font-medium">Institution Type</p>
              <p className="font-semibold text-slate-900 capitalize">{app.institutionType.replace('_', ' ').toLowerCase()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-medium">Registration Number</p>
              <p className="font-semibold text-slate-900">{app.registrationNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-medium">Proposed Capital</p>
              <p className="font-semibold text-slate-900">
                {app.proposedCapital != null 
                  ? new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(app.proposedCapital)
                  : 'Not specified'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-500 font-medium">Submission Date</p>
              <p className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-slate-400" />
                {new Date(app.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Reviewer / Admin Info Card */}
        <Card className="shadow-sm border-slate-200/60 bg-slate-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-slate-400" />
              Assigned Reviewer
            </CardTitle>
          </CardHeader>
          <CardContent>
            {app.reviewer ? (
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20 text-lg shadow-inner">
                  {app.reviewer.fullName.charAt(0)}
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-slate-900 text-base">{app.reviewer.fullName}</p>
                  <p className="text-sm text-slate-500">{app.reviewer.email}</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-2 py-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 border-dashed">
                  <UserPlus className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">No reviewer assigned yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Section: Reviewer & Applicant */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Reviewer Notes */}
        {app.reviewerNotes && (
          <Card className={`shadow-sm md:col-span-1 ${
            app.status === ApplicationStatus.APPROVED ? 'border-green-200/60 bg-green-50/10' :
            app.status === ApplicationStatus.REJECTED ? 'border-red-200/60 bg-red-50/10' :
            'border-amber-200/60 bg-amber-50/10'
          }`}>
            <CardHeader className="pb-3">
              <CardTitle className={`text-lg flex items-center gap-2 ${
                app.status === ApplicationStatus.APPROVED ? 'text-green-900' :
                app.status === ApplicationStatus.REJECTED ? 'text-red-900' :
                'text-amber-900'
              }`}>
                {app.status === ApplicationStatus.APPROVED ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : app.status === ApplicationStatus.REJECTED ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                BNR Reviewer Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`rounded-lg p-5 text-sm whitespace-pre-wrap border shadow-sm leading-relaxed ${
                app.status === ApplicationStatus.APPROVED ? 'bg-white text-green-950 border-green-100' :
                app.status === ApplicationStatus.REJECTED ? 'bg-white text-red-950 border-red-100' :
                'bg-white text-amber-950 border-amber-100'
              }`}>
                {app.reviewerNotes}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Applicant Notes */}
        {app.applicantNotes && (
          <Card className={`shadow-sm border-slate-200/60 ${!app.reviewerNotes ? 'md:col-span-2' : 'md:col-span-1'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-400" />
                Applicant Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-slate-50 rounded-lg p-5 text-sm text-slate-700 whitespace-pre-wrap border border-slate-100 shadow-inner leading-relaxed">
                {app.applicantNotes}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Documents Section */}
      <div className="pt-2">
        <DocumentList 
          documents={app.documents || []} 
          onDownload={(id, name) => alert(`Downloading ${name} (Mock)`)} 
        />
      </div>

      {isInternal && (
        <div className="pt-2">
          {loadingAudit ? (
            <Skeleton className="h-[400px] w-full rounded-xl" />
          ) : (
            <AuditTimeline logs={auditLogs || []} />
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
