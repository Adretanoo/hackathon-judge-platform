import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@/shared/ui';
import { ArrowLeft, Download, Award, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { authClient } from '@/shared/api/auth-client';
import { toast } from 'sonner';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathon: Hackathon;
}

export function ExportModal({ isOpen, onClose, hackathon }: ExportModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const baseURL = authClient.defaults.baseURL || '';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${baseURL}/hackathons/${hackathon.id}/export/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Export failed: ${response.status} — ${errText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${hackathon.title.replace(/\s+/g, '_')}_report.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF звіт успішно завантажено!');
    } catch (err: any) {
      toast.error(err.message || 'Помилка завантаження. Спробуйте ще раз.');
    } finally {
      setIsDownloading(false);
    }
  };

  const isCompleted = hackathon.status === 'COMPLETED' || hackathon.status === 'JUDGING';

  const features = [
    'Таблиця лідерів з нормалізованими Z-score оцінками',
    'Детальні бали по кожному критерію',
    'Сертифікати для топ-3 команд',
    'Брендування західу та дата генерації',
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Експорт результатів
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Назад
          </Button>
        </DialogHeader>

        <div className="px-6 py-8 space-y-6">
          {!isCompleted && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-700 dark:text-amber-400">захід ще триває</p>
                <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                  Ви можете завантажити звіт зараз, але фінальні дані будуть повними тільки після завершення судійства.
                </p>
              </div>
            </div>
          )}

          {/* PDF Card */}
          <div className="border-2 border-primary/20 rounded-2xl p-6 flex flex-col gap-5 hover:border-primary/50 transition-all duration-200 bg-primary/[0.02]">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg">Повний PDF-звіт</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Автоматично згенерований багатосторінковий документ з усіма результатами західу та сертифікатами переможців.
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="w-full gap-2 font-bold h-12 rounded-xl text-base"
            >
              {isDownloading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Генерація PDF...</>
              ) : (
                <><Download className="h-4 w-4" /> Завантажити PDF</>
              )}
            </Button>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10">
          <Button type="button" variant="outline" onClick={onClose} className="w-full">
            Закрити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
