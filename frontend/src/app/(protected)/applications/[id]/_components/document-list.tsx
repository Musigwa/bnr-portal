import { Document } from '@/types';
import { Download, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentListProps {
  documents: Document[];
  onDownload?: (documentId: string, fileName: string) => void;
}

export function DocumentList({ documents, onDownload }: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <div className="py-12 text-center bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
        <div className="mx-auto w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 border border-slate-100">
          <FileIcon className="w-7 h-7 text-slate-300" />
        </div>
        <p className="text-sm font-semibold text-slate-500">No documents attached to this application.</p>
        <p className="text-xs text-slate-400 mt-1">Files will appear here once uploaded.</p>
      </div>
    );
  }

  return (
    <div className={`grid gap-6 ${
      documents.length === 1 ? 'grid-cols-1' : 
      documents.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
    }`}>
      {documents.map((doc) => (
        <div 
          key={doc.id} 
          className="group relative flex flex-col w-full h-48 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-2xl hover:border-primary/50 transition-all duration-500 overflow-hidden"
        >
          {/* Background Glow Effect on Hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Top Section: Icon & Version */}
          <div className="relative flex-1 flex items-center justify-center bg-slate-50/30 group-hover:bg-transparent transition-colors duration-500">
            <div className="relative transform group-hover:scale-110 transition-transform duration-500">
              <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:border-primary/20 group-hover:shadow-md transition-all">
                <FileIcon className="w-11 h-11 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-sm transform rotate-3">
                {doc.fileName.split('.').pop()?.toUpperCase()}
              </div>
            </div>

            {doc.version > 1 && (
              <div className="absolute top-3 left-3 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                V{doc.version}
              </div>
            )}
            
            {/* Hover Overlay Actions */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full px-7 h-10 text-xs font-bold shadow-2xl translate-y-3 group-hover:translate-y-0 transition-all duration-300"
                onClick={() => onDownload && onDownload(doc.id, doc.fileName)}
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>
          
          {/* Bottom Section: Info */}
          <div className="relative p-4 bg-white border-t border-slate-100 group-hover:bg-slate-50/50 transition-colors duration-500">
            <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors" title={doc.fileName}>
              {doc.fileName}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[11px] font-bold text-slate-400">
                {Math.round(doc.fileSize / 1024).toLocaleString()} KB
              </p>
              <div className="h-1 w-1 rounded-full bg-slate-300" />
              <p className="text-[11px] font-bold text-slate-400">
                {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
