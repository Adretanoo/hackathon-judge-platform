/**
 * @file web/src/shared/ui/file-upload.tsx
 * @description General purpose file upload component integrating with our Cloudinary backend.
 */

import { useState, useCallback, useRef } from 'react';
import { UploadCloud, File as FileIcon, X, Loader2 } from 'lucide-react';
import { Button } from './button';
import { cn } from '../lib/utils';
import { toast } from 'sonner';
import { authClient } from '../api/auth-client';

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
}

export function FileUpload({
  value,
  onChange,
  accept = 'image/*',
  maxSizeMB = 5,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const uploadFile = async (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Файл завеликий! Максимум ${maxSizeMB}MB.`);
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await authClient.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      onChange(data.data.url);
      toast.success('Завантажено успішно!');
    } catch (err) {
      console.error(err);
      toast.error('Помилка завантаження файлу');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  if (value) {
    return (
      <div className={cn('relative group rounded-xl border bg-muted/20 overflow-hidden', className)}>
        {accept.includes('image') ? (
          <img src={value} alt="Uploaded" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <FileIcon className="h-8 w-8 text-primary mb-2" />
            <span className="text-xs truncate max-w-[200px]">{value}</span>
          </div>
        )}
        
        {/* Overlay with delete button */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onChange('')}
            className="rounded-xl gap-2 font-bold shadow-lg"
          >
            <X className="h-4 w-4" /> Видалити
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all cursor-pointer',
        isDragging ? 'border-primary bg-primary/5 shadow-inner' : 'border-border hover:border-primary/50 hover:bg-muted/10',
        isUploading && 'opacity-50 pointer-events-none content-none',
        className
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleSelect}
      />
      
      {isUploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Завантаження...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="p-3 bg-muted rounded-full">
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              Натисніть або перетягніть файл
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Підтримується: {accept} до {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
