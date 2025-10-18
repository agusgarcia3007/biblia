"use client";

import { Card } from "@/components/ui/card";
import { Trophy, Flame, Medal, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  user_id: string;
  score: number;
  streak: number;
  rank: number;
}

interface LeaderboardProps {
  leaderboard: LeaderboardEntry[];
  currentUser?: LeaderboardEntry;
  totalUsers: number;
  showAll?: boolean;
}

export function Leaderboard({
  leaderboard,
  currentUser,
  totalUsers,
  showAll = false,
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return (
          <div className="h-6 w-6 flex items-center justify-center text-sm font-bold text-muted-foreground">
            {rank}
          </div>
        );
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500";
      case 3:
        return "bg-gradient-to-r from-amber-600 to-amber-800";
      default:
        return "bg-muted";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Tabla de Posiciones
        </h3>
        <Badge variant="outline">{totalUsers} usuarios</Badge>
      </div>

      <Card className="p-4 space-y-3 max-h-[600px] overflow-y-auto">
        {leaderboard.map((entry) => {
          const isCurrentUser = currentUser?.user_id === entry.user_id;
          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isCurrentUser
                  ? "bg-primary/10 border-2 border-primary"
                  : "bg-muted/30 hover:bg-muted/50"
              }`}
            >
              {/* Rank Icon */}
              <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>

              {/* User info (anonymized) */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">
                    {isCurrentUser ? "Tú" : `Usuario #${entry.rank}`}
                  </span>
                  {entry.rank <= 3 && (
                    <Badge
                      className={`text-xs ${getRankBadgeColor(entry.rank)}`}
                    >
                      Top {entry.rank}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Flame className="h-3 w-3" />
                  <span>{entry.streak} días de racha</span>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {entry.score}
                </div>
                <div className="text-xs text-muted-foreground">puntos</div>
              </div>
            </div>
          );
        })}
      </Card>

      {/* Current user rank if not in top 10 and not showing all */}
      {!showAll && currentUser && currentUser.rank > 10 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="text-sm text-muted-foreground mb-2">Tu posición:</div>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center text-sm font-bold">
              #{currentUser.rank}
            </div>
            <div className="flex-1">
              <div className="font-medium">Tú</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Flame className="h-3 w-3" />
                <span>{currentUser.streak} días de racha</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-primary">
                {currentUser.score}
              </div>
              <div className="text-xs text-muted-foreground">puntos</div>
            </div>
          </div>
        </Card>
      )}

      {/* Scoring info */}
      <Card className="p-4 bg-muted/30">
        <div className="text-xs text-muted-foreground space-y-1">
          <div className="font-semibold mb-2">Cómo ganar puntos:</div>
          <div className="flex justify-between">
            <span>• Racha diaria</span>
            <span className="font-medium">10 pts/día</span>
          </div>
          <div className="flex justify-between">
            <span>• Oraciones guardadas</span>
            <span className="font-medium">8 pts</span>
          </div>
          <div className="flex justify-between">
            <span>• Entradas en el diario</span>
            <span className="font-medium">5 pts</span>
          </div>
          <div className="flex justify-between">
            <span>• Sesiones de chat</span>
            <span className="font-medium">3 pts</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
