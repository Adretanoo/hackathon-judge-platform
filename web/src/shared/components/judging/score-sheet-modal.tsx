import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type JudgingStats, judgingApi } from '@/shared/api/judging.service';
import { projectApi } from '@/shared/api/project.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/shared/ui';
import { 
  BarChart3, 
  AlertTriangle, 
  MessageSquare,
  Calculator,
  Save,
  Rocket
} from 'lucide-react';
import { toast } from 'sonner';

interface ScoreSheetModalProps {
  projectId: string;
  projectTitle: string;
  isOpen: boolean;
  onClose: () => void;
  judgeStats?: JudgingStats;
  existingScores?: Array<{ criteriaId: string; scoreValue: number; comment?: string }>;
  conflicts?: any[];
}

export function ScoreSheetModal({ 
  projectId, 
  projectTitle, 
  isOpen, 
  onClose,
  judgeStats,
  existingScores = [],
  conflicts = []
}: ScoreSheetModalProps) {
  const queryClient = useQueryClient();
  const [scores, setScores] = useState<Record<string, number>>(
    Object.fromEntries(existingScores.map(s => [s.criteriaId, s.scoreValue]))
  );
  const [comments, setComments] = useState<Record<string, string>>(
    Object.fromEntries(existingScores.map(s => [s.criteriaId, s.comment || '']))
  );

  const { data: criteria, isLoading: isLoadingCriteria } = useQuery({
    queryKey: ['projectCriteria', projectId],
    queryFn: () => projectApi.getCriteria(projectId),
    enabled: isOpen
  });

  const conflict = conflicts.find(c => c.teamId === projectId || c.team?.id === projectId); // Simplified check

  const mutation = useMutation({
    mutationFn: (payload: any) => judgingApi.submitScores(projectId, payload),
    onSuccess: () => {
      toast.success('Scores submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['judgingProjects'] });
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to submit scores');
    }
  });

  const totalRaw = useMemo(() => {
    if (!criteria) return 0;
    return criteria.reduce((sum: number, c: any) => sum + (scores[c.id] || 0) * Number(c.weight), 0);
  }, [scores, criteria]);

  const zScorePreview = useMemo(() => {
    if (!judgeStats || !criteria || criteria.length === 0) return 0;
    const avgScore = totalRaw / criteria.reduce((sum: number, c: any) => sum + Number(c.weight), 0);
    return (avgScore - judgeStats.mean) / (judgeStats.stdDev || 1);
  }, [totalRaw, criteria, judgeStats]);

  const handleSubmit = () => {
    const payload = (criteria || []).map((c: any) => ({
      criteriaId: c.id,
      scoreValue: scores[c.id] || 0,
      comment: comments[c.id] || ''
    }));
    mutation.mutate(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Rocket className="h-5 w-5 text-primary" />
            <Badge variant="secondary" className="bg-primary/5 text-primary">Judging Session</Badge>
          </div>
          <DialogTitle className="text-2xl font-bold">{projectTitle}</DialogTitle>
          <DialogDescription>
            Evaluate the project based on the criteria below. Scoring is on a scale of 0-10.
          </DialogDescription>
        </DialogHeader>

        {conflict && (
          <Alert variant="destructive" className="my-4 border-destructive/50 bg-destructive/5">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Conflict of Interest Detected</AlertTitle>
            <AlertDescription>
               {conflict.reason || 'You have a recorded conflict with this team.'} 
               {!conflict.overridden && ' Scoring is currently blocked.'}
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8 py-4">
          {isLoadingCriteria ? (
             <div className="py-12 text-center animate-pulse">Loading criteria...</div>
          ) : (
            criteria?.map((c: any) => (
              <div key={c.id} className="space-y-4 p-6 rounded-2xl bg-muted/30 border border-primary/5 shadow-sm">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <h4 className="font-bold flex items-center gap-2">
                      {c.name}
                      <Badge variant="outline" className="text-[10px] uppercase font-bold px-2 py-0 h-5">
                        Weight: {c.weight}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                  </div>
                  <div className="text-2xl font-black text-primary bg-white h-12 w-16 flex items-center justify-center rounded-xl border border-primary/10 shadow-sm">
                    {scores[c.id] || 0}
                  </div>
                </div>

                <div className="py-2">
                  <input 
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={scores[c.id] || 0}
                    onChange={(e) => setScores(prev => ({ ...prev, [c.id]: parseFloat(e.target.value) }))}
                    className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground mt-2 px-1">
                    <span>Poor (0)</span>
                    <span>Excellent (10)</span>
                  </div>
                </div>

                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-30" />
                  <textarea 
                    placeholder="Provide constructive feedback for this criterion..."
                    value={comments[c.id] || ''}
                    onChange={(e) => setComments(prev => ({ ...prev, [c.id]: e.target.value }))}
                    className="w-full min-h-[80px] pl-10 pr-4 py-3 rounded-xl bg-white border border-primary/5 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-4 items-center bg-muted/30 p-6 rounded-2xl border border-primary/5 mt-4">
          <div className="flex-1 flex gap-6 items-center">
            <div className="space-y-1">
               <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                  <BarChart3 className="h-3 w-3" /> Raw Score
               </span>
               <div className="text-2xl font-black text-foreground">
                  {totalRaw.toFixed(2)}
               </div>
            </div>
            
            <div className="h-8 w-px bg-primary/10" />

            <div className="space-y-1">
               <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest flex items-center gap-1">
                  <Calculator className="h-3 w-3" /> Z-Score Preview
               </span>
               <div className={`text-2xl font-black flex items-center gap-2 ${zScorePreview > 0 ? 'text-emerald-500' : zScorePreview < 0 ? 'text-orange-500' : 'text-foreground'}`}>
                  {zScorePreview > 0 && '+'}
                  {zScorePreview.toFixed(3)}
                  {zScorePreview > 1 && <Badge className="bg-emerald-500 hover:bg-emerald-500 text-[10px] px-1.5 h-4">Top Tier</Badge>}
               </div>
            </div>
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
             <Button variant="ghost" onClick={onClose} className="rounded-xl flex-1 sm:flex-none">Cancel</Button>
             <Button 
              onClick={handleSubmit} 
              disabled={mutation.isPending || (conflict && !conflict.overridden)}
              className="rounded-xl bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 gap-2 px-8 flex-1 sm:flex-none"
             >
               {mutation.isPending ? 'Saving...' : (
                 <>
                   <Save className="h-4 w-4" /> Save Evaluation
                 </>
               )}
             </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
