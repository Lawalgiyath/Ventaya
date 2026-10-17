
"use client";

import { useState, useEffect, useRef } from 'react';
import { BookHeart, Loader2, Sparkles, Wand2, Mic, MicOff, Goal, GitBranch, MessageSquare, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { JournalAnalysisOutput } from '@/ai/flows/journal-analysis-flow';
import { aiAnalyzeJournal, aiReframeWorry } from '@/app/actions/ai';
import { useAi } from '@/hooks/use-ai';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';

const prompts = [
    "What's on your mind today?",
    "Describe a feeling you're currently experiencing.",
    "What is one thing you're grateful for right now?",
    "What's a small victory you can celebrate today?",
    "Write about a challenge you're facing and one small step you can take to address it.",
    "What does your ideal day look like? Describe it.",
];

export default function Journal() {
  const [entry, setEntry] = useState('');
  const [analysis, setAnalysis] = useState<JournalAnalysisOutput | null>(null);
  const [reframedThought, setReframedThought] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [placeholder, setPlaceholder] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { addAchievement, addInteraction, interactions, goals, moods } = useApp();
  const { run } = useAi();

  useEffect(() => {
    setPlaceholder(prompts[Math.floor(Math.random() * prompts.length)]);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let final_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
          }
        }
        if (final_transcript) {
          setEntry(prev => (prev ? prev + ' ' : '') + final_transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please enable microphone permissions in your browser settings to use voice input.',
            });
        }
        setIsListening(false);
      };
      
      recognition.onend = () => {
          setIsListening(false);
      }
      
      recognitionRef.current = recognition;
    } else {
        setIsSpeechSupported(false);
    }

    return () => {
        recognitionRef.current?.abort();
    };
  }, [toast]);
  
  const handleToggleListening = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current?.start();
    } catch (err: any) {
        console.error('Error getting user media', err);
        const description = err.name === 'NotFoundError' 
            ? 'No microphone was found on your device. Please connect a microphone and try again.'
            : 'Could not access the microphone. Please check your browser permissions.';
        
        toast({
            variant: 'destructive',
            title: 'Microphone Access Required',
            description,
        });
    }
  };

  const handleAnalyzeEntry = async () => {
    if (entry.trim().length < 20) {
      toast({
        variant: 'destructive',
        title: 'Please write a bit more.',
        description: 'For a short worry, please write at least 20 characters. For a deeper analysis, please write at least 100 characters.',
      });
      return;
    }
    
    addAchievement('firstJournal');

    if (entry.trim().length >= 20 && entry.trim().length < 100) {
        addAchievement('worryJarUse');
        handleWorrySubmit();
        return;
    }
      
    if (entry.trim().length >= 100) {
      handleFullAnalysis();
    }
  };

  const handleFullAnalysis = async () => {
    setLoading(true);
    setAnalysis(null);
    setReframedThought('');

    try {
      const recentInteractions = interactions
        .filter(i => i.type === 'Journal' || i.type === 'Worry Jar')
        .slice(0, 5) // Get last 5 relevant interactions
        .map(i => ({
            entry: i.data.request?.journalEntry || i.data.request?.worry || '',
            response: i.content,
        }));

      const result = await run(aiAnalyzeJournal, {
        journalEntry: entry,
        previousInteractions: recentInteractions,
        userGoals: goals.filter(g => !g.completed).map(g => g.text),
        currentMood: moods.length > 0 ? moods[moods.length - 1].mood : undefined
      });
      // null means the call was refused (quota or plan) and the upgrade
      // dialog is already open.
      if (!result) return;

      setAnalysis(result);
      addInteraction({
        id: `journal-${Date.now()}`,
        type: 'Journal',
        title: 'Journal Entry Analysis',
        content: result.summary,
        timestamp: new Date().toISOString(),
        data: { request: { journalEntry: entry }, response: result },
      });
    } catch (error) {
      console.error('Failed to analyze journal entry:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: 'Could not get a response from Aya. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleWorrySubmit = async () => {
    setLoading(true);
    setAnalysis(null);
    setReframedThought('');
    try {
      const result = await run(aiReframeWorry, { worry: entry });
      if (!result) return;
      setReframedThought(result.reframedThought);
       addInteraction({
        id: `worry-${Date.now()}`,
        type: 'Worry Jar',
        title: 'Worry Reframed',
        content: result.reframedThought,
        timestamp: new Date().toISOString(),
        data: { request: { worry: entry }, response: result },
      });
    } catch (error) {
       console.error('Failed to get reframed thought:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: 'Could not get a response from Aya. Please try again.',
      });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                <BookHeart className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle>Journal with Aya</CardTitle>
                <CardDescription>
                Share a short worry or a long reflection to get a supportive perspective.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isSpeechSupported && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Voice Input Not Supported</AlertTitle>
                <AlertDescription>
                    Your browser may not support the Web Speech API. If you experience issues, please type your entries manually.
                </AlertDescription>
            </Alert>
        )}
        <div>
            <div className="relative">
                <Textarea
                    placeholder={placeholder}
                    value={entry}
                    onChange={(e) => setEntry(e.target.value)}
                    rows={10}
                    disabled={loading}
                    className="text-base pr-12"
                />
                 {isSpeechSupported && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleToggleListening}
                        className={cn('absolute top-3 right-3 text-muted-foreground', isListening && 'text-destructive')}
                        >
                        {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                        <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
                    </Button>
                 )}
            </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAnalyzeEntry} disabled={loading || !entry.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aya is thinking...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Submit to Aya
              </>
            )}
          </Button>
        </div>

        {reframedThought && (
            <Alert className="bg-secondary border-secondary-foreground/20 animate-in fade-in-50">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle className="font-headline">A Calmer Thought from Aya</AlertTitle>
              <AlertDescription className="mt-2 text-lg text-foreground">
                <p>{reframedThought}</p>
              </AlertDescription>
            </Alert>
        )}

        {analysis && (
            <Alert className="bg-secondary border-secondary-foreground/20 animate-in fade-in-50">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle className="font-headline">Aya's Thoughts</AlertTitle>
              <AlertDescription className="mt-4 space-y-4 text-foreground">
                <div className="p-4 rounded-md bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />Summary of your entry:</h3>
                  <p className="text-sm mt-1">{analysis.summary}</p>
                </div>
                <div className="p-4 rounded-md bg-background/50">
                  <h3 className="font-semibold flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />A reflection to consider:</h3>
                   <p className="text-sm mt-1">{analysis.reflection}</p>
                </div>
                {analysis.patternInsight && (
                  <div className="p-4 rounded-md bg-background/50 border border-primary/20">
                    <h3 className="font-semibold flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" />A pattern Aya noticed:</h3>
                    <p className="text-sm mt-1">{analysis.patternInsight}</p>
                  </div>
                )}
                {analysis.goalConnection && (
                  <div className="p-4 rounded-md bg-background/50 border border-primary/20">
                    <h3 className="font-semibold flex items-center gap-2"><Goal className="h-4 w-4 text-primary" />Connecting to your goals:</h3>
                    <p className="text-sm mt-1">{analysis.goalConnection}</p>
                  </div>
                )}
              </AlertDescription>
            </Alert>
        )}
      </CardContent>
    </Card>
  );
}
