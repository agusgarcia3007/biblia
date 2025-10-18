"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Leaderboard } from "@/components/leaderboard";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface LeaderboardEntry {
  user_id: string;
  score: number;
  streak: number;
  rank: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
  totalUsers: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard?limit=all");
        if (response.status === 401) {
          router.push("/auth");
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setLeaderboardData(data);
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Tabla de Posiciones
            </h1>
            <p className="text-muted-foreground">
              Usuarios más dedicados a su vida espiritual
            </p>
          </div>

          {/* Leaderboard */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-96 bg-muted rounded-lg" />
            </div>
          ) : leaderboardData ? (
            <Leaderboard
              leaderboard={leaderboardData.leaderboard}
              currentUser={leaderboardData.currentUser}
              totalUsers={leaderboardData.totalUsers}
              showAll={true}
            />
          ) : (
            <div className="text-center text-muted-foreground">
              No se pudo cargar la tabla de posiciones
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
