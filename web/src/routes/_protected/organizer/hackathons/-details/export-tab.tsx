import { useState } from 'react';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { authClient } from '@/shared/api/auth-client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
} from '@/shared/ui';
import {
  Download,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Trophy,
  Users,
  BarChart3,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportTabProps {
  hackathon: Hackathon;
}

export function ExportTab({ hackathon }: ExportTabProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      const baseURL = authClient.defaults.baseURL || '';
      const token = localStorage.getItem('accessToken');

      const response = await fetch(
        `${baseURL}/hackathons/${hackathon.id}/export/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      toast.success('PDF звіт завантажено!');
    } catch (err: any) {
      toast.error(err.message || 'Помилка завантаження PDF. Спробуйте ще раз.');
    } finally {
      setIsDownloading(false);
    }
  };

  const isCompleted = hackathon.status === 'COMPLETED' || hackathon.status === 'JUDGING';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Download className="h-6 w-6 text-primary" />
          Звіти та Сертифікати
        </h2>
        <p className="text-sm text-muted-foreground">
          Завантажте повний PDF-звіт з результатами хакатону, статистикою та сертифікатами переможців.
        </p>
      </div>

      {/* Warning for incomplete hackathons */}
      {!isCompleted && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-700 dark:text-amber-400">Хакатон ще не завершено</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
              Звіт можна завантажити у будь-який момент, але фінальні дані будуть повними тільки після завершення судійства і статусу <strong>COMPLETED</strong> або <strong>JUDGING</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main PDF Export Card */}
      <Card className="border-primary/20 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-primary via-primary/80 to-primary/40" />
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Icon & badge */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Award className="h-10 w-10 text-primary" />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h3 className="font-black text-xl">Повний PDF-звіт хакатону</h3>
                <Badge className="bg-primary/10 text-primary border-primary/20 font-bold text-xs uppercase tracking-wider">
                  PDF
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                Автоматично згенерований багатосторінковий PDF зі всією статистикою: загальна таблиця лідерів, 
                деталізовані оцінки по кожному критерію, та персональні сертифікати для топ-3 команд.
              </p>
              <ul className="grid grid-cols-2 gap-2 pt-1">
                {[
                  'Повна таблиця рейтингу',
                  'Нормалізовані Z-score оцінки',
                  'Сертифікати для топ-3 команд',
                  'Брендування хакатону',
                  'Деталізація по треках',
                  'Підпис організатора',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Download button */}
            <div className="flex-shrink-0">
              <Button
                size="lg"
                className="gap-2.5 rounded-2xl h-14 px-8 font-bold text-base shadow-md"
                onClick={handleDownloadPdf}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Генерація...
                  </>
                ) : (
                  <>
                    <Download className="h-5 w-5" />
                    Завантажити PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Що буде в звіті
          </CardTitle>
          <CardDescription>Попередній перегляд даних, які будуть включені в PDF-документ.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreviewStat icon={<Trophy className="h-4 w-4 text-amber-500" />} label="Треки" value={hackathon.tracks?.length ?? 0} />
            <PreviewStat icon={<Users className="h-4 w-4 text-blue-500" />} label="Стадії" value={hackathon.stages?.length ?? 0} />
            <PreviewStat icon={<FileText className="h-4 w-4 text-sky-500" />} label="Статус" value={hackathon.status.replace(/_/g, ' ')} />
            <PreviewStat
              icon={<Star className="h-4 w-4 text-emerald-500" />}
              label="Сертифікати"
              value={isCompleted ? 'Топ-3' : 'Очікування'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="p-5 rounded-2xl bg-muted/40 border text-xs text-muted-foreground space-y-2">
        <p className="font-bold text-foreground text-sm">📌 Інформація про експорт</p>
        <p>• PDF генерується в реальному часі з актуальних даних оцінювання.</p>
        <p>• Сторінка 1: Зведена таблиця лідерів з нормалізованими Z-score оцінками.</p>
        <p>• Сторінки 2–4: Сертифікати досягнень для топ-3 команд (якщо є оцінки).</p>
        <p>• Великі звіти можуть кілька секунд генеруватися — зачекайте початку завантаження.</p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PreviewStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
      {icon}
      <div>
        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{label}</p>
        <p className="text-sm font-bold capitalize">{value}</p>
      </div>
    </div>
  );
}
