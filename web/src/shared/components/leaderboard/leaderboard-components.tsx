import { type LeaderboardEntry } from '@/shared/hooks/use-leaderboard-socket';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui';
import { Crown, Medal, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface LeaderboardPodiumProps {
  top3: LeaderboardEntry[];
}

const MEDALS = [
  {
    rank: 1,
    label: '1st Place',
    icon: Crown,
    gradient: 'from-amber-400 via-yellow-300 to-amber-200',
    border: 'border-amber-300',
    shadow: 'shadow-amber-200/50',
    textColor: 'text-amber-900',
    height: 'h-40',
    zIndex: 'z-10',
  },
  {
    rank: 2,
    label: '2nd Place',
    icon: Medal,
    gradient: 'from-slate-300 via-gray-200 to-slate-100',
    border: 'border-slate-300',
    shadow: 'shadow-slate-200/50',
    textColor: 'text-slate-800',
    height: 'h-32',
    zIndex: 'z-0',
  },
  {
    rank: 3,
    label: '3rd Place',
    icon: Award,
    gradient: 'from-orange-300 via-amber-200 to-orange-100',
    border: 'border-orange-300',
    shadow: 'shadow-orange-200/50',
    textColor: 'text-orange-900',
    height: 'h-24',
    zIndex: 'z-0',
  },
];

// Podium display order: 2nd, 1st, 3rd
const PODIUM_ORDER = [1, 0, 2];

export function LeaderboardPodium({ top3 }: LeaderboardPodiumProps) {
  if (top3.length === 0) return null;

  return (
    <div className="flex items-end justify-center gap-4 py-8">
      {PODIUM_ORDER.map((dataIdx) => {
        const entry = top3[dataIdx];
        const medal = MEDALS[dataIdx];
        if (!entry) return null;

        const MedalIcon = medal.icon;

        return (
          <div key={entry.projectId} className={cn('flex flex-col items-center gap-3', medal.zIndex)}>
            {/* Info card above podium */}
            <div className="text-center space-y-1 max-w-[160px]">
              <MedalIcon className={cn('h-7 w-7 mx-auto', medal.textColor)} />
              <p className="font-black text-sm leading-tight text-foreground truncate max-w-[140px]">
                {entry.teamName}
              </p>
              <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">
                {entry.projectTitle}
              </p>
              <Badge className={cn('text-[10px] font-bold h-5 px-2 border', medal.gradient.includes('amber-4') ? 'bg-amber-100 text-amber-800 border-amber-200' : '')} variant="secondary">
                {entry.normalizedScore > 0 ? '+' : ''}{entry.normalizedScore.toFixed(3)} Z
              </Badge>
            </div>

            {/* Podium block */}
            <div
              className={cn(
                'w-28 rounded-t-2xl flex items-center justify-center border-2',
                `bg-gradient-to-b ${medal.gradient}`,
                medal.border,
                `shadow-xl ${medal.shadow}`,
                medal.height
              )}
            >
              <span className={cn('text-3xl font-black', medal.textColor)}>
                #{entry.rank}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface LeaderboardTableRowProps {
  entry: LeaderboardEntry;
  prevRank?: number;
  isHighlighted?: boolean;
}

function RankChange({ current, prev }: { current: number; prev?: number }) {
  if (prev === undefined || prev === current) return <Minus className="h-3 w-3 text-muted-foreground/40" />;
  if (current < prev) return (
    <div className="flex items-center gap-0.5 text-emerald-500">
      <TrendingUp className="h-3 w-3" />
      <span className="text-[10px] font-bold">+{prev - current}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-0.5 text-orange-500">
      <TrendingDown className="h-3 w-3" />
      <span className="text-[10px] font-bold">{current - prev}</span>
    </div>
  );
}

export function LeaderboardTableRow({ entry, prevRank, isHighlighted }: LeaderboardTableRowProps) {
  const isTop3 = entry.rank <= 3;
  const rankColors = ['text-amber-500', 'text-slate-500', 'text-orange-500'];

  return (
    <tr
      className={cn(
        'group transition-all duration-300',
        isHighlighted && 'animate-pulse-once',
        isTop3 ? 'bg-gradient-to-r from-muted/40 to-transparent hover:from-muted/60' : 'hover:bg-muted/20',
      )}
    >
      {/* Rank */}
      <td className="py-3.5 pl-6 pr-3 w-16">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-lg font-black w-7 text-center tabular-nums',
              isTop3 ? rankColors[entry.rank - 1] : 'text-muted-foreground',
            )}
          >
            {entry.rank}
          </span>
          <RankChange current={entry.rank} prev={prevRank} />
        </div>
      </td>

      {/* Team / Project */}
      <td className="py-3.5 pr-4">
        <div className="space-y-0.5">
          <p className={cn('font-bold text-sm', isTop3 && 'font-black')}>{entry.teamName}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[240px]">{entry.projectTitle}</p>
        </div>
      </td>

      {/* Raw score */}
      <td className="py-3.5 pr-4 text-center hidden md:table-cell">
        <span className="text-sm font-bold tabular-nums">{entry.totalRawScore.toFixed(1)}</span>
      </td>

      {/* Avg score */}
      <td className="py-3.5 pr-4 text-center hidden lg:table-cell">
        <span className="text-sm tabular-nums text-muted-foreground">{entry.averageRawScore.toFixed(2)}</span>
      </td>

      {/* Z-score */}
      <td className="py-3.5 pr-6 text-right">
        <span
          className={cn(
            'text-sm font-black tabular-nums',
            entry.normalizedScore > 0 ? 'text-emerald-600' : entry.normalizedScore < 0 ? 'text-orange-500' : 'text-foreground',
          )}
        >
          {entry.normalizedScore > 0 && '+'}
          {entry.normalizedScore.toFixed(4)}
        </span>
      </td>
    </tr>
  );
}
