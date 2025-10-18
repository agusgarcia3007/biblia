"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VerseCard } from "@/components/verse-card";
import { StreakBadge } from "@/components/streak-badge";
import { MessageSquare, Heart, BookOpen, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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
  const [verseOfDay, setVerseOfDay] = useState<VerseOfDay | null>(null);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
          setIsAuthenticated(true);

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
      await fetch("/api/journal", {
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
      alert("Versículo guardado en tu diario");
    } catch (error) {
      console.error("Error saving verse:", error);
      alert("Error al guardar versículo");
    }
  };

  const handleShareVerse = () => {
    if (!verseOfDay) return;

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
            <Link href={isAuthenticated ? "/profile" : "/auth"}>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-5 w-5" />
              </Button>
            </Link>
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
              <Link href="/profile">
                <Button
                  variant="outline"
                  className="w-full h-24 flex-col gap-2"
                  size="lg"
                >
                  <UserCircle className="h-6 w-6" />
                  <span>Mi Perfil</span>
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
