
"use client";

import { useState, useRef, ChangeEvent, useEffect } from "react";
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
  Mic,
  X,
  Aperture,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { translateText } from "@/ai/flows/translate-text";
import { defineMeaning } from "@/ai/flows/define-meaning";
import { pronounceText } from "@/ai/flows/pronounce-text";
import { extractTextFromImage } from "@/ai/flows/extract-text-from-image";
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
  const [pronunciation, setPronunciation] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDefining, setIsDefining] = useState(false);
  const [isPronouncing, setIsPronouncing] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Stop camera stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    if (hasCameraPermission) {
      setIsCameraOpen(true);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setHasCameraPermission(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setHasCameraPermission(false);
      toast({
        variant: "destructive",
        title: "Camera Access Denied",
        description: "Please enable camera permissions in your browser settings to use this app.",
      });
    }
  };
  
  const closeCamera = () => {
    setIsCameraOpen(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };
  
  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext("2d");
      if(context){
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUri = canvas.toDataURL("image/jpeg");
        processDataUri(dataUri);
      }
      closeCamera();
    }
  };

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
    setPronunciation(null);

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
  
  const handlePronunciation = async () => {
    if (!translation) return;
    setIsPronouncing(true);
    setPronunciation(null);
    try {
      const result = await pronounceText({ text: translation, language: targetLanguage });
      setPronunciation(result.pronunciation);
    } catch (error) {
      console.error(error);
      toast({
        title: "Pronunciation Failed",
        description: "Could not get the pronunciation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsPronouncing(false);
    }
  };

  const handleListen = () => {
    if (!translation || typeof window === "undefined") return;
    const utterance = new SpeechSynthesisUtterance(translation);
    // This is a simple mapping, a more robust solution would be needed for all languages
    const langCodeMap: { [key: string]: string } = {
        'Spanish': 'es-ES',
        'French': 'fr-FR',
        'German': 'de-DE',
        'Japanese': 'ja-JP',
        'Mandarin Chinese': 'zh-CN',
        'Italian': 'it-IT',
        'Korean': 'ko-KR',
        'Russian': 'ru-RU',
        'Arabic': 'ar-SA',
        'Portuguese': 'pt-BR',
        'Hindi': 'hi-IN',
        'Bengali': 'bn-IN',
        'Tamil': 'ta-IN',
        'Telugu': 'te-IN',
        'Marathi': 'mr-IN',
    };
    utterance.lang = langCodeMap[targetLanguage] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };
  
  const processDataUri = async (dataUri: string) => {
    setIsProcessing(true);
    setInputText("Extracting text from image...");
    try {
      // Fallback for images without a specified mimeType
      const imageDataUri = dataUri.startsWith('data:')
        ? dataUri
        : `data:image/jpeg;base64,${dataUri}`;
      const result = await extractTextFromImage({ imageDataUri });
      setInputText(result.extractedText);
    } catch (error) {
      console.error("Error extracting text from image", error);
      toast({
        title: "Text Extraction Failed",
        description: "Could not extract text from the image. Please try a different image.",
        variant: "destructive",
      });
      setInputText("");
    } finally {
      setIsProcessing(false);
    }
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUri = e.target?.result as string;
          processDataUri(dataUri);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload an image file (e.g., PNG, JPG).",
          variant: "destructive",
        });
      }
    }
  };

  const handleHistorySelect = (entry: TranslationEntry) => {
    setInputText(entry.originalText);
    setTargetLanguage(entry.language);
    setTranslation(entry.translatedText);
    setMeaning(null);
    setPronunciation(null);
  };

  const isBusy = isTranslating || isProcessing;

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
      <div className="flex flex-col gap-8">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Your Text</CardTitle>
            <CardDescription>
              Enter text, upload an image, or scan with your camera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <Textarea
                placeholder="Type or paste your text here..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="h-36 resize-none"
                disabled={isBusy}
              />
              <LanguageSelector
                value={targetLanguage}
                onChange={setTargetLanguage}
                disabled={isBusy}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                >
                  <Upload className="mr-2" />
                  Upload Image
                </Button>
                <Button
                  variant="outline"
                  onClick={requestCameraPermission}
                  disabled={isBusy}
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
              disabled={isBusy || !inputText.trim()}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin mr-2" />
              ) : isTranslating ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <ArrowRight className="mr-2" />
              )}
              {isProcessing ? "Processing..." : "Translate"}
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

          {isPronouncing ? (
            <div className="space-y-4 pt-4 border-t">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : pronunciation ? (
            <div className="space-y-2 pt-4 border-t">
              <h3 className="font-bold text-primary">Pronunciation</h3>
              <p className="text-base font-mono leading-relaxed whitespace-pre-wrap">{pronunciation}</p>
            </div>
          ) : null}

          {isDefining ? (
             <div className="space-y-4 pt-4 border-t">
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
            onClick={handleListen}
            disabled={!translation || isBusy}
            className="w-full sm:w-auto"
          >
            <Volume2 className="mr-2" />
            Listen
          </Button>
          <Button
            variant="outline"
            onClick={handlePronunciation}
            disabled={!translation || isBusy || isPronouncing}
            className="w-full sm:w-auto"
          >
            {isPronouncing ? (
              <Loader2 className="animate-spin mr-2" />
            ) : (
              <Mic className="mr-2" />
            )}
            Pronunciation
          </Button>
          <Button
            onClick={handleDefine}
            disabled={!translation || isBusy || isDefining}
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

    <Dialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Scan Text with Camera</DialogTitle>
        </DialogHeader>
        <div className="relative">
            <video ref={videoRef} className="w-full aspect-video rounded-md" autoPlay muted playsInline />
            {hasCameraPermission === false && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
                <Alert variant="destructive" className="w-auto">
                    <AlertTitle>Camera Access Denied</AlertTitle>
                    <AlertDescription>
                        Please allow camera access in your browser to use this feature.
                    </AlertDescription>
                </Alert>
                </div>
            )}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Button size="icon" className="w-16 h-16 rounded-full" onClick={handleCapture} disabled={hasCameraPermission !== true}>
                    <Aperture className="w-8 h-8"/>
                    <span className="sr-only">Capture</span>
                </Button>
            </div>
             <Button size="icon" variant="ghost" className="absolute top-4 right-4 rounded-full" onClick={closeCamera}>
                <X />
                <span className="sr-only">Close Camera</span>
            </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );

    