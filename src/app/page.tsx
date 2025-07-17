import { Globe } from "lucide-react";
import Translator from "@/components/translator";

export default function Home() {
  return (
    <main className="min-h-screen container mx-auto px-4 py-8 md:py-12">
      <header className="flex flex-col items-center text-center mb-12">
        <div className="p-4 bg-primary/10 rounded-full mb-4">
          <Globe className="h-10 w-10 text-primary" />
        </div>
        <h1 className="font-headline text-4xl md:text-6xl font-bold text-primary tracking-tighter">
          LinguaLens
        </h1>
        <p className="mt-2 text-lg md:text-xl text-muted-foreground max-w-2xl">
          Your AI-powered companion for instant text translation, definition, and pronunciation. Break language barriers with a single snap or upload.
        </p>
      </header>
      <Translator />
    </main>
  );
}
