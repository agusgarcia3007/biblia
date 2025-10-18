"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StreakBadge } from "@/components/streak-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Home,
  Loader2,
  Settings,
  Calendar,
  MessageSquare,
  BookHeart,
  Notebook,
  TrendingUp,
  Award,
  Sparkles,
  User as UserIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SAINT_PERSONAS } from "@/lib/personas";

interface UserStats {
  totalPrayers: number;
  totalJournalEntries: number;
  totalChatSessions: number;
  journalByType: {
    prayer: number;
    chat: number;
    verse: number;
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [defaultPersona, setDefaultPersona] = useState<string>("augustin");
  const [streak, setStreak] = useState<number>(0);
  const [stats, setStats] = useState<UserStats>({
    totalPrayers: 0,
    totalJournalEntries: 0,
    totalChatSessions: 0,
    journalByType: { prayer: 0, chat: 0, verse: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/auth");
        return;
      }

      setUser(authUser);

      // Load profile with persona
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_persona")
        .eq("user_id", authUser.id)
        .single();

      const typedProfile = profile as {
        default_persona?: string | null;
      } | null;
      if (typedProfile?.default_persona) {
        setDefaultPersona(typedProfile.default_persona);
      }

      // Load streak
      const { data: streakData } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", authUser.id)
        .single();

      if (streakData) {
        setStreak((streakData as { current_streak: number }).current_streak);
      }

      // Load statistics
      await loadStatistics(authUser.id);
    } catch (err) {
      console.error("Error loading user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async (userId: string) => {
    try {
      // Total prayers
      const { count: prayersCount } = await supabase
        .from("prayers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Total chat sessions
      const { count: sessionsCount } = await supabase
        .from("chat_sessions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Total journal entries
      const { count: journalCount } = await supabase
        .from("journal_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Journal entries by type
      const { data: journalEntries } = await supabase
        .from("journal_entries")
        .select("type")
        .eq("user_id", userId);

      const journalByType = {
        prayer: 0,
        chat: 0,
        verse: 0,
      };

      (
        journalEntries as { type: "chat" | "prayer" | "verse" }[] | null
      )?.forEach((entry) => {
        journalByType[entry.type as keyof typeof journalByType]++;
      });

      setStats({
        totalPrayers: prayersCount || 0,
        totalJournalEntries: journalCount || 0,
        totalChatSessions: sessionsCount || 0,
        journalByType,
      });
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getDaysSinceJoined = () => {
    if (!user?.created_at) return 0;
    const now = new Date();
    const joined = new Date(user.created_at);
    const diffTime = Math.abs(now.getTime() - joined.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPersona =
    SAINT_PERSONAS.find((p) => p.key === defaultPersona) || SAINT_PERSONAS[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserIcon className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Mi Perfil</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/settings")}
            >
              <Settings className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/")}
            >
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Profile Header Card */}
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left space-y-3">
                <div>
                  <h2 className="text-2xl font-bold">
                    {user?.email?.split("@")[0]}
                  </h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                  <StreakBadge streak={streak} size="lg" />
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1.5"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{getDaysSinceJoined()} días en la app</span>
                  </Badge>
                </div>

                <div className="pt-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Persona favorita:
                  </p>
                  <Badge variant="secondary" className="text-sm px-3 py-1.5">
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    {currentPersona.display_name}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Prayers */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookHeart className="h-4 w-4" />
                Oraciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalPrayers}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Generadas en total
              </p>
            </CardContent>
          </Card>

          {/* Chat Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Conversaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalChatSessions}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sesiones de chat
              </p>
            </CardContent>
          </Card>

          {/* Journal Entries */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Notebook className="h-4 w-4" />
                Diario
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {stats.totalJournalEntries}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Entradas guardadas
              </p>
            </CardContent>
          </Card>

          {/* Streak Achievement */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Award className="h-4 w-4" />
                Racha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{streak}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Días consecutivos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Actividad Detallada
            </CardTitle>
            <CardDescription>Tu actividad en la aplicación</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Journal Breakdown */}
            <div>
              <h4 className="text-sm font-medium mb-3">
                Entradas en el Diario
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookHeart className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Oraciones guardadas</span>
                  </div>
                  <Badge variant="secondary">
                    {stats.journalByType.prayer}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Conversaciones guardadas</span>
                  </div>
                  <Badge variant="secondary">{stats.journalByType.chat}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Versículos guardados</span>
                  </div>
                  <Badge variant="secondary">{stats.journalByType.verse}</Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Account Info */}
            <div>
              <h4 className="text-sm font-medium mb-3">
                Información de Cuenta
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Fecha de registro
                  </span>
                  <span className="font-medium">
                    {user?.created_at
                      ? new Date(user.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Email verificado
                  </span>
                  <Badge
                    variant={user?.email_confirmed_at ? "default" : "secondary"}
                  >
                    {user?.email_confirmed_at ? "Sí" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
            <CardDescription>
              Explora más funciones de la aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/chat")}
              className="justify-start"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ir al Chat Bíblico
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/prayer")}
              className="justify-start"
            >
              <BookHeart className="h-4 w-4 mr-2" />
              Generar Oración
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/journal")}
              className="justify-start"
            >
              <Notebook className="h-4 w-4 mr-2" />
              Ver mi Diario
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/settings")}
              className="justify-start"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configuración
            </Button>
          </CardContent>
        </Card>

        {/* Persona Card */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tu Guía Espiritual: {currentPersona.display_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentPersona.style_card}
            </p>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/settings")}
              >
                Cambiar Persona
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
