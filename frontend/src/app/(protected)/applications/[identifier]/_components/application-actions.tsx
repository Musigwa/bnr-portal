'use client';

import { Button } from '@/components/ui/button';
import { Application, ApplicationStatus, Role } from '@/types';
import { CheckCircle2, FileEdit, Play, Send, UserPlus, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { 
  useApproveApplication, useAssignApplication, useCompleteReview, 
  useRejectApplication, useRequestInfo, useResubmitApplication, useSubmitApplication 
} from '@/hooks/api/use-applications';

interface ActionDialogState {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  variant?: 'default' | 'destructive' | 'success';
  requireNote?: boolean;
  noteLabel?: string;
  notePlaceholder?: string;
  confirmAction: (note: string) => Promise<void>;
}

interface ApplicationActionsProps {
  app: Application;
  userRole: Role;
  userId?: string;
  setActionDialog: (dialog: ActionDialogState) => void;
}

export function ApplicationActions({ app, userRole, userId, setActionDialog }: ApplicationActionsProps) {
  const router = useRouter();
  const isInternal = userRole !== Role.APPLICANT;

  const { mutateAsync: assignApp } = useAssignApplication();
  const { mutateAsync: requestInfo } = useRequestInfo();
  const { mutateAsync: completeReview } = useCompleteReview();
  const { mutateAsync: rejectApp } = useRejectApplication();
  const { mutateAsync: approveApp } = useApproveApplication();
  const { mutateAsync: submitApp } = useSubmitApplication();
  const { mutateAsync: resubmit } = useResubmitApplication();

  const handleAction = async (actionFn: () => Promise<unknown>) => {
    try {
      await actionFn();
      setActionDialog({ open: false, title: '', description: '', confirmAction: async () => {} });
    } catch {
      // Error handled by API client
    }
  };

  return (
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
                confirmAction: async () => { 
                  await handleAction(() => assignApp(app.id)); 
                }
              })}
            >
              <UserPlus className="mr-2 h-4 w-4" /> Assign to Me
            </Button>
          )}
          
          {(app.status === ApplicationStatus.SUBMITTED || app.status === ApplicationStatus.UNDER_REVIEW) && app.reviewerId === userId && (
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
                  confirmAction: async (note) => { 
                    await handleAction(() => requestInfo({ id: app.id, notes: note || '' })); 
                  }
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
                  confirmAction: async (note) => { 
                    await handleAction(() => completeReview({ id: app.id, reviewerNotes: note || '' })); 
                  }
                })}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Complete Review
              </Button>
            </div>
          )}

          {app.status === ApplicationStatus.REVIEWED && userRole === 'APPROVER' && (
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
                  confirmAction: async (note) => { 
                    await handleAction(() => rejectApp({ id: app.id, rejectionReason: note || '' })); 
                  }
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
                  confirmAction: async (note) => { 
                    await handleAction(() => approveApp({ id: app.id, notes: note || '' })); 
                  }
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
                <FileEdit className="mr-2 h-4 w-4" /> Edit Draft
              </Button>
              <Button 
                className="w-full sm:w-auto shadow-sm"
                onClick={() => setActionDialog({
                  open: true,
                  title: 'Submit Application',
                  description: 'Are you sure you want to submit this application? You will not be able to edit it once submitted.',
                  confirmText: 'Submit Application',
                  confirmAction: async () => { 
                    await handleAction(() => submitApp(app.id)); 
                  }
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
                <FileEdit className="mr-2 h-4 w-4" /> Update Details
              </Button>
              <Button 
                className="w-full sm:w-auto shadow-sm"
                onClick={() => setActionDialog({
                  open: true,
                  title: 'Resubmit Application',
                  description: 'Have you provided all the requested information and documents? This will send the application back for review.',
                  confirmText: 'Resubmit Application',
                  confirmAction: async () => { 
                    await handleAction(() => resubmit(app.id)); 
                  }
                })}
              >
                <Play className="mr-2 h-4 w-4" /> Resubmit Application
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
}
