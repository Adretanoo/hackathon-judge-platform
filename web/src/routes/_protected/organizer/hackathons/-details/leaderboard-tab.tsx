import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { cn } from '@/shared/lib/utils';
import { 
  Card, 
  CardContent, 
  Button,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui';
import { 
  Trophy, 
  FileText, 
  Table as TableIcon, 
  Medal,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface LeaderboardTabProps {
  hackathon: Hackathon;
}

export function LeaderboardTab({ hackathon }: LeaderboardTabProps) {
  const [trackId, setTrackId] = useState<string>('all');

  const { data: leaderboard, isLoading, refetch } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'leaderboard', trackId],
    queryFn: () => hackathonApi.getLeaderboard(hackathon.id, trackId === 'all' ? undefined : trackId),
    refetchInterval: 30000, // Refetch every 30s
  });



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Leaderboard Preview</h2>
          <p className="text-sm text-muted-foreground">Real-time standings based on normalized (Z-score) evaluations.</p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={trackId} onValueChange={setTrackId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Tracks" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Global Standings</SelectItem>
              {hackathon.tracks?.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="p-2 bg-emerald-500 rounded-lg text-white">
                  <Medal className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold text-emerald-600">Top Team</p>
                  <p className="text-sm font-bold truncate max-w-[120px]">
                     {leaderboard?.entries?.[0]?.teamName || 'N/A'}
                  </p>
               </div>
            </CardContent>
         </Card>
         <Card className="bg-primary/5 border-primary/10 shadow-none">
            <CardContent className="p-4 flex items-center gap-4">
               <div className="p-2 bg-primary rounded-lg text-white">
                  <TrendingUp className="h-5 w-5" />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold text-primary">Avg. Raw Score</p>
                  <p className="text-sm font-bold">
                     {leaderboard?.entries?.length ? (leaderboard.entries.reduce((acc: any, curr: any) => acc + curr.averageRawScore, 0) / leaderboard.entries.length).toFixed(1) : '0.0'}
                  </p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card className="border-primary/5 shadow-xl">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="h-48 flex items-center justify-center italic text-muted-foreground">
              Calculating rankings...
            </div>
          ) : !leaderboard?.entries?.length ? (
            <div className="h-48 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Trophy className="h-10 w-10 opacity-10" />
              <p>No projects evaluated yet.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16 text-center">Rank</TableHead>
                  <TableHead>Project & Team</TableHead>
                  <TableHead>Track</TableHead>
                  <TableHead className="text-center">Normalized Score</TableHead>
                  <TableHead className="text-center">Raw Avg</TableHead>
                  <TableHead className="text-center">Judges</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.entries.map((row: any, i: number) => (
                  <TableRow key={row.projectTitle} className={i < 3 ? "bg-primary/5 font-medium" : ""}>
                    <TableCell className="text-center font-bold">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-bold">{row.projectTitle}</div>
                      <div className="text-[10px] text-muted-foreground">{row.teamName}</div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline" className="text-[10px]">{row.track}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-primary font-extrabold">{row.normalizedScore.toFixed(2)}</span>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{row.averageRawScore.toFixed(1)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                         <span className="text-xs font-bold">{row.judgeCount}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4">
        <TrendingUp className="h-5 w-5 text-blue-500 mt-1 shrink-0" />
        <div className="space-y-1">
           <h4 className="text-sm font-bold text-blue-700 dark:text-blue-400">About Z-Score Normalization</h4>
           <p className="text-xs text-muted-foreground leading-relaxed">
             This leaderboard uses Z-score normalization to account for "hard" and "easy" judges. 
             The normalized score reflects how many standard deviations a project is above or below the mean score given by its particular set of judges.
           </p>
        </div>
      </div>
    </div>
  );
}
