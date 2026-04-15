import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/auth-provider';
import { userApi } from '@/shared/api/user.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Badge } from '@/shared/ui/badge';
import { Mail, Shield, UserCircle, Camera, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui/dialog";

export const Route = createFileRoute('/_protected/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState((user as any)?.fullName || (user as any)?.displayName || '');
  const [bio, setBio] = useState('');
  const [skillsStr, setSkillsStr] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: userApi.getMe,
    enabled: !!user?.id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => userApi.updateMe(data),
    onSuccess: () => {
      toast.success(t('profile.success'));
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      setIsEditing(false);
    },
    onError: () => {
      toast.error(t('common.error'));
    }
  });

  const handleSave = () => {
    const skills = skillsStr.split(',').map(s => s.trim()).filter(Boolean);
    updateMutation.mutate({ fullName: displayName, bio, skills });
  };

  const currentProfile: any = profile || user;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500 py-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Мій Профіль</h1>
          <p className="text-muted-foreground mt-1">Ваша особиста інформація та налаштування.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column (Avatar & Basic Info) */}
        <Card className="col-span-1 border shadow-sm h-fit">
          <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-background ring-2 ring-primary/20 bg-muted flex items-center justify-center">
                {currentProfile?.avatarUrl ? (
                  <img src={currentProfile.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <UserCircle className="h-16 w-16 text-muted-foreground opacity-50" />
                )}
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                    <Camera className="h-5 w-5" />
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-background text-foreground border-border">
                   <DialogHeader>
                     <DialogTitle>Зміна аватара</DialogTitle>
                     <DialogDescription>Завантажте нове фото для свого профілю.</DialogDescription>
                   </DialogHeader>
                   <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl border-primary/20 bg-muted/30">
                     <Camera className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
                     <Button variant="outline">Обрати файл</Button>
                   </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div>
              <h2 className="text-xl font-bold">{currentProfile?.displayName || currentProfile?.fullName}</h2>
              <p className="text-sm text-muted-foreground font-medium flex items-center justify-center gap-1 mt-1">
                <Shield className="h-4 w-4 text-primary" /> 
                {currentProfile?.role === 'GLOBAL_ADMIN' ? 'Головний адміністратор платформи' : currentProfile?.role?.replace('_', ' ')}
              </p>
            </div>

            <div className="w-full h-px bg-border my-2" />
            
            <div className="w-full p-3 bg-muted/50 rounded-xl flex items-center gap-3 text-sm text-muted-foreground text-left">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="truncate">{currentProfile?.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Right Column (Details) */}
        <Card className="col-span-1 md:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold">Деталі профілю</CardTitle>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={() => {
                  setDisplayName(currentProfile?.displayName || currentProfile?.fullName || '');
                  setBio(currentProfile?.bio || '');
                  setSkillsStr(currentProfile?.skills?.join(', ') || '');
                }}>
                  <Edit2 className="h-4 w-4" /> Редагувати
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-background text-foreground border-border rounded-xl">
                <DialogHeader>
                  <DialogTitle>Редагувати профіль</DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Внесіть зміни у свій профіль та збережіть їх.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Ім'я та прізвище</Label>
                    <Input 
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)} 
                      placeholder="Введіть ваше ім'я"
                      className="bg-background text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Про себе</Label>
                    <textarea 
                      value={bio} 
                      onChange={e => setBio(e.target.value)}
                      placeholder="Розкажіть трохи про себе..."
                      className="w-full min-h-[100px] rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Навички (через кому)</Label>
                    <Input 
                      value={skillsStr} 
                      onChange={e => setSkillsStr(e.target.value)} 
                      placeholder="React, Node.js, Design..."
                      className="bg-background text-foreground"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>Скасувати</Button>
                  <Button onClick={handleSave} disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Збереження..." : "Зберегти"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase">Про себе</h3>
              {currentProfile?.bio ? (
                <p className="text-sm leading-relaxed">{currentProfile.bio}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Біографія не заповнена.</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-bold text-muted-foreground uppercase">Навички</h3>
              <div className="flex flex-wrap gap-2">
                {currentProfile?.skills && currentProfile.skills.length > 0 ? (
                  currentProfile.skills.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 font-semibold">{s}</Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">Навички не вказані.</p>
                )}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
