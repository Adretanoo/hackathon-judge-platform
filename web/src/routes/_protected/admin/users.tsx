import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Button } from '@/shared/ui';
import { Search, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Badge } from '@/shared/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';
import { toast } from 'sonner';
import { EditUserModal } from '@/features/users/components/EditUserModal';

export const Route = createFileRoute('/_protected/admin/users')({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any | null>(null);

  const { data: users = [], isLoading, isError } = useQuery({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const { data } = await authClient.get('/users', {
        params: { limit: 100, search: search || undefined },
      });
      return data.data?.items || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => authClient.delete(`/users/${userId}`),
    onSuccess: () => {
      toast.success('Користувача видалено!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: () => toast.error('Помилка при видаленні користувача')
  });

  const handleDelete = (userId: string) => {
    if (window.confirm("Дійсно видалити цього користувача назавжди? Цю дію неможливо відмінити!")) {
      deleteMutation.mutate(userId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">System Users</h1>
          <p className="text-muted-foreground">Manage all users, their roles, and global platform access.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук за ім'ям або email..."
            className="w-64 pl-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-primary/10 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="divide-y divide-border/50">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-muted/60 rounded w-40 animate-pulse" />
                  <div className="h-3 bg-muted/40 rounded w-56 animate-pulse" />
                </div>
                <div className="h-8 bg-muted/40 rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-destructive flex flex-col items-center gap-2">
            <p className="font-bold">Помилка завантаження користувачів</p>
            <p className="text-sm text-muted-foreground">Перевірте з'єднання або права доступу.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {users.map((user: any) => (
              <div key={user.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                 <div>
                    <h3 className="font-bold flex items-center gap-2">
                      {user.fullName || 'Без імені'}
                      {!user.isActive && <Badge variant="destructive" className="h-5 text-[10px]">Banned</Badge>}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                 </div>
                 <div className="flex items-center gap-4">
                    <Badge variant="outline" className="uppercase font-bold text-[10px] bg-primary/5 text-primary">
                      {user.roles?.find((r: any) => !r.hackathonId)?.role || 'PARTICIPANT'}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditingUser(user)}>
                         <Edit2 className="h-4 w-4" /> Edit
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(user.id)}>
                         <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                 </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">Немає зареєстрованих користувачів.</div>
            )}
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      <EditUserModal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        user={editingUser} 
      />
    </div>
  );
}
