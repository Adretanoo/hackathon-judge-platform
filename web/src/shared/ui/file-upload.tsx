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
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error?.message || 'Помилка завантаження файлу';
      toast.error(msg);
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
    const isImage = /\.(jpg|jpeg|png|webp|avif|gif|svg)$/i.test(value) || accept.includes('image');
    const isVideo = /\.(mp4|webm|ogg)$/i.test(value) || accept.includes('video');
    const isPDF = /\.pdf$/i.test(value) || value.includes('pdf');

    return (
      <div className={cn('relative group rounded-xl border bg-muted/20 overflow-hidden min-h-[140px]', className)}>
        {isImage ? (
          <img src={value} alt="Uploaded" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
        ) : isVideo ? (
          <video src={value} className="w-full h-full object-cover" controls />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-primary/5 to-primary/10">
            {isPDF ? (
              <div className="p-4 bg-white rounded-2xl shadow-sm mb-3">
                <FileIcon className="h-10 w-10 text-red-500" />
              </div>
            ) : (
              <div className="p-4 bg-white rounded-2xl shadow-sm mb-3">
                <FileIcon className="h-10 w-10 text-primary" />
              </div>
            )}
            <span className="text-xs font-bold text-center break-all px-4 bg-white/50 backdrop-blur-md rounded-lg py-1 border border-white/20">
              {value.split('/').pop()}
            </span>
          </div>
        )}
        
        {/* Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px] z-10">
          <div className="flex gap-2 scale-90 group-hover:scale-100 transition-transform">
            <Button
              variant="secondary"
              size="sm"
              asChild
              className="rounded-xl font-bold bg-white/90"
            >
              <a href={value} target="_blank" rel="noopener noreferrer">Переглянути</a>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onChange('')}
              className="rounded-xl font-bold"
            >
              <X className="h-4 w-4" /> Видалити
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all cursor-pointer group',
        isDragging ? 'border-primary bg-primary/5 shadow-inner scale-[0.99]' : 'border-border hover:border-primary/50 hover:bg-muted/10',
        isUploading && 'opacity-60 pointer-events-none cursor-wait',
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
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 scale-150" />
          </div>
          <p className="text-sm font-black text-primary/80 tracking-tight animate-pulse uppercase">Завантажуємо...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 text-center transition-transform group-hover:scale-105 duration-300">
          <div className="p-4 bg-muted/50 rounded-2xl group-hover:bg-primary/10 transition-colors">
            <UploadCloud className="h-7 w-7 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="text-sm font-black text-foreground">
              Оберіть або перетягніть файл
            </p>
            <p className="text-[10px] font-bold text-muted-foreground mt-1.5 uppercase tracking-widest bg-muted rounded-full px-3 py-0.5">
              {accept.replace(/\*/g, '').split(',').join(' / ')} • до {maxSizeMB}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
