import { Label } from '@/components/ui/label';
import { Upload, FileText } from 'lucide-react';
import React from 'react';
import { Document } from '@/types';

interface DocumentUploadProps {
  files: File[];
  existingDocs: Document[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  removeFile: (index: number) => void;
  removeExistingDoc: (docId: string) => void;
}

export function DocumentUpload({
  files,
  existingDocs,
  handleFileChange,
  handleDrop,
  removeFile,
  removeExistingDoc,
}: DocumentUploadProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Label className="text-foreground/90">Documents</Label>
      <div
        className={`flex-1 flex flex-col border-2 border-dashed border-border rounded-xl p-5 hover:bg-muted/30 transition-colors cursor-pointer ${
          files.length === 0 && existingDocs.length === 0 ? 'items-center justify-center text-center' : ''
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        {files.length === 0 && existingDocs.length === 0 ? (
          <>
            <Upload className="h-6 w-6 text-primary mb-2" />
            <p className="mt-1 text-sm font-medium text-foreground/90">
              Drag and drop files here, or click to select
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Max file size: 5MB per document
            </p>
          </>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-semibold text-foreground/90">Selected Files</span>
            </div>
            <div 
              className="w-full flex flex-wrap gap-3 cursor-default" 
              onClick={(e) => e.stopPropagation()}
            >
              {/* Existing Documents */}
              {existingDocs.map((doc) => (
                <div key={doc.id} className="relative group flex flex-col items-center justify-center w-28 h-28 border border-primary/20 rounded-xl bg-primary/5 shadow-sm overflow-hidden hover:border-primary transition-all">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExistingDoc(doc.id);
                    }}
                    className="absolute top-1 right-1 bg-card shadow-sm border text-destructive hover:bg-destructive/10 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  <div className="flex-1 flex items-center justify-center w-full bg-primary/10">
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <div className="w-full px-2 py-1.5 bg-card border-t border-border text-center">
                    <p className="text-[11px] font-medium text-foreground/90 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </p>
                  </div>
                </div>
              ))}

              {/* New Files */}
              {files.map((file, index) => (
                <div key={`new-${index}`} className="relative group flex flex-col items-center justify-center w-28 h-28 border border-border rounded-xl bg-card shadow-sm overflow-hidden hover:border-primary transition-all">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="absolute top-1 right-1 bg-card shadow-sm border text-destructive hover:bg-destructive/10 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                  <div className="flex-1 flex items-center justify-center w-full bg-muted/30 group-hover:bg-primary/5 transition-colors">
                    <svg className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                  </div>
                  <div className="w-full px-2 py-1.5 bg-card border-t border-border text-center">
                    <p className="text-[11px] font-medium text-foreground/90 truncate" title={file.name}>
                      {file.name}
                    </p>
                  </div>
                </div>
              ))}
              <div 
                className="flex flex-col items-center justify-center w-28 h-28 border-2 border-dashed border-border rounded-xl bg-muted/30 hover:bg-muted/50 hover:border-primary cursor-pointer transition-colors"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[11px] font-medium text-muted-foreground">Add More</span>
              </div>
            </div>
          </div>
        )}
        <input id="fileInput" type="file" multiple className="hidden" onChange={handleFileChange} />
      </div>
    </div>
  );
}
