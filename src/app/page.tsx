"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { StreakBadge } from "@/components/streak-badge";
import { ShareImage } from "@/components/share-image";
import {
  MessageSquare,
  Heart,
  BookOpen,
  User,
  Phone,
  Settings,
  LogOut,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toPng } from "html-to-image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { handleUnauthorized } from "@/lib/auth-utils";
import { createClient } from "@/lib/supabase/client";

interface VerseOfDay {
  verse: {
    id: string;
    book: string;
    chapter: number;
    verse: number;
    text: string;
    reference: string;
    is_deuterocanon: boolean;
  };
  reflection: string;
  date: string;
}

interface Streak {
  current_streak: number;
  last_active_date: string;
}

export default function Home() {
  const router = useRouter();
  const supabase = createClient();
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch verse of the day
        const verseRes = await fetch("/api/verse-of-day");
        if (verseRes.ok) {
          const verseData = await verseRes.json();
          setVerseOfDay(verseData);
        }

        // Fetch streak (if authenticated)
        const streakRes = await fetch("/api/streak");
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreak(streakData);

          // Update streak if not active today
          const today = new Date().toISOString().split("T")[0];
          if (streakData.last_active_date !== today) {
            await fetch("/api/streak", { method: "POST" });
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleSaveVerse = async () => {
    if (!verseOfDay) return;

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "verse",
          payload: {
            verse: verseOfDay.verse,
            reflection: verseOfDay.reflection,
            date: verseOfDay.date,
          },
        }),
      });

      if (response.status === 401) {
        handleUnauthorized(router, "/");
        return;
      }

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      alert("Versículo guardado en tu diario");
    } catch (error) {
      console.error("Error saving verse:", error);
      alert("Error al guardar versículo");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/auth");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleShareVerse = async () => {
    if (!verseOfDay) return;

    try {
      // Create a temporary container for the ShareImage component
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      // Render the ShareImage component
      const root = await import("react-dom/client").then((m) =>
        m.createRoot(container)
      );
      await new Promise<void>((resolve) => {
        root.render(
          <ShareImage
            type="verse"
            content={{
              title: verseOfDay.verse.reference,
              text: verseOfDay.verse.text,
              subtitle: verseOfDay.reflection,
            }}
            streak={streak?.current_streak || 0}
          />
        );
        // Wait for render
        setTimeout(resolve, 500);
      });

      // Generate image
      const element = container.querySelector("#share-image") as HTMLElement;
      if (!element) throw new Error("Element not found");

      const dataUrl = await toPng(element, {
        width: 1080,
        height: 1920,
        pixelRatio: 2,
        cacheBust: true,
      });

      // Cleanup immediately after generating
      root.unmount();
      document.body.removeChild(container);

      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Try to share
      if (navigator.share) {
        try {
          // Create File object with timestamp to ensure uniqueness
          const timestamp = Date.now();
          const file = new File([blob], `versiculo-${timestamp}.png`, {
            type: "image/png",
            lastModified: timestamp,
          });

          // Check if we can share files
          const canShareFiles =
            navigator.canShare && navigator.canShare({ files: [file] });

          if (canShareFiles) {
            await navigator.share({
              files: [file],
              title: "Versículo del Día",
              text: `${verseOfDay.verse.reference}`,
            });
          } else {
            // Mobile fallback: download the image automatically
            const link = document.createElement("a");
            link.download = `versiculo-${timestamp}.png`;
            link.href = dataUrl;
            link.click();

            // Then share text to allow user to attach the downloaded image
            setTimeout(() => {
              navigator
                .share({
                  title: "Versículo del Día",
                  text: `${verseOfDay.verse.reference}\n\nHe descargado la imagen, adjúntala desde tu galería.`,
                })
                .catch(() => {});
            }, 500);
          }
        } catch (shareError) {
          if ((shareError as Error).name !== "AbortError") {
            // Fallback: download
            const link = document.createElement("a");
            link.download = "versiculo.png";
            link.href = dataUrl;
            link.click();
          }
        }
      } else {
        // Desktop fallback: download the image
        const link = document.createElement("a");
        link.download = "versiculo.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Error sharing verse:", error);
      // Fallback to text sharing
      const shareText = `"${verseOfDay.verse.text}"\n\n${verseOfDay.verse.reference}\n\n${verseOfDay.reflection}`;
      if (navigator.share) {
        navigator.share({
          title: "Versículo del Día",
          text: shareText,
        });
      } else {
        navigator.clipboard.writeText(shareText);
        alert("Versículo copiado al portapapeles");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">
            Biblia Católica AI
          </h1>
          <div className="flex items-center gap-4">
            {streak && <StreakBadge streak={streak.current_streak} />}
            <Link href="/leaderboard">
              <Button variant="ghost" size="icon">
                <Trophy className="h-5 w-5" />
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Configuración</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-8">
          {/* Welcome Section */}
          <section className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Bienvenido</h2>
            <p className="text-muted-foreground">
              Explora la Palabra de Dios con la ayuda de la inteligencia
              artificial
            </p>
          </section>

          {/* Verse of the Day */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-48 bg-muted rounded-lg" />
            </div>
          ) : verseOfDay ? (
            <section className="space-y-3">
              <h3 className="text-xl font-semibold">Versículo del Día</h3>
              <VerseCard
                verse={verseOfDay.verse}
                reflection={verseOfDay.reflection}
                onViewContext={() => router.push(`/verse/${verseOfDay.date}`)}
                onShare={handleShareVerse}
                onSave={handleSaveVerse}
              />
            </section>
          ) : (
            <div className="text-center text-muted-foreground">
              No se pudo cargar el versículo del día
            </div>
          )}

          {/* Quick Actions */}
          <section className="space-y-3">
            <h3 className="text-xl font-semibold">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/chat">
                <Button
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                  size="lg"
                >
                  <MessageSquare className="h-6 w-6" />
                  <span>Chatear con la Biblia</span>
                </Button>
              </Link>
              <Link href="/talk">
                <Button
                  variant="outline"
                  className="w-full h-24 flex-col gap-2 relative overflow-hidden border-primary/50 hover:border-primary transition-all duration-300 group"
                  size="lg"
                >
                  <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-accent/10 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  <Phone className="h-6 w-6 relative z-10 group-hover:scale-110 transition-transform duration-300" />
                  <span className="relative z-10 font-semibold">
                    Hablar con un Santo
                  </span>
                </Button>
              </Link>
              <Link href="/prayer">
                <Button
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                  size="lg"
                >
                  <Heart className="h-6 w-6" />
                  <span>Orar Conmigo</span>
                </Button>
              </Link>
              <Link href="/journal">
                <Button
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                  size="lg"
                >
                  <BookOpen className="h-6 w-6" />
                  <span>Mi Diario Espiritual</span>
                </Button>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Biblia Católica AI. Todos los derechos reservados.</p>
          <p className="mt-1">
            Basado en la Biblia Católica en español (dominio público)
          </p>
        </div>
      </footer>
    </div>
  );
}
