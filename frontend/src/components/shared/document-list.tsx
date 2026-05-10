import { Document } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentListProps {
  documents: Document[];
  onDownload?: (documentId: string, fileName: string) => void;
}

export function DocumentList({ documents, onDownload }: DocumentListProps) {
  if (!documents || documents.length === 0) {
    return (
      <Card className="shadow-sm border-slate-200/60">
        <CardHeader className="bg-slate-50/30 border-b pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-slate-400" />
            Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
            <FileIcon className="w-6 h-6 text-slate-300" />
          </div>
          <p className="text-sm font-medium text-slate-500">No documents attached to this application.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-slate-200/60 overflow-hidden">
      <CardHeader className="bg-slate-50/30 border-b pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileIcon className="h-5 w-5 text-slate-400" />
            Documents
          </CardTitle>
          <span className="text-xs font-medium px-3 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200 shadow-sm">
            {documents.length} {documents.length === 1 ? 'file' : 'files'} attached
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className={`grid gap-5 ${
          documents.length === 1 ? 'grid-cols-1' : 
          documents.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 
          'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {documents.map((doc) => (
            <div 
              key={doc.id} 
              className="group relative flex flex-col w-full h-44 border border-slate-200 rounded-2xl bg-white shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-500 overflow-hidden"
            >
              {/* Background Glow Effect on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Top Section: Icon & Version */}
              <div className="relative flex-1 flex items-center justify-center bg-slate-50/50 group-hover:bg-transparent transition-colors duration-500">
                <div className="relative transform group-hover:scale-110 transition-transform duration-500">
                  <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group-hover:border-primary/20 group-hover:shadow-md transition-all">
                    <FileIcon className="w-10 h-10 text-slate-400 group-hover:text-primary transition-colors" />
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
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="rounded-full px-6 h-10 text-xs font-bold shadow-2xl translate-y-2 group-hover:translate-y-0 transition-all duration-300"
                    onClick={() => onDownload && onDownload(doc.id, doc.fileName)}
                  >
                    <Download className="h-4 w-4 mr-2" /> Download File
                  </Button>
                </div>
              </div>
              
              {/* Bottom Section: Info */}
              <div className="relative p-4 bg-white border-t border-slate-100 group-hover:bg-slate-50/50 transition-colors duration-500">
                <p className="text-sm font-bold text-slate-800 truncate group-hover:text-primary transition-colors" title={doc.fileName}>
                  {doc.fileName}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-[11px] font-medium text-slate-400">
                    {Math.round(doc.fileSize / 1024).toLocaleString()} KB
                  </p>
                  <div className="h-1 w-1 rounded-full bg-slate-300" />
                  <p className="text-[11px] font-medium text-slate-400">
                    {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
