"use client";

import { FileText, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
}

export function FileDropzone({ files, onFilesChange }: FileDropzoneProps) {
  function handleAddFiles(fileList: FileList | null) {
    if (!fileList) {
      return;
    }

    const nextFiles = Array.from(fileList).filter((file) => file.type === "application/pdf");
    onFilesChange([...files, ...nextFiles].slice(0, 5));
  }

  return (
    <div
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        handleAddFiles(event.dataTransfer.files);
      }}
      className={cn(
        "surface-soft relative overflow-hidden border-dashed p-5 transition",
        files.length > 0 ? "border-accent/40" : "hover:border-accent/40"
      )}
    >
      <input
        id="pdf-upload"
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(event) => handleAddFiles(event.target.files)}
      />

      <label htmlFor="pdf-upload" className="flex cursor-pointer items-start gap-4">
        <div className="rounded-2xl bg-accentSoft p-3 text-accent">
          <UploadCloud className="h-5 w-5" />
        </div>
        <div className="space-y-2">
          <p className="font-semibold">Drop PDFs here or click to browse</p>
          <p className="text-sm text-muted">Upload up to 5 files. Each PDF can be up to 12 MB.</p>
        </div>
      </label>

      {files.length > 0 ? (
        <div className="mt-4 space-y-2">
          {files.map((file) => (
            <div
              key={`${file.name}-${file.size}`}
              className="flex items-center justify-between rounded-2xl border border-stroke bg-bg/40 px-3 py-2 text-sm"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-accent" />
                <span className="max-w-[220px] truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  onFilesChange(files.filter((candidate) => candidate.name !== file.name || candidate.size !== file.size))
                }
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-muted transition hover:text-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
