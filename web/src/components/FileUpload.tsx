import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  onClear: () => void;
  isUploading: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  selectedFile,
  onClear,
  isUploading,
  className,
}: FileUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  if (selectedFile) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg',
          className
        )}
      >
        <FileText className="w-8 h-8 text-green-600" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-green-900 truncate">{selectedFile.name}</p>
          <p className="text-sm text-green-600">
            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        {!isUploading && (
          <button
            onClick={onClear}
            className="p-1 hover:bg-green-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-green-600" />
          </button>
        )}
        {isUploading && (
          <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
        isDragActive
          ? 'border-spark-purple bg-spark-purple/5'
          : 'border-gray-300 hover:border-spark-purple hover:bg-gray-50',
        isUploading && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      <input {...getInputProps()} />
      <Upload
        className={cn(
          'w-12 h-12 mx-auto mb-4',
          isDragActive ? 'text-spark-purple' : 'text-gray-400'
        )}
      />
      <p className="text-lg font-medium text-gray-900 mb-1">
        {isDragActive ? 'Drop your PDF here' : 'Upload a PDF document'}
      </p>
      <p className="text-sm text-gray-500">
        Drag and drop or click to select a file
      </p>
    </div>
  );
}
