import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Button, Input, Label, Textarea, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Avatar, AvatarFallback, AvatarImage, Badge } from '@/shared/ui';
import { userApi } from '@/shared/api/user.service';
import type { UserProfile } from '@/shared/api/user.service';
import { toast } from 'sonner';
import { Plus, X, BadgeCheck, ShieldAlert } from 'lucide-react';

export const Route = createFileRoute('/_protected/profile/')({
  component: ProfilePage,
});

function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userApi.getMe();
        setProfile(data);
        setFullName(data.fullName || '');
        setBio(data.bio || '');
        setAvatarUrl(data.avatarUrl || '');
        setSkills(data.skills || []);
      } catch (err) {
        toast.error('Не вдалося завантажити профіль');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = await userApi.updateMe({
        fullName,
        bio,
        avatarUrl,
        skills,
      });
      setProfile(data);
      toast.success('Профіль успішно оновлено!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Помилка при збереженні профілю');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVerify = async () => {
    setIsSaving(true);
    try {
      const data = await userApi.updateMe({
        isVerified: true,
      });
      setProfile(data);
      toast.success('Ваш акаунт успішно верифіковано!');
    } catch (err: any) {
      toast.error('Помилка при верифікації акаунту');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="p-8">Завантаження...</div>;
  }

  return (
    <div className="container max-w-4xl py-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Налаштування профілю</h1>
          <p className="text-muted-foreground">
            Керуйте своїми особистими даними та навичками.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        {/* Main form */}
        <Card>
          <CardHeader>
            <CardTitle>Особиста інформація</CardTitle>
            <CardDescription>
              Оновіть своє ім'я або додайте короткий опис про себе.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="fullName">Повне ім'я</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Про себе</Label>
              <Textarea
                id="bio"
                placeholder="Розкажіть трохи про себе, ваші інтереси та досвід..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="avatarUrl">URL Аватарки</Label>
              <Input
                id="avatarUrl"
                placeholder="https://example.com/avatar.jpg"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Вкажіть посилання на зображення</p>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Ваші навички (Tech Stack)</Label>
              <div className="flex items-center gap-2 mb-3">
                <Input
                  placeholder="Введіть навичку, наприклад 'React'"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <Button type="button" onClick={handleAddSkill} variant="secondary">
                  <Plus className="w-4 h-4 mr-1" /> Додати
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Навичок ще не додано</p>
                ) : (
                  skills.map((skill) => (
                    <Badge key={skill} variant="default" className="text-sm py-1 px-3">
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 hover:text-red-300 focus:outline-none"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t p-6">
            <p className="text-sm text-muted-foreground">
              Зміни будуть застосовані одразу після збереження.
            </p>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Збереження...' : 'Зберегти зміни'}
            </Button>
          </CardFooter>
        </Card>

        {/* Sidebar Profile Card */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4 border-4 border-muted">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="text-2xl">{fullName?.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{fullName}</h3>
              <p className="text-sm text-muted-foreground mb-4">@{profile?.email?.split('@')[0]}</p>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">
                  {profile?.role === 'ORGANIZER' ? 'Організатор' : profile?.role === 'JUDGE' ? 'Суддя' : 'Учасник'}
                </Badge>
                {profile?.isVerified && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-0 flex items-center gap-1">
                    <BadgeCheck className="w-3 h-3" /> Верифіковано
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Verification Card */}
          {!profile?.isVerified && (
            <Card className="border-amber-200 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-amber-800 dark:text-amber-400">Акаунт не верифіковано</h4>
                    <p className="text-xs text-amber-700/80 dark:text-amber-500/80">
                      Верифікуйте свій акаунт, щоб отримати доступ до всіх можливостей платформи та викликати більше довіри.
                    </p>
                    <Button 
                      variant="outline" 
                      className="w-full mt-2 bg-white dark:bg-black hover:bg-amber-100 dark:hover:bg-amber-900/20"
                      onClick={handleVerify}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Зачекайте...' : 'Верифікувати зараз'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
