/**
 * @file web/src/features/judging/store/judging.store.ts
 * @description Local persistent UI store for the Judge context.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DraftScore {
  scores: Record<string, string>; // Maps criteriaName -> score value
  notes: string;
}

interface JudgingStore {
  isBlindJudging: boolean;
  draftScores: Record<string, DraftScore>; // Maps projectId -> DraftScore
  
  toggleBlindJudging: () => void;
  saveDraft: (projectId: string, draft: DraftScore) => void;
  clearDraft: (projectId: string) => void;
}

export const useJudgingStore = create<JudgingStore>()(
  persist(
    (set) => ({
      isBlindJudging: false,
      draftScores: {},
      
      toggleBlindJudging: () => set((state) => ({ isBlindJudging: !state.isBlindJudging })),
      
      saveDraft: (projectId, draft) => 
        set((state) => ({
          draftScores: { ...state.draftScores, [projectId]: draft }
        })),
        
      clearDraft: (projectId) =>
        set((state) => {
          const newDrafts = { ...state.draftScores };
          delete newDrafts[projectId];
          return { draftScores: newDrafts };
        }),
    }),
    {
      name: 'judging-ui-state',
      // Only persist selected fields if needed, but persisting all is fine here
    }
  )
);
