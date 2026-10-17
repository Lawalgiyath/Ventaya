
"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Sparkles, Wand2, Edit, FileText } from 'lucide-react';
import { aiAssessment } from '@/app/actions/ai';
import { useAi } from '@/hooks/use-ai';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from './ui/textarea';
import { addDays, formatDistanceToNow, isBefore } from 'date-fns';

const assessmentSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string(),
      answer: z.string().min(10, 'Please provide a more detailed answer (at least 10 characters).'),
    })
  ),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

const initialQuestions = [
  { 
    question: 'Over the last two weeks, how have you been feeling in general? Describe your overall mood and energy levels.',
    placeholder: 'e.g., I\'ve been feeling quite down and tired most days...'
  },
  { 
    question: 'Think about your sleep recently. Are you having any trouble falling asleep, staying asleep, or are you sleeping too much?',
    placeholder: 'e.g., I find it hard to switch off my brain at night...'
  },
  { 
    question: 'In the past two weeks, have you felt nervous, anxious, or on edge? Describe what that feels like for you.',
    placeholder: 'e.g., I get a knot in my stomach when I think about work...'
  },
  { 
    question: 'How connected have you felt to other people (like friends, family, or your community) lately?',
    placeholder: 'e.g., I feel a bit distant from everyone right now...'
  },
];


export default function Assessment() {
  const { toast } = useToast();
  const { setAssessmentResult, assessmentResult, assessmentTimestamp, addAchievement, addInteraction } = useApp();
  const { run } = useAi();
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const form = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      questions: initialQuestions.map((q) => ({ question: q.question, answer: '' })),
    },
  });

  const { fields } = useFieldArray({
    name: 'questions',
    control: form.control,
  });
  
  const isAssessmentLocked = () => {
    if (!assessmentTimestamp) return false;
    const sevenDaysFromLastAssessment = addDays(new Date(assessmentTimestamp), 7);
    return isBefore(new Date(), sevenDaysFromLastAssessment);
  }

  async function onSubmit(data: AssessmentFormValues) {
    setLoading(true);
    try {
      const result = await run(aiAssessment, {
        answers: data.questions.map(q => ({ question: q.question, answer: q.answer })),
      });
      if (!result) return;
      setAssessmentResult(result); // This will also set timestamp
      addAchievement('assessmentComplete');
      addInteraction({
        id: `assessment-${Date.now()}`,
        type: 'Assessment',
        title: 'Completed Mental Health Assessment',
        content: result.insights,
        timestamp: new Date().toISOString(),
        data: result,
      });
      toast({
        title: 'Assessment Complete!',
        description: 'Your new personalized insights are ready.',
      });
      setShowForm(false);
    } catch (error) {
      console.error('Assessment failed:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: 'There was a problem with your assessment. Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleRetake = () => {
      setShowForm(true);
  }
  
  const renderAssessmentForm = () => (
     <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 animate-in fade-in-50">
            {fields.map((field, index) => (
            <FormField
                key={field.id}
                control={form.control}
                name={`questions.${index}.answer`}
                render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel className="text-base">{initialQuestions[index].question}</FormLabel>
                    <FormControl>
                    <Textarea 
                        placeholder={initialQuestions[index].placeholder}
                        rows={4}
                        className="resize-y"
                        {...field}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            ))}
            <div className='flex items-center gap-4'>
                <Button type="submit" disabled={loading} size="lg">
                {loading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Your Responses...
                    </>
                ) : (
                    <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Get My Personalized Insights
                    </>
                )}
                </Button>
                {assessmentResult && (
                    <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
                )}
            </div>
        </form>
    </Form>
  )

  const renderAssessmentResult = () => (
    <div className="space-y-6 animate-in fade-in-50">
        <Alert className="bg-secondary border-secondary-foreground/20">
        <Sparkles className="h-4 w-4 text-primary" />
        <AlertTitle className="font-headline">Your Latest Assessment Results</AlertTitle>
        <AlertDescription className="space-y-4 mt-2">
            <div>
                <h3 className="font-semibold text-foreground">Insights from Aya</h3>
                <p>{assessmentResult!.insights}</p>
            </div>
            <div>
                <h3 className="font-semibold text-foreground">Recommendations</h3>
                <p>{assessmentResult!.recommendations}</p>
            </div>
        </AlertDescription>
        </Alert>

        <Card className="border-dashed bg-secondary/50 border-muted-foreground/20">
            <CardHeader>
                <CardTitle className="text-base">Ready for a new check-in?</CardTitle>
            </CardHeader>
             <CardContent>
                { isAssessmentLocked() ? (
                    <p className='text-sm text-muted-foreground mb-4'>
                        Your next weekly assessment will be available in {' '}
                        <span className="font-bold text-primary">
                             {formatDistanceToNow(addDays(new Date(assessmentTimestamp!), 7), { addSuffix: true })}.
                        </span>
                        You can retake it early if you wish.
                    </p>
                ) : (
                    <p className='text-sm text-muted-foreground mb-4'>It's time for your weekly check-in, but you can review your previous results here.</p>
                )
                }
                <Button variant="secondary" size="sm" onClick={handleRetake}>
                    <Edit className='mr-2 h-4 w-4'/>
                    {isAssessmentLocked() ? 'Retake Assessment Early' : 'Start Weekly Assessment'}
                </Button>
            </CardContent>
        </Card>
    </div>
  )

  return (
    <Card>
      <CardHeader>
         <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
                <CardTitle>Your Weekly Check-in</CardTitle>
                <CardDescription>
                Answer a few questions each week to track your progress and get personalized insights from Aya.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Aya is analyzing your responses... This may take a moment.</p>
          </div>
        )}

        {!loading && (showForm || !assessmentResult) ? (
            renderAssessmentForm()
        ) : (
            renderAssessmentResult()
        )}
      </CardContent>
    </Card>
  );
}
