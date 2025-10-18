"use client";

import { SaintPicker } from "@/components/saint-picker";
import { ShareImage } from "@/components/share-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  clearSavedState,
  handleUnauthorized,
  restoreSavedState,
} from "@/lib/auth-utils";
import { DEFAULT_PERSONA_KEY } from "@/lib/personas";
import { toPng } from "html-to-image";
import {
  Bookmark,
  Heart,
  Home,
  Loader2,
  Pause,
  Share2,
  Volume2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PRAYER_INTENTS = [
  { key: "gratitud", label: "Gratitud" },
  { key: "paz", label: "Paz" },
  { key: "duelo", label: "Duelo" },
  { key: "discernimiento", label: "Discernimiento" },
  { key: "familia", label: "Familia" },
  { key: "trabajo", label: "Trabajo" },
  { key: "salud", label: "Salud" },
  { key: "fortaleza", label: "Fortaleza" },
  { key: "perdon", label: "Perdón" },
  { key: "esperanza", label: "Esperanza" },
];

interface PrayerResponse {
  prayer: string;
  prayerId: string;
  personaKey: string;
  intentTag: string;
}

interface Streak {
  current_streak: number;
  last_active_date: string;
}

export default function PrayerPage() {
  const router = useRouter();
  const [personaKey, setPersonaKey] = useState(DEFAULT_PERSONA_KEY);
  const [selectedIntent, setSelectedIntent] = useState<string>("");
  const [userContext, setUserContext] = useState("");
  const [generatedPrayer, setGeneratedPrayer] = useState<PrayerResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null
  );
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [streak, setStreak] = useState<Streak | null>(null);

  useEffect(() => {
    // Restaurar estado si existe
    const savedState = restoreSavedState();
    if (savedState?.path === "/prayer" && savedState.formData) {
      const {
        personaKey: savedPersona,
        selectedIntent: savedIntent,
        userContext: savedContext,
        generatedPrayer: savedPrayer,
      } = savedState.formData;
      if (savedPersona) setPersonaKey(savedPersona);
      if (savedIntent) setSelectedIntent(savedIntent);
      if (savedContext) setUserContext(savedContext);
      if (savedPrayer) setGeneratedPrayer(savedPrayer);
      clearSavedState();
    }

    async function fetchStreak() {
      try {
        const streakRes = await fetch("/api/streak");
        if (streakRes.ok) {
          const streakData = await streakRes.json();
          setStreak(streakData);
        }
      } catch (error) {
        console.error("Error fetching streak:", error);
      }
    }
    fetchStreak();
  }, []);

  const handleGeneratePrayer = async () => {
    if (!selectedIntent) {
      alert("Por favor selecciona una intención");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prayer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaKey,
          intentTag: selectedIntent,
          userContext: userContext.trim() || undefined,
        }),
      });

      if (response.status === 401) {
        handleUnauthorized(router, "/prayer", {
          personaKey,
          selectedIntent,
          userContext,
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Error al generar oración");
      }

      const data: PrayerResponse = await response.json();
      setGeneratedPrayer(data);
    } catch (err) {
      console.error("Error generating prayer:", err);
      setError("Error al generar oración. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrayer = async () => {
    if (!generatedPrayer) return;

    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "prayer",
          payload: {
            prayer: generatedPrayer.prayer,
            personaKey: generatedPrayer.personaKey,
            intentTag: generatedPrayer.intentTag,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.status === 401) {
        handleUnauthorized(router, "/prayer", {
          personaKey,
          selectedIntent,
          userContext,
          generatedPrayer,
        });
        return;
      }

      if (!response.ok) {
        throw new Error("Error al guardar");
      }

      alert("Oración guardada en tu diario");
    } catch (err) {
      console.error("Error saving prayer:", err);
      alert("Error al guardar oración");
    }
  };

  const handleSharePrayer = async () => {
    if (!generatedPrayer) return;

    try {
      // Create a temporary container for the ShareImage component
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      document.body.appendChild(container);

      // Get persona display name
      const personaName =
        personaKey === "augustin"
          ? "San Agustín"
          : personaKey === "teresa_avila"
          ? "Santa Teresa de Ávila"
          : "San Francisco de Asís";

      // Render the ShareImage component
      const root = await import("react-dom/client").then((m) =>
        m.createRoot(container)
      );
      await new Promise<void>((resolve) => {
        root.render(
          <ShareImage
            type="prayer"
            content={{
              title:
                PRAYER_INTENTS.find((i) => i.key === generatedPrayer.intentTag)
                  ?.label || "Mi Oración",
              text:
                generatedPrayer.prayer.length > 400
                  ? generatedPrayer.prayer.substring(0, 400) + "..."
                  : generatedPrayer.prayer,
              subtitle: `Al estilo de ${personaName}`,
            }}
            streak={streak?.current_streak}
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
          const file = new File([blob], `oracion-${timestamp}.png`, {
            type: "image/png",
            lastModified: timestamp,
          });

          // Check if we can share files
          const canShareFiles =
            navigator.canShare && navigator.canShare({ files: [file] });

          if (canShareFiles) {
            await navigator.share({
              files: [file],
              title: "Mi Oración",
              text:
                PRAYER_INTENTS.find((i) => i.key === generatedPrayer.intentTag)
                  ?.label || "Mi Oración",
            });
          } else {
            // Mobile fallback: download the image automatically
            const link = document.createElement("a");
            link.download = `oracion-${timestamp}.png`;
            link.href = dataUrl;
            link.click();

            // Then share text to allow user to attach the downloaded image
            setTimeout(() => {
              navigator
                .share({
                  title: "Mi Oración",
                  text: `${
                    PRAYER_INTENTS.find(
                      (i) => i.key === generatedPrayer.intentTag
                    )?.label || "Mi Oración"
                  }\n\nHe descargado la imagen, adjúntala desde tu galería.`,
                })
                .catch(() => {});
            }, 500);
          }
        } catch (shareError: any) {
          if (shareError.name !== "AbortError") {
            // Fallback: download
            const link = document.createElement("a");
            link.download = "oracion.png";
            link.href = dataUrl;
            link.click();
          }
        }
      } else {
        // Desktop fallback: download the image
        const link = document.createElement("a");
        link.download = "oracion.png";
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Error sharing prayer:", error);
      // Fallback to text sharing
      if (navigator.share) {
        navigator.share({
          title: "Mi Oración",
          text: generatedPrayer.prayer,
        });
      } else {
        navigator.clipboard.writeText(generatedPrayer.prayer);
        alert("Oración copiada al portapapeles");
      }
    }
  };

  const handleReset = () => {
    setGeneratedPrayer(null);
    setSelectedIntent("");
    setUserContext("");
    if (audioElement) {
      audioElement.pause();
      audioElement.src = "";
      setAudioElement(null);
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    setIsPlayingAudio(false);
  };

  const handleTextToSpeech = async () => {
    if (!generatedPrayer) return;

    // Si ya hay audio cargado, solo reproducir/pausar
    if (audioElement) {
      if (isPlayingAudio) {
        audioElement.pause();
        setIsPlayingAudio(false);
      } else {
        await audioElement.play();
        setIsPlayingAudio(true);
      }
      return;
    }

    // Generar nuevo audio
    setIsLoadingAudio(true);

    try {
      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: generatedPrayer.prayer,
          personaKey: generatedPrayer.personaKey,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar audio");
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);

      const audio = new Audio(url);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onpause = () => setIsPlayingAudio(false);
      audio.onplay = () => setIsPlayingAudio(true);

      setAudioElement(audio);
      await audio.play();
      setIsPlayingAudio(true);
    } catch (err) {
      console.error("Error playing audio:", err);
      alert("Error al reproducir audio");
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Orar Conmigo</h1>
          </div>
          <Button variant="ghost" onClick={() => router.push("/")}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {!generatedPrayer ? (
          <div className="space-y-6">
            {/* Welcome */}
            <Card>
              <CardHeader>
                <CardTitle>Genera una oración personalizada</CardTitle>
                <CardDescription>
                  Selecciona tu intención y deja que la oración se adapte a tus
                  necesidades espirituales
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Persona Selector */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Estilo de oración</CardTitle>
              </CardHeader>
              <CardContent>
                <SaintPicker
                  value={personaKey}
                  onValueChange={setPersonaKey}
                  label=""
                />
              </CardContent>
            </Card>

            {/* Intent Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Intención de oración
                </CardTitle>
                <CardDescription>
                  Selecciona el propósito de tu oración
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {PRAYER_INTENTS.map((intent) => (
                    <Badge
                      key={intent.key}
                      variant={
                        selectedIntent === intent.key ? "default" : "outline"
                      }
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => setSelectedIntent(intent.key)}
                    >
                      {intent.label}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Optional Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Contexto adicional (opcional)
                </CardTitle>
                <CardDescription>
                  Comparte más detalles sobre tu situación si lo deseas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                  placeholder="Ej: Estoy pasando por un momento difícil en mi familia..."
                  className="min-h-[100px]"
                  disabled={loading}
                />
              </CardContent>
            </Card>

            {/* Error */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {/* Generate Button */}
            <Button
              onClick={handleGeneratePrayer}
              disabled={loading || !selectedIntent}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando oración...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-5 w-5" />
                  Generar Oración
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Generated Prayer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Tu Oración</CardTitle>
                  <Badge variant="secondary">
                    {
                      PRAYER_INTENTS.find(
                        (i) => i.key === generatedPrayer.intentTag
                      )?.label
                    }
                  </Badge>
                </div>
                <CardDescription>
                  {personaKey === "augustin"
                    ? "Al estilo de San Agustín"
                    : personaKey === "teresa_avila"
                    ? "Al estilo de Santa Teresa de Ávila"
                    : "Al estilo de San Francisco de Asís"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <p
                    className={`whitespace-pre-wrap text-base leading-relaxed transition-colors duration-300 ${
                      isPlayingAudio ? "text-primary" : ""
                    }`}
                  >
                    {generatedPrayer.prayer}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                variant="default"
                className="w-full"
                onClick={handleTextToSpeech}
                disabled={isLoadingAudio}
              >
                {isLoadingAudio ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cargando audio...
                  </>
                ) : isPlayingAudio ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Volume2 className="mr-2 h-4 w-4" />
                    {audioElement ? "Continuar" : "Escuchar Oración"}
                  </>
                )}
              </Button>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSavePrayer}
                >
                  <Bookmark className="mr-2 h-4 w-4" />
                  Guardar en Diario
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSharePrayer}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleReset}
                >
                  Nueva Oración
                </Button>
              </div>
            </div>

            {/* Guided Prayer Section */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Rezar Juntos</CardTitle>
                <CardDescription>
                  Tómate un momento para rezar esta oración con calma y devoción
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary">1.</span>
                    <p>Busca un lugar tranquilo y cómodo</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary">2.</span>
                    <p>Respira profundamente y aquieta tu mente</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary">3.</span>
                    <p>Lee la oración con atención y devoción</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-primary">4.</span>
                    <p>Permanece en silencio y escucha tu corazón</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
