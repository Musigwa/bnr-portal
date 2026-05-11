import { Button } from '@/components/ui/button';
import { Document } from '@/types';
import { Download, File as FileIcon } from 'lucide-react';

interface DocumentListProps {
  documents: Document[];
  onDownload?: (documentId: string, fileName: string) => void;
  onPreview?: (documentId: string, fileName: string) => void;
  downloadProgress?: Record<string, number>;
}

export function DocumentList({
  documents,
  onDownload,
  onPreview,
  downloadProgress = {},
}: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="bg-muted/20 border-border rounded-2xl border-2 border-dashed py-12 text-center">
        <div className="bg-card border-border mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border shadow-sm">
          <FileIcon className="text-muted-foreground/30 h-7 w-7" />
        </div>
        <p className="text-muted-foreground text-sm font-semibold">
          No documents attached to this application.
        </p>
        <p className="text-muted-foreground/70 mt-1 text-xs">
          Files will appear here once uploaded.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-6 ${
        documents.length === 1
          ? 'grid-cols-1'
          : documents.length === 2
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3'
      }`}
    >
      {documents.map((doc) => {
        const progress = downloadProgress[doc.id];
        const isDownloading = progress !== undefined;

        return (
          <div
            key={doc.id}
            className="group border-border bg-card hover:border-primary/50 relative flex h-48 w-full cursor-pointer flex-col overflow-hidden rounded-2xl border shadow-sm transition-all duration-500 hover:shadow-2xl"
            onClick={() => onPreview && onPreview(doc.id, doc.fileName)}
          >
            {/* Background Glow Effect on Hover */}
            <div className="from-primary/5 absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Top Section: Icon & Version */}
            <div className="bg-muted/30 relative flex flex-1 items-center justify-center transition-colors duration-500 group-hover:bg-transparent">
              <div className="relative transform transition-transform duration-500 group-hover:scale-110">
                <div className="bg-card border-border group-hover:border-primary/20 rounded-2xl border p-5 shadow-sm transition-all group-hover:shadow-md">
                  <FileIcon className="text-muted-foreground group-hover:text-primary h-11 w-11 transition-colors" />
                </div>
                <div className="bg-primary text-primary-foreground absolute -right-2 -bottom-2 rotate-3 transform rounded-lg px-2 py-0.5 text-[10px] font-bold shadow-sm">
                  {doc.fileName.split('.').pop()?.toUpperCase()}
                </div>
              </div>

              {doc.version > 1 && (
                <div className="absolute top-3 left-3 rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                  V{doc.version}
                </div>
              )}

              {/* Hover Overlay Actions */}
              <div
                className={`bg-foreground/60 absolute inset-0 flex flex-col items-center justify-center gap-3 backdrop-blur-[2px] transition-all duration-300 ${isDownloading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                {isDownloading ? (
                  <div className="flex w-3/4 flex-col items-center gap-2">
                    <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white">
                      {progress}%
                    </span>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <Button
                      variant="default"
                      size="sm"
                      className="h-10 translate-y-3 rounded-full px-5 text-xs font-bold shadow-2xl transition-all duration-300 group-hover:translate-y-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownload?.(doc.id, doc.fileName);
                      }}
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Info */}
            <div className="bg-card border-border group-hover:bg-muted/30 relative border-t p-4 transition-colors duration-500">
              <p
                className="text-foreground group-hover:text-primary truncate text-sm font-bold transition-colors"
                title={doc.fileName}
              >
                {doc.fileName}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-muted-foreground/70 text-[11px] font-bold">
                  {Math.round(doc.fileSize / 1024).toLocaleString()} KB
                </p>
                <div className="bg-border h-1 w-1 rounded-full" />
                <p className="text-muted-foreground/70 text-[11px] font-bold">
                  {new Date(doc.uploadedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
