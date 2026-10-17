
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bot, Utensils, Calendar, Loader2, Sparkles, Wand2, Mic, MicOff, Check, Edit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { DailyPlannerOutput } from '@/ai/flows/daily-planner-flow';
import { aiPlanDay, aiCorrectText } from '@/app/actions/ai';
import { useAi } from '@/hooks/use-ai';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/app-context';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

const plannerSchema = z.object({
  activities: z.string().min(10, 'Please describe your day in a bit more detail.'),
  mealTarget: z.string().min(3, 'Please specify a meal target.'),
  dietaryRestrictions: z.string().optional(),
});

type PlannerFormValues = z.infer<typeof plannerSchema>;

type ActiveField = 'activities' | 'mealTarget' | 'dietaryRestrictions';

export default function AiCoach() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const activeFieldRef = useRef<ActiveField>('activities');
  
  const { addInteraction, dailyPlan, setDailyPlan } = useApp();
  const { run } = useAi();

  const form = useForm<PlannerFormValues>({
    resolver: zodResolver(plannerSchema),
    defaultValues: {
      activities: '',
      mealTarget: '',
      dietaryRestrictions: '',
    },
  });

  const { setValue, getValues, setFocus } = form;

  const handleTextCorrection = useCallback(async (field: ActiveField) => {
    const text = getValues(field);
    if (!text || !text.trim()) return;

    setIsCorrecting(true);
    try {
      const response = await aiCorrectText({ rawText: text });
      if (response.ok) {
        setValue(field, response.data.correctedText, { shouldValidate: true });
      }
    } catch (error) {
      console.error('Text correction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Correction Failed',
        description: 'Could not polish the transcribed text. Please review it manually.',
      });
    } finally {
      setIsCorrecting(false);
    }
  }, [getValues, setValue, toast]);

  const handleToggleListening = useCallback(async (field: ActiveField) => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    
    if (!recognitionRef.current) {
        toast({
            variant: 'destructive',
            title: 'Browser Not Supported',
            description: 'Your browser does not support voice recognition.',
        });
        return;
    }

    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        activeFieldRef.current = field;
        setFocus(field);
        
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
  }, [setFocus, toast, isListening]);

  useEffect(() => {
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
            const currentField = activeFieldRef.current;
            const currentValue = getValues(currentField);
            setValue(currentField, (currentValue ? currentValue + ' ' : '') + final_transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech' || event.error === 'audio-capture') {
            // These errors often happen on mobile when the mic times out.
            // We can ignore them and just let the `onend` handle `setIsListening(false)`.
            return;
        }
        console.error('Speech recognition error', event.error);
         if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast({
                variant: 'destructive',
                title: 'Microphone Access Denied',
                description: 'Please enable microphone permissions in your browser settings to use voice input.',
            });
        }
      };
      
      recognition.onend = () => {
          setIsListening(false);
          handleTextCorrection(activeFieldRef.current);
      };
      
      recognitionRef.current = recognition;

    } else {
        setIsSpeechSupported(false);
    }
    
    return () => {
        recognitionRef.current?.abort();
    };

  }, [setValue, toast, getValues, handleTextCorrection]);

  async function onSubmit(data: PlannerFormValues) {
    setLoading(true);
    setDailyPlan(null);
    try {
      const plan = await run(aiPlanDay, data);
      if (!plan) return;
      addInteraction({
        id: `plan-${Date.now()}`,
        type: 'Planner',
        title: 'Daily Plan Generated',
        content: `Plan for: ${data.activities.substring(0, 50)}...`,
        timestamp: new Date().toISOString(),
        data: { request: data, response: plan },
      });
      setDailyPlan(plan);

    } catch (error) {
      console.error('Failed to generate plan:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: 'Could not get a response from Aya. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  }

  const MicButton = ({ field, isTextarea = false }: { field: ActiveField, isTextarea?: boolean }) => {
    if (!isSpeechSupported) return null;

    return (
     <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => handleToggleListening(field)}
        className={cn('absolute right-2 z-10', isTextarea ? 'top-2' : 'top-1/2 -translate-y-1/2', isListening && activeFieldRef.current === field && 'text-destructive')}
        disabled={isCorrecting}
      >
        {isCorrecting && activeFieldRef.current === field ? <Loader2 className="h-5 w-5 animate-spin" /> : (isListening && activeFieldRef.current === field ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />)}
        <span className="sr-only">{isListening ? 'Stop listening' : 'Start listening'}</span>
      </Button>
    )
  }
  
  const renderPlan = (plan: DailyPlannerOutput) => (
    <div className="mt-8 animate-in fade-in-50 space-y-6">
        <Alert className="bg-green-50 border-green-200 text-green-800">
            <Sparkles className="h-4 w-4 text-green-600" />
            <AlertTitle className="font-headline text-green-900">Your Personalized Plan is Ready</AlertTitle>
            <AlertDescription>
                Here is a structured plan Aya created to help you have a productive and healthy day.
            </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Daily Plan */}
            <Card className="lg:col-span-3">
                    <CardHeader>
                    <CardTitle className='flex items-center gap-3'>
                        <Calendar className="h-6 w-6 text-primary" />
                        Daily Schedule
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {plan.dailyPlan.map((item, index) => (
                            <div key={index} className="flex items-start gap-4 p-3 rounded-lg border bg-background/50 relative">
                                <div className="absolute top-4 left-4 h-full border-l-2 border-primary/20"></div>
                                <div className="z-10 h-6 w-6 rounded-full bg-background flex items-center justify-center border-2 border-primary/30 mt-1">
                                    {item.isMeal ? <Utensils className="h-4 w-4 text-primary/80"/> : <Check className="h-4 w-4 text-primary"/>}
                                </div>
                                <div className='flex-1'>
                                    <p className="font-mono text-sm text-primary">{item.time}</p>
                                    <p className="font-medium text-foreground">{item.activity}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Meal Plan */}
            <div className="lg:col-span-2 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center gap-3'>
                            <Utensils className="h-6 w-6 text-primary" />
                            Meal Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-foreground">Breakfast</h4>
                            <p className="text-muted-foreground">{plan.mealPlan.breakfast}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Lunch</h4>
                            <p className="text-muted-foreground">{plan.mealPlan.lunch}</p>

                        </div>
                        <div>
                            <h4 className="font-semibold text-foreground">Dinner</h4>
                            <p className="text-muted-foreground">{plan.mealPlan.dinner}</p>
                        </div>
                    </CardContent>
                </Card>
                    <Card className='border-dashed bg-secondary/50 border-muted-foreground/20'>
                    <CardHeader>
                        <CardTitle className='text-base'>Edit Your Plan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className='text-sm text-muted-foreground mb-4'>Need to make a change? You can edit the generated plan by modifying your original input and regenerating it.</p>
                        <Button variant="secondary" size="sm" onClick={() => setDailyPlan(null)}>
                            <Edit className='mr-2 h-4 w-4'/>
                            Edit My Input
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                <Bot className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle>Daily Planner with Aya</CardTitle>
                <CardDescription>
                Let Aya, your personal guide, organize your day and plan your meals for success.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {dailyPlan ? renderPlan(dailyPlan) : (
            <>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {!isSpeechSupported && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Voice Input Not Supported</AlertTitle>
                                <AlertDescription>
                                    Your browser does not support the Web Speech API. Please type your entries manually.
                                </AlertDescription>
                            </Alert>
                        )}
                        <FormField
                        control={form.control}
                        name="activities"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel className="text-base flex items-center justify-between">
                                What's on your schedule today?
                            </FormLabel>
                            <FormControl>
                                <div className="relative">
                                <Textarea
                                    placeholder="e.g., Morning meeting at 10am, finish project report, gym session in the evening..."
                                    rows={5}
                                    {...field}
                                />
                                <MicButton field="activities" isTextarea />
                                </div>
                            </FormControl>
                            <FormDescription>
                                {isSpeechSupported ? "Click the mic to speak. Aya will polish your transcription." : "Describe your tasks for the day."}
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <FormField
                                control={form.control}
                                name="mealTarget"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-base flex items-center justify-between">What's your meal target?
                                    </FormLabel>
                                    <FormControl>
                                    <div className="relative">
                                            <Input 
                                                placeholder="e.g., High protein, low carb, balanced" 
                                                {...field} 
                                            />
                                            <MicButton field="mealTarget" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                                <FormField
                                control={form.control}
                                name="dietaryRestrictions"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel className="text-base flex items-center justify-between">Any dietary restrictions?
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input 
                                                placeholder="e.g., Vegetarian, nut allergy" 
                                                {...field} 
                                            />
                                            <MicButton field="dietaryRestrictions" />
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                    Optional.
                                    </FormDescription>
                                    <FormMessage />
                                    </FormItem>
                                )}
                                />
                        </div>
                        <div className='flex justify-between items-center'>
                            <Button type="submit" disabled={loading || isCorrecting} size="lg">
                            {loading ? (
                                <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Planning Your Day...
                                </>
                            ) : (
                                <>
                                <Wand2 className="mr-2 h-4 w-4" />
                                Generate My Plan
                                </>
                            )}
                            </Button>
                            {isCorrecting && (
                                <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                    <Loader2 className='h-4 w-4 animate-spin' />
                                    Polishing your words...
                                </div>
                            )}
                        </div>
                    </form>
                </Form>
            
                {loading && (
                    <div className="flex flex-col items-center justify-center gap-4 text-center pt-8">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Aya is building your plan...</p>
                    </div>
                )}
            </>
        )}
      </CardContent>
    </Card>
  );
}
