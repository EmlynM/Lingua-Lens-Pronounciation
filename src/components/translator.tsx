"use client";

import { useState, useRef, ChangeEvent } from "react";
import {
  ArrowRight,
  BookText,
  Camera,
  History,
  Loader2,
  Trash2,
  Upload,
  Volume2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { translateText } from "@/ai/flows/translate-text";
import { defineMeaning } from "@/ai/flows/define-meaning";
import { LanguageSelector } from "./language-selector";
import { useHistory } from "@/hooks/use-history";
import type { TranslationEntry } from "@/types";
import { ScrollArea } from "./ui/scroll-area";
import { Skeleton } from "./ui/skeleton";

export default function Translator() {
  const { toast } = useToast();
  const { history, addEntry, clearHistory, isLoaded } = useHistory();

  const [inputText, setInputText] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("Spanish");
  const [translation, setTranslation] = useState<string | null>(null);
  const [meaning, setMeaning] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDefining, setIsDefining] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleTranslate = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to translate.",
        variant: "destructive",
      });
      return;
    }
    setIsTranslating(true);
    setTranslation(null);
    setMeaning(null);

    try {
      const result = await translateText({ text: inputText, targetLanguage });
      setTranslation(result.translation);
      addEntry({
        originalText: inputText,
        translatedText: result.translation,
        language: targetLanguage,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Translation Failed",
        description:
          "Could not translate the text. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDefine = async () => {
    if (!translation) return;
    setIsDefining(true);
    setMeaning(null);
    try {
      const result = await defineMeaning({ text: translation });
      setMeaning(result.meaning);
    } catch (error) {
      console.error(error);
      toast({
        title: "Definition Failed",
        description:
          "Could not define the meaning of the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDefining(false);
    }
  };

  const handlePronounce = () => {
    if (!translation || typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = "en-US"; // This could be dynamically set based on target language if more voices are supported
    window.speechSynthesis.speak(utterance);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setInputText(e.target?.result as string);
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a .txt file.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleCameraScan = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if(file) {
        toast({
            title: "Scan Successful (Demo)",
            description: "In a real app, the text from this image would be extracted via OCR and placed here. For now, please type your text.",
        });
    }
  }

  const handleHistorySelect = (entry: TranslationEntry) => {
    setInputText(entry.originalText);
    setTargetLanguage(entry.language);
    setTranslation(entry.translatedText);
    setMeaning(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Text</CardTitle>
            <CardDescription>
              Enter text, upload a file, or scan with your camera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Textarea
                placeholder="Type or paste your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="h-36 resize-none"
                disabled={isTranslating}
              />
              <LanguageSelector
                value={targetLanguage}
                onChange={setTargetLanguage}
                disabled={isTranslating}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".txt"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTranslating}
                >
                  <Upload className="mr-2" />
                  Upload .txt
                </Button>
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleCameraScan}
                  className="hidden"
                  accept="image/*"
                  capture="environment"
                />
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isTranslating}
                >
                  <Camera className="mr-2" />
                  Scan Text
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleTranslate}
              disabled={isTranslating || !inputText.trim()}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isTranslating ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <ArrowRight className="mr-2" />
              )}
              Translate
            </Button>
          </CardFooter>
        </Card>

        <Accordion type="single" collapsible>
          <AccordionItem value="history">
            <AccordionTrigger className="text-xl font-headline">
              <History className="mr-2 text-primary" /> Translation History
            </AccordionTrigger>
            <AccordionContent>
              <Card>
                <CardContent className="p-0">
                  {isLoaded && history.length > 0 ? (
                    <>
                    <ScrollArea className="h-64">
                      <div className="p-4 space-y-4">
                        {history.map((entry) => (
                          <div
                            key={entry.id}
                            className="p-3 rounded-lg border hover:bg-secondary cursor-pointer transition-colors"
                            onClick={() => handleHistorySelect(entry)}
                          >
                            <p className="font-semibold truncate text-sm text-primary">
                              {entry.originalText}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(entry.timestamp).toLocaleString()} &bull; {entry.language}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                    <CardFooter className="p-2 border-t">
                         <Button variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={clearHistory}>
                            <Trash2 className="mr-2" /> Clear History
                        </Button>
                    </CardFooter>
                    </>
                  ) : (
                    <div className="p-6 text-center text-muted-foreground">
                      {isLoaded ? "Your translation history is empty." : "Loading history..."}
                    </div>
                  )}
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Result</CardTitle>
          <CardDescription>
            Your translated text and its meaning will appear here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 min-h-[300px]">
          {isTranslating ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : translation ? (
            <div className="space-y-2">
              <h3 className="font-bold text-primary">Translation</h3>
              <p className="text-lg leading-relaxed">{translation}</p>
            </div>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                <FileText className="h-12 w-12 mb-4" />
                <p>Your translation will be displayed here.</p>
            </div>
          )}

          {isDefining ? (
             <div className="space-y-4 pt-4">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          ) : meaning ? (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-bold text-primary">Context & Meaning</h3>
              <p className="text-base leading-relaxed whitespace-pre-wrap">{meaning}</p>
            </div>
          ) : null}
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handlePronounce}
            disabled={!translation || isTranslating}
            className="w-full sm:w-auto"
          >
            <Volume2 className="mr-2" />
            Listen
          </Button>
          <Button
            onClick={handleDefine}
            disabled={!translation || isTranslating || isDefining}
            className="w-full sm:w-auto"
          >
            {isDefining ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <BookText className="mr-2" />
            )}
            Define Meaning
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
