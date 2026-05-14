'use client';

import { StatusBadge } from '@/components/shared/status-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuditTimeline } from './_components/audit-timeline';
import { DocumentList } from './_components/document-list';
import { ActionDialog } from '@/components/shared/action-dialog';
import { useAuth } from '@/providers/auth.provider';
import { ApplicationStatus } from '@/types';
import { 
  AlertCircle, Building2, Calendar, CheckCircle2, Clock, Download, 
  FileEdit, FileText, MessageSquare, Send, UserPlus, XCircle 
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { 
  useApproveApplication, useAssignApplication, useCompleteReview, 
  useGetApplicationAudit, useGetApplicationById, useRejectApplication, 
  useRequestInfo, useSubmitApplication, useResubmitApplication
} from '@/hooks/api/use-applications';

export default function ApplicationDetailsPage() {
  const { identifier } = useParams() as { identifier: string };
  const { user } = useAuth();
  const router = useRouter();
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmText?: string;
    confirmAction: (note: string) => Promise<void>;
    variant?: 'default' | 'destructive' | 'success';
    requireNote?: boolean;
    noteLabel?: string;
    notePlaceholder?: string;
  }>({ 
    open: false, 
    title: '', 
    description: '', 
    confirmAction: async () => {},
  });

  // 1. Fetch Application & Audit
  const { data: app, isLoading, error } = useGetApplicationById(identifier);
  const isInternal = user?.role !== 'APPLICANT';
  const { data: auditLogs } = useGetApplicationAudit(identifier);

  // Mutations
  const { mutateAsync: assignApp } = useAssignApplication();
  const { mutateAsync: approveApp } = useApproveApplication();
  const { mutateAsync: requestInfo } = useRequestInfo();
  const { mutateAsync: completeReview } = useCompleteReview();
  const { mutateAsync: rejectApp } = useRejectApplication();
  const { mutateAsync: submitApp } = useSubmitApplication();
  const { mutateAsync: resubmit } = useResubmitApplication();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-3">
          <Skeleton className="md:col-span-2 h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Failed to load application details.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-8">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{app.institutionName}</h1>
            <StatusBadge status={app.status} />
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-500 text-sm font-medium">
            <span className="flex items-center gap-1.5"><FileText className="h-4 w-4 text-slate-400" /> {app.refNumber}</span>
            <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4 text-slate-400" /> {app.institutionType.replace('_', ' ')}</span>
            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4 text-slate-400" /> {new Date(app.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* STAFF ACTIONS */}
          {isInternal && (
            <>
              {app.status === ApplicationStatus.SUBMITTED && !app.reviewerId && (
                <Button 
                  className="w-full sm:w-auto shadow-sm"
                  onClick={() => setActionDialog({
                    open: true,
                    title: 'Assign to Me',
                    description: 'You will be responsible for reviewing this application. This action will change the status to Under Review.',
                    confirmText: 'Assign Application',
                    confirmAction: async () => { await assignApp(app.id); }
                  })}
                >
                  <UserPlus className="mr-2 h-4 w-4" /> Assign to Me
                </Button>
              )}
              
              {(app.status === ApplicationStatus.SUBMITTED || app.status === ApplicationStatus.UNDER_REVIEW) && app.reviewerId === user?.id && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    className="flex-1 sm:flex-none shadow-sm"
                    onClick={() => setActionDialog({
                      open: true,
                      title: 'Request Information',
                      description: 'The application will be sent back to the applicant for updates. Please specify what information is missing.',
                      confirmText: 'Request Info',
                      requireNote: true,
                      noteLabel: 'Reason for Request',
                      notePlaceholder: 'Describe what needs to be updated...',
                      confirmAction: async (note) => { await requestInfo({ id: app.id, notes: note }); }
                    })}
                  >
                    <FileEdit className="mr-2 h-4 w-4" /> Request Info
                  </Button>
                  <Button 
                    className="flex-1 sm:flex-none shadow-sm"
                    onClick={() => setActionDialog({
                      open: true,
                      title: 'Complete Review',
                      description: 'Your review will be finalized and forwarded to an approver for the final decision.',
                      confirmText: 'Complete Review',
                      requireNote: true,
                      noteLabel: 'Reviewer Notes',
                      notePlaceholder: 'Summarize your findings and recommendations...',
                      confirmAction: async (note) => { await completeReview({ id: app.id, reviewerNotes: note }); }
                    })}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Review
                  </Button>
                </div>
              )}

              {app.status === ApplicationStatus.REVIEWED && user?.role === 'APPROVER' && (
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button 
                    variant="destructive" 
                    className="flex-1 sm:flex-none shadow-sm"
                    onClick={() => setActionDialog({
                      open: true,
                      title: 'Reject Application',
                      description: 'This application will be rejected. This action is final and will notify the applicant.',
                      confirmText: 'Reject Application',
                      variant: 'destructive',
                      requireNote: true,
                      noteLabel: 'Rejection Reason',
                      notePlaceholder: 'Clearly state why the application is being rejected...',
                      confirmAction: async (note) => { await rejectApp({ id: app.id, rejectionReason: note }); }
                    })}
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                  <Button 
                    className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 shadow-sm" 
                    onClick={() => setActionDialog({
                      open: true,
                      title: 'Approve Application',
                      description: 'This will grant the license to the institution. This action is final.',
                      confirmText: 'Approve Application',
                      variant: 'success',
                      requireNote: true,
                      noteLabel: 'Final Decision Notes',
                      notePlaceholder: 'Any final comments on this approval...',
                      confirmAction: async (note) => { await approveApp({ id: app.id, notes: note }); }
                    })}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Application
                  </Button>
                </div>
              )}
            </>
          )}

          {/* APPLICANT ACTIONS */}
          {!isInternal && (
            <>
              {app.status === ApplicationStatus.DRAFT && (
                <>
                  <Button 
                    variant="outline"
                    className="w-full sm:w-auto shadow-sm"
                    onClick={() => router.push(`/applications/${app.refNumber}/edit`)}
                  >
                    <FileEdit className="mr-2 h-4 w-4" /> Edit Details
                  </Button>
                  <Button 
                    className="w-full sm:w-auto shadow-sm"
                    onClick={() => setActionDialog({
                      open: true,
                      title: 'Submit Application',
                      description: 'Are you sure you want to submit this application? You will not be able to edit it after submission.',
                      confirmText: 'Submit Now',
                      confirmAction: async () => { await submitApp(app.id); }
                    })}
                  >
                    <Send className="mr-2 h-4 w-4" /> Submit Application
                  </Button>
                </>
              )}
              {app.status === ApplicationStatus.PENDING_INFO && (
                <>
                  <Button 
                    variant="outline"
                    className="w-full sm:w-auto shadow-sm"
                    onClick={() => router.push(`/applications/${app.refNumber}/edit`)}
                  >
                    <FileEdit className="mr-2 h-4 w-4" /> Edit Details
                  </Button>
                  <Button 
                    className="w-full sm:w-auto shadow-sm"
                    onClick={() => setActionDialog({
                      open: true,
                      title: 'Resubmit Application',
                      description: 'Have you provided all the requested information and documents? This will send the application back for review.',
                      confirmText: 'Resubmit Now',
                      confirmAction: async () => { await resubmit(app.id); }
                    })}
                  >
                    <Send className="mr-2 h-4 w-4" /> Resubmit Application
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-8">
        {/* Main Content */}
        <div className="md:col-span-5 space-y-6">
          {app.status === ApplicationStatus.PENDING_INFO && app.reviewerNotes && (
            <Card className="border-amber-200 bg-amber-50/30 overflow-hidden shadow-sm">
              <CardHeader className="bg-amber-100/50 border-b border-amber-200 flex flex-row items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-xl text-amber-900">Reviewer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-wrap">{app.reviewerNotes}</p>
                {app.status === ApplicationStatus.PENDING_INFO && (
                  <p className="mt-4 text-sm text-amber-700 bg-amber-100/50 p-3 rounded-lg border border-amber-200/50">
                    <strong>Action Required: </strong> Please update the application details or upload missing documents, then click &quot;Resubmit Application&quot; above.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 overflow-hidden shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-xl">Application details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Registration Number</p>
                <p className="text-slate-900 font-bold text-lg">{app.registrationNumber}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Proposed Capital</p>
                <p className="text-slate-900 font-bold text-lg">{new Intl.NumberFormat('en-RW', { style: 'currency', currency: 'RWF' }).format(app.proposedCapital)}</p>
              </div>
              <div className="md:col-span-2 space-y-2 pt-4 border-t border-slate-100 mt-2">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Applicant Notes</p>
                <p className="text-slate-700 leading-relaxed">{app.applicantNotes || 'No notes provided.'}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50/50 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-slate-500" />
                <CardTitle className="text-xl">Supporting documents</CardTitle>
                {app.documents.length > 0 && (
                  <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                    {app.documents.length} {app.documents.length === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" className="h-9 px-4 font-bold shadow-sm">
                <Download className="mr-2 h-4 w-4" /> Download All
              </Button>
            </CardHeader>
            <CardContent>
              <DocumentList 
                documents={app.documents || []} 
                onDownload={(id) => console.log('Download', id)} 
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="md:col-span-3 space-y-6">
          {/* Sidebars for STAFF ONLY */}
          {isInternal && (
            <Card className="border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50/50 border-b">
                <CardTitle className="text-xl">Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Reviewer</p>
                    <p className="text-sm text-slate-500">{app.reviewer?.fullName || 'Not assigned'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Approver</p>
                    <p className="text-sm text-slate-500">{app.approver?.fullName || 'Not decided'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b flex flex-row items-center gap-2">
              <Clock className="h-5 w-5 text-slate-500" />
              <CardTitle className="text-xl">Audit History</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[558px] overflow-y-auto custom-scrollbar scroll-shadows">
              <AuditTimeline logs={auditLogs || []} />
            </CardContent>
          </Card>
        </div>
      </div>

      <ActionDialog 
        {...actionDialog} 
        onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))} 
        onConfirm={actionDialog.confirmAction} 
      />
    </div>
  );
}
