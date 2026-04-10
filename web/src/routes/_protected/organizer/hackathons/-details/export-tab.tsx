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
  FileSpreadsheet,
  Award,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  Trophy,
  Users,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExportTabProps {
  hackathon: Hackathon;
}

export function ExportTab({ hackathon }: ExportTabProps) {
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
      toast.success(`${type.toUpperCase()} export downloaded!`);
    } catch (err: any) {
      toast.error(err.message || 'Export failed. Please try again.');
    } finally {
      setDownloadingType(null);
    }
  };

  const isCompleted = hackathon.status === 'COMPLETED' || hackathon.status === 'JUDGING';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-3">
          <Download className="h-6 w-6 text-primary" />
          Export & Reports
        </h2>
        <p className="text-sm text-muted-foreground">
          Download results, certificates, and analytics for this hackathon.
        </p>
      </div>

      {/* Warning for incomplete hackathons */}
      {!isCompleted && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold text-sm text-amber-700 dark:text-amber-400">Hackathon in progress</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
              Exports are available at any time, but final data is only complete once judging finishes and status is <strong>COMPLETED</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Scores */}
        <ExportCard
          icon={<FileSpreadsheet className="h-8 w-8 text-emerald-600" />}
          title="Normalized Score Report"
          description="Full CSV with raw scores, Z-score normalized results, judge averages, and final rankings for every project across all tracks."
          format="CSV"
          formatColor="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-700/40"
          features={[
            'Per-project raw & normalized scores',
            'Per-judge average breakdown',
            'Z-score bias correction',
            'Track & team metadata',
          ]}
          loading={downloadingType === 'csv'}
          onClick={() => handleDownload('csv')}
        />

        {/* PDF Certificates */}
        <ExportCard
          icon={<Award className="h-8 w-8 text-primary" />}
          title="Winner Certificates (PDF)"
          description="Auto-generates and packages professional PDF certificates for top-performing teams. Includes custom hackathon branding and winner rank."
          format="PDF / ZIP"
          formatColor="bg-primary/10 text-primary border-primary/20"
          features={[
            'Auto-generated for top 3 teams',
            'Custom hackathon branding',
            'Digital-signature ready',
            'Packaged as .zip archive',
          ]}
          loading={downloadingType === 'pdf'}
          onClick={() => handleDownload('pdf')}
        />
      </div>

      {/* Analytics Overview section */}
      <Card className="border-primary/5 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-primary" />
            Export Preview
          </CardTitle>
          <CardDescription>Summary of data that will be included in the exports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PreviewStat icon={<Trophy className="h-4 w-4 text-amber-500" />} label="Tracks" value={hackathon.tracks?.length ?? 0} />
            <PreviewStat icon={<Users className="h-4 w-4 text-blue-500" />} label="Stages" value={hackathon.stages?.length ?? 0} />
            <PreviewStat icon={<FileText className="h-4 w-4 text-purple-500" />} label="Status" value={hackathon.status.replace('_', ' ')} />
            <PreviewStat
              icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
              label="Ready"
              value={isCompleted ? 'Yes' : 'Partial'}
            />
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <div className="p-4 rounded-2xl bg-muted/40 border text-xs text-muted-foreground space-y-1.5">
        <p className="font-bold text-foreground text-sm">📌 Export Notes</p>
        <p>• All exports are generated in real-time from the latest scoring data.</p>
        <p>• CSV exports include bias-corrected Z-score per project.</p>
        <p>• PDF certificates are generated for the top 3 projects by normalized score.</p>
        <p>• Large exports may take a few seconds to prepare — please wait for the download to begin.</p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ExportCard({
  icon, title, description, format, formatColor, features, loading, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  format: string;
  formatColor: string;
  features: string[];
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Card className="border-primary/5 shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col">
      <CardContent className="p-6 flex flex-col gap-5 flex-1">
        <div className="flex items-start justify-between">
          <div className="p-3 rounded-2xl bg-muted/50 group-hover:bg-muted transition-colors">
            {icon}
          </div>
          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider border ${formatColor}`}>
            {format}
          </Badge>
        </div>

        <div className="space-y-2 flex-1">
          <h3 className="font-black text-lg leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <ul className="space-y-1.5">
          {features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <Button
          className="w-full gap-2 rounded-xl h-11 font-bold mt-auto"
          onClick={onClick}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download {format.split(' / ')[0]}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

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
