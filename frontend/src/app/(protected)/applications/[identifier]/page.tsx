'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DocumentList } from './_components/document-list';
import { ActionDialog } from '@/components/shared/action-dialog';
import { useAuth } from '@/providers/auth.provider';
import { ApplicationStatus, Role } from '@/types';
import { AlertCircle, Download, FileText, MessageSquare } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';
import { useGetApplicationAudit, useGetApplicationById } from '@/hooks/api/use-applications';

// Extracted Sub-Components
import { ApplicationHeader } from './_components/application-header';
import { ApplicationActions } from './_components/application-actions';
import { ApplicationDetailsCard } from './_components/application-details-card';
import { ApplicationSidebar } from './_components/application-sidebar';

export default function ApplicationDetailsPage() {
  const { identifier } = useParams() as { identifier: string };
  const { user } = useAuth();
  
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

  const { data: app, isLoading: appLoading, isError } = useGetApplicationById(identifier);
  const { data: auditLogs } = useGetApplicationAudit(identifier);

  const handleDownloadDocument = async (documentId: string, fileName: string) => {
    try {
      const blob = await apiClient.download(`/applications/${app?.id}/documents/${documentId}/download`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      toast.error('Failed to download document');
    }
  };

  const handleDownloadAll = async () => {
    if (!app?.documents || app.documents.length === 0) return;
    
    for (const doc of app.documents) {
      await handleDownloadDocument(doc.id, doc.fileName);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  };

  if (appLoading) {
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

  if (isError || !app) {
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
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b pb-8">
        <ApplicationHeader app={app} />
        <ApplicationActions 
          app={app} 
          userRole={user?.role || Role.APPLICANT} 
          userId={user?.id}
          setActionDialog={setActionDialog} 
        />
      </div>

      <div className="grid gap-6 md:grid-cols-8">
        {/* Main Content */}
        <div className="md:col-span-5 space-y-6">
          {app.status === ApplicationStatus.PENDING_INFO && app.reviewerNotes && (
            <Card className="border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/20 overflow-hidden shadow-sm">
              <CardHeader className="bg-amber-100/50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/30 flex flex-row items-center gap-2">
                <MessageSquare className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-xl text-amber-900 dark:text-amber-200">Reviewer Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground/90 leading-relaxed font-medium whitespace-pre-wrap">{app.reviewerNotes}</p>
                {app.status === ApplicationStatus.PENDING_INFO && (
                  <p className="mt-4 text-sm text-amber-700 dark:text-amber-300 bg-amber-100/50 dark:bg-amber-950/50 p-3 rounded-lg border border-amber-200/50 dark:border-amber-900/30">
                    <strong>Action Required: </strong> Please update the application details or upload missing documents, then click &quot;Resubmit Application&quot; above.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <ApplicationDetailsCard app={app} />

          <Card className="border-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-xl">Supporting documents</CardTitle>
                {app.documents.length > 0 && (
                  <span className="ml-2 text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                    {app.documents.length} {app.documents.length === 1 ? 'file' : 'files'}
                  </span>
                )}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-9 px-4 font-bold shadow-sm"
                onClick={handleDownloadAll}
                disabled={!app.documents || app.documents.length === 0}
              >
                <Download className="mr-2 h-4 w-4" /> Download All
              </Button>
            </CardHeader>
            <CardContent>
              <DocumentList 
                documents={app.documents || []} 
                onDownload={handleDownloadDocument}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <ApplicationSidebar 
          app={app} 
          auditLogs={auditLogs || []} 
          userRole={user?.role || Role.APPLICANT} 
        />
      </div>

      <ActionDialog 
        {...actionDialog} 
        onOpenChange={(open) => setActionDialog(prev => ({ ...prev, open }))} 
        onConfirm={actionDialog.confirmAction} 
      />
    </div>
  );
}
