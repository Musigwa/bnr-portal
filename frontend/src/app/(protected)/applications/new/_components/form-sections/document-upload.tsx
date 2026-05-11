'use client';

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
  maxFileSizeMb: number;
}

export function DocumentUpload({
  files,
  existingDocs,
  handleFileChange,
  handleDrop,
  removeFile,
  removeExistingDoc,
  maxFileSizeMb,
}: DocumentUploadProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Label className="text-foreground/90">Documents</Label>
      <div
        className={`border-border hover:bg-muted/30 flex flex-1 cursor-pointer flex-col rounded-xl border-2 border-dashed p-5 transition-colors ${
          files.length === 0 && existingDocs.length === 0
            ? 'items-center justify-center text-center'
            : ''
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => document.getElementById('fileInput')?.click()}
      >
        {files.length === 0 && existingDocs.length === 0 ? (
          <>
            <Upload className="text-primary mb-2 h-6 w-6" />
            <p className="text-foreground/90 mt-1 text-sm font-medium">
              Drag and drop files here, or click to select
            </p>
            <p className="text-muted-foreground mt-1 text-sm">
              Max file size: {maxFileSizeMb}MB per document
            </p>
          </>
        ) : (
          <div className="w-full">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-foreground/90 text-sm font-semibold">
                Selected Files
              </span>
            </div>
            <div
              className="flex w-full cursor-default flex-wrap gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Existing Documents */}
              {existingDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group border-primary/20 bg-primary/5 hover:border-primary relative flex h-28 w-28 flex-col items-center justify-center overflow-hidden rounded-xl border shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeExistingDoc(doc.id);
                    }}
                    className="bg-card text-destructive hover:bg-destructive/10 absolute top-1 right-1 z-10 rounded-full border p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                  <div className="bg-primary/10 flex w-full flex-1 items-center justify-center">
                    <FileText className="text-primary h-8 w-8" />
                  </div>
                  <div className="bg-card border-border w-full border-t px-2 py-1.5 text-center">
                    <p
                      className="text-foreground/90 truncate text-[11px] font-medium"
                      title={doc.fileName}
                    >
                      {doc.fileName}
                    </p>
                  </div>
                </div>
              ))}

              {/* New Files */}
              {files.map((file, index) => (
                <div
                  key={`new-${index}`}
                  className="group border-border bg-card hover:border-primary relative flex h-28 w-28 flex-col items-center justify-center overflow-hidden rounded-xl border shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="bg-card text-destructive hover:bg-destructive/10 absolute top-1 right-1 z-10 rounded-full border p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                  </button>
                  <div className="bg-muted/30 group-hover:bg-primary/5 flex w-full flex-1 items-center justify-center transition-colors">
                    <svg
                      className="text-muted-foreground group-hover:text-primary h-8 w-8 transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.5"
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <div className="bg-card border-border w-full border-t px-2 py-1.5 text-center">
                    <p
                      className="text-foreground/90 truncate text-[11px] font-medium"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                  </div>
                </div>
              ))}
              <div
                className="border-border bg-muted/30 hover:bg-muted/50 hover:border-primary flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <Upload className="text-muted-foreground mb-1 h-5 w-5" />
                <span className="text-muted-foreground text-[11px] font-medium">
                  Add More
                </span>
              </div>
            </div>
          </div>
        )}
        <input
          id="fileInput"
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
