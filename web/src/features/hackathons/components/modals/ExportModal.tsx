import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
} from '@/shared/ui';
import { ArrowLeft, Download, FileSpreadsheet, Award, Loader2, AlertCircle } from 'lucide-react';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { authClient } from '@/shared/api/auth-client';
import { toast } from 'sonner';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathon: Hackathon;
}

export function ExportModal({ isOpen, onClose, hackathon }: ExportModalProps) {
  const [downloadingType, setDownloadingType] = useState<string | null>(null);

  const handleDownload = async (type: 'csv' | 'pdf') => {
    if (downloadingType) return;
    setDownloadingType(type);

    try {
      const baseURL = authClient.defaults.baseURL || '';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${baseURL}/hackathons/${hackathon.id}/export/${type}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error(`Export failed: ${response.statusText}`);

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${hackathon.title.replace(/\s+/g, '_')}_${type === 'csv' ? 'scores' : 'certificates'}.${type === 'csv' ? 'csv' : 'zip'}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} експорт завантажено!`);
    } catch (err: any) {
      toast.error(err.message || 'Експорт не вдався. Спробуйте ще раз.');
    } finally {
      setDownloadingType(null);
    }
  };

  const isCompleted = hackathon.status === 'COMPLETED' || hackathon.status === 'JUDGING';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Експорт фінальних результатів
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <div className="px-6 py-8 space-y-8">
          {!isCompleted && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-sm text-amber-700">Хакатон ще триває</p>
                <p className="text-xs text-amber-600/80">
                  Ви можете завантажити звіти зараз, але оцінки та фінальні рейтинги можуть бути неповними. Рекомендується дочекатися завершення хакатону.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border rounded-2xl p-6 flex flex-col gap-4 hover:border-emerald-300 transition-colors">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Детальний розрахунок (CSV)</h3>
                <p className="text-sm text-muted-foreground">Включає нормалізовані оцінки, сирі бали по критеріях, та Z-Score рейтинги команд.</p>
              </div>
              <Button 
                onClick={() => handleDownload('csv')} 
                disabled={downloadingType === 'csv'}
                className="mt-auto w-full gap-2 font-bold"
              >
                {downloadingType === 'csv' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Завантажити CSV звіти
              </Button>
            </div>

            <div className="border rounded-2xl p-6 flex flex-col gap-4 hover:border-primary/50 transition-colors">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Award className="h-7 w-7 text-primary" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg">Сертифікати PDF</h3>
                <p className="text-sm text-muted-foreground">Автоматично згенеровані PDF сертифікати переможців для топ-3 команд кожного треку (ZIP архів).</p>
              </div>
              <Button 
                onClick={() => handleDownload('pdf')} 
                disabled={downloadingType === 'pdf'}
                className="mt-auto w-full gap-2 font-bold"
              >
                {downloadingType === 'pdf' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Завантажити сертифікати
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10 flex-row justify-between w-full sm:justify-between">
          <Button type="button" variant="secondary" onClick={onClose}>
            Закрити (Скасувати)
          </Button>
          <div /> {/* Placeholder for right side to maintain flex space-between */}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
