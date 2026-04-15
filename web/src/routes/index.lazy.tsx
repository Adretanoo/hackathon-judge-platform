import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/shared/ui/button';
import { Layers, Zap, ShieldCheck, BarChart3, Sun, Moon, Monitor, ArrowRight, GraduationCap, Building2, HelpCircle } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { useTheme } from '@/app/providers/theme-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui';

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const destPath = user?.role === 'GLOBAL_ADMIN' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">Evalix</span>
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground hover:[&>a]:text-foreground transition-colors">
            <a href="#features">Можливості</a>
            <a href="#audience">Для кого</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors mr-2">
              <span className="text-sm font-medium">GitHub</span>
            </a>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 mr-1">
                  {theme === 'light' && <Sun className="h-4 w-4" />}
                  {theme === 'dark' && <Moon className="h-4 w-4" />}
                  {theme === 'system' && <Monitor className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Світла</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Темна</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Системна</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && (
              <>
                <Link to={destPath}>
                  <Button variant="default" size="sm" className="font-semibold shadow-sm">
                    Особистий кабінет
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  Вийти
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full py-24 md:py-32 lg:py-40 px-4 text-center max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
            <Zap className="mr-2 h-4 w-4" />
            Оновлена платформа Evalix вже доступна!
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight lg:text-8xl mb-6">
            Автоматизоване <span className="bg-gradient-to-br from-primary to-blue-500 bg-clip-text text-transparent">Оцінювання Проєктів</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground font-medium mb-10 leading-relaxed">
            Evalix — це <strong>100% безкоштовна</strong> платформа з відкритим кодом для зручного подання, оцінювання та суддівства комплексних проєктів. Ідеально підходить для університетів, підприємств та конкурсів.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to={destPath}>
                <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
                  Мій кабінет <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
                    Реєстрація
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg font-bold border-2">
                    Увійти
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ─── FEATURES GRID ─── */}
        <section id="features" className="w-full py-20 px-4 bg-muted/30 border-y">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Усе необхідне для проведення оцінювання</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<BarChart3 />}
                title="Гнучкі Критерії"
                description="Створюйте власні рубрики оцінювання з різною вагою категорій для точного та об'єктивного результату."
              />
              <FeatureCard 
                icon={<ShieldCheck />}
                title="Керування Ролями"
                description="Запрошуйте учасників як Адміністраторів, Суддів, або Менторів. Детальні права доступу захистять ваші дані."
              />
              <FeatureCard 
                icon={<Layers />}
                title="Аналітика та Звіти"
                description="Турнірні таблиці оновлюються миттєво. Експортуйте рейтинги в PDF-звіти та генеруйте сертифікати в один клік."
              />
            </div>
          </div>
        </section>

        {/* ─── AUDIENCE SECTION ─── */}
        <section id="audience" className="w-full py-20 px-4 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Для кого створено Evalix?</h2>
            <div className="flex flex-col gap-8">
              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-3xl bg-card border shadow-sm">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-10 h-10 text-blue-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Освітні заклади</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Оцінюйте курсові, дипломні роботи та студентські проєкти за єдиними стандартизованими рубриками без зайвих паперів.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row-reverse items-center gap-8 p-8 rounded-3xl bg-card border shadow-sm">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Layers className="w-10 h-10 text-emerald-500" />
                </div>
                <div className="text-left md:text-right">
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Хакатони та Конкурси</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Керуйте десятками суддів, масштабуйте турнірні таблиці в реальному часі та автоматично генеруйте іменні сертифікати учасникам.</p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8 p-8 rounded-3xl bg-card border shadow-sm">
                <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Building2 className="w-10 h-10 text-amber-500" />
                </div>
                <div className="text-left">
                  <h3 className="text-2xl font-bold tracking-tight mb-2">Корпоративний сектор</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">Проводьте внутрішні інноваційні пітчинги, оцінюйте ідеї співробітників та прозоро обирайте найкращі рішення для бізнесу.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ SECTION ─── */}
        <section id="faq" className="w-full py-20 px-4 bg-muted/30 border-t">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col items-center mb-12">
              <HelpCircle className="w-10 h-10 text-primary mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold text-center">Часті питання</h2>
            </div>
            <div className="space-y-4">
              
              <details name="faq-accordion" className="group rounded-2xl border bg-card/50 text-left overflow-hidden transition-all marker:content-['']">
                <summary className="p-6 cursor-pointer text-lg font-bold flex items-center justify-between select-none">
                  Чи справді платформа безкоштовна?
                  <span className="transition-transform duration-300 group-open:-rotate-180 text-primary">▼</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-muted-foreground leading-relaxed">
                  Так! Evalix — це Open-Source продукт. Ви можете використовувати базовий функціонал (реєстрація, оцінювання, таблиці) абсолютно безкоштовно.
                </div>
              </details>

              <details name="faq-accordion" className="group rounded-2xl border bg-card/50 text-left overflow-hidden transition-all marker:content-['']">
                <summary className="p-6 cursor-pointer text-lg font-bold flex items-center justify-between select-none">
                  Скільки суддів чи учасників я можу додати?
                  <span className="transition-transform duration-300 group-open:-rotate-180 text-primary">▼</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-muted-foreground leading-relaxed">
                  Платформа не має жорстких лімітів на кількість користувачів. Ви можете створювати масштабні події (до тисяч учасників) і додавати туди необмежену кількість команд і суддів.
                </div>
              </details>

              <details name="faq-accordion" className="group rounded-2xl border bg-card/50 text-left overflow-hidden transition-all marker:content-['']">
                <summary className="p-6 cursor-pointer text-lg font-bold flex items-center justify-between select-none">
                  Чи можна налаштувати власні критерії оцінки?
                  <span className="transition-transform duration-300 group-open:-rotate-180 text-primary">▼</span>
                </summary>
                <div className="px-6 pb-6 pt-0 text-muted-foreground leading-relaxed">
                  Звісно. Як Адміністратор (Організатор) ви можете створювати будь-яку кількість критеріїв, вказувати їх максимальний бал (наприклад, від 0 до 100) та призначати вагу (важливість) кожного з них.
                </div>
              </details>

            </div>
          </div>
        </section>

      </main>

      {/* ─── FOOTER ─── */}
      <footer className="w-full border-t bg-background pt-16 pb-8 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
                <Layers className="w-3 h-3 text-background" />
              </div>
              <span className="font-bold text-lg">Evalix</span>
            </div>
            <p className="text-sm text-muted-foreground mr-4">
              Сучасна безкоштовна SaaS-платформа для автоматизованого оцінювання проєктів, зручного суддівства та рейтингів.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Швидкі посилання</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Увійти</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Реєстрація</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Проєкт</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Репозиторій GitHub</a></li>
            </ul>
          </div>

        </div>
        
        <div className="container mx-auto max-w-6xl border-t pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© 2026 Evalix. Усі права захищено.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0 font-medium">
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl border bg-card/40 backdrop-blur-sm hover:bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 text-left space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
