"use client";

import { useId, useRef, useState, type DragEvent } from "react";
import { FileText, Upload, X } from "lucide-react";

import { useApp } from "@/lib/providers";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;

interface Props {
  file: File | null;
  onChange: (file: File | null) => void;
  describedBy?: string;
  label: string;
  dropText: string;
}

/** PDF picker with drag-and-drop. Validates type and size before accepting a file. */
export function FileDrop({ file, onChange, describedBy, label, dropText }: Props) {
  const { m } = useApp();
  const inputId = useId();
  const errorId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(next: File | undefined) {
    if (!next) return;
    if (next.type !== "application/pdf" && !next.name.toLowerCase().endsWith(".pdf")) {
      setError(m.cv.notPdf);
      return;
    }
    if (next.size > MAX_BYTES) {
      setError(m.cv.tooBig);
      return;
    }
    setError(null);
    onChange(next);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onChange(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          aria-label={`${m.cv.remove}: ${file.name}`}
          className="grid size-11 cursor-pointer place-items-center rounded-lg text-muted transition-colors duration-200 hover:bg-surface hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors duration-200",
          dragging ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50 hover:bg-surface-2",
          error && "border-danger",
        )}
      >
        <Upload className="size-6 text-muted" aria-hidden="true" />
        <span className="text-sm text-muted">
          {dropText} <span className="font-semibold text-primary underline underline-offset-2">{m.cv.browse}</span>
        </span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label={label}
        aria-describedby={cn(describedBy, error && errorId) || undefined}
        aria-invalid={error ? true : undefined}
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
