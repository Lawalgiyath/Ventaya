
"use client";

import { useState, useEffect } from 'react';
import { Check, Plus, Trash2, Sparkles, Loader2, BookOpen, Wind, BrainCircuit } from 'lucide-react';
import { useApp } from '@/context/app-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { aiPersonalizedContent } from '@/app/actions/ai';
import { useAi } from '@/hooks/use-ai';
import Link from 'next/link';

export default function WellnessGoals() {
  const { goals, setGoals, assessmentResult, personalizedContent, setPersonalizedContent, addAchievement } = useApp();
  const { run } = useAi();
  const [newGoal, setNewGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      addAchievement('firstGoal');
      setGoals([
        ...goals,
        { id: Date.now().toString(), text: newGoal.trim(), completed: false },
      ]);
      setNewGoal('');
    }
  };

  const toggleGoal = (id: string) => {
    setGoals(
      goals.map((goal) =>
        goal.id === id ? { ...goal, completed: !goal.completed } : goal
      )
    );
  };

  useEffect(() => {
    const completedGoalsCount = goals.filter(g => g.completed).length;
    if (completedGoalsCount >= 5) {
        addAchievement('fiveGoalsDone');
    }
    if (completedGoalsCount >= 10) {
        addAchievement('tenGoalsDone');
    }
  }, [goals, addAchievement]);

  const removeGoal = (id: string) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  const handleGenerateContent = async () => {
    if (!assessmentResult) {
      toast({
        variant: 'destructive',
        title: 'Assessment Required',
        description: 'Please complete the assessment first to get personalized content.',
      });
      return;
    }

    setLoading(true);
    try {
      const result = await run(aiPersonalizedContent, {
        assessmentResults: assessmentResult.insights,
        preferences: goals.map(g => g.text).join(', ') || 'General mental wellness, stress reduction, and mindfulness.',
      });
      if (!result) return;
      // Only credit the achievement once the content actually arrived.
      addAchievement('contentGenerated');
      setPersonalizedContent(result);
    } catch (error) {
      console.error('Failed to generate content:', error);
      toast({
        variant: 'destructive',
        title: 'Oh no! Something went wrong.',
        description: 'Could not generate personalized content. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const completedGoals = goals.filter((goal) => goal.completed).length;
  const progress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Goals & Content</CardTitle>
        <CardDescription>Set wellness goals and get personalized content suggestions from Aya to help you achieve them.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-1">
        <div className="flex w-full items-center space-x-2">
          <Input 
            type="text" 
            placeholder="e.g., Meditate for 5 minutes"
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
          />
          <Button onClick={handleAddGoal}><Plus className="mr-2 h-4 w-4" />Add</Button>
        </div>
        
        <div className="space-y-4">
          {goals.length > 0 && (
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {completedGoals} of {goals.length} goals completed
                </span>
                <span className="text-sm font-medium text-primary">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <div className="space-y-2">
            {goals.length > 0 ? (
              goals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <button onClick={() => toggleGoal(goal.id)} className="flex items-center gap-3 flex-1">
                    <div className={cn("h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center transition-colors", goal.completed && "bg-primary")}>
                      {goal.completed && <Check className="h-4 w-4 text-primary-foreground" />}
                    </div>
                    <span className={cn("text-secondary-foreground", goal.completed && "line-through text-muted-foreground")}>
                      {goal.text}
                    </span>
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeGoal(goal.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No goals set yet. Add one to get started!</p>
            )}
          </div>
        </div>

        <div className="border-t pt-6">
            <CardHeader className="p-0 mb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                <Sparkles className="text-primary h-5 w-5" />{' '}
                Your Content Plan from Aya
                </CardTitle>
                <CardDescription>
                Suggestions based on your assessment, goals, and mood.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                {!assessmentResult ? (
                    <div className="text-center text-muted-foreground p-8 bg-secondary rounded-lg">
                        <p>Complete the assessment to unlock your personalized content plan.</p>
                    </div>
                ) : loading ? (
                     <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="ml-4 text-muted-foreground">Generating your plan...</p>
                    </div>
                ) : !personalizedContent ? (
                    <div className="text-center">
                        <Button onClick={handleGenerateContent} disabled={loading}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate My Content Plan
                        </Button>
                    </div>
                ) : (
                     <div className="space-y-4">
                        <div className="p-4 rounded-lg border">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><BookOpen className="text-primary h-5 w-5"/> Articles For You</h3>
                            <ul className="space-y-3">
                                {personalizedContent.articles.map((article, i) => (
                                    <li key={i}>
                                        <Link href={`/article/${encodeURIComponent(article)}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                                            <div className="p-2 bg-secondary rounded-full"><BookOpen className="h-4 w-4 text-secondary-foreground" /></div>
                                            <p className="font-medium text-sm flex-1">{article}</p>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="p-4 rounded-lg border">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><Wind className="text-primary h-5 w-5"/> Suggested Meditations</h3>
                            <ul className="space-y-3">
                                {personalizedContent.meditations.map((meditation, i) => (
                                   <li key={i}>
                                        <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(meditation.youtubeSearchQuery)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                                           <div className="p-2 bg-secondary rounded-full"><Wind className="h-4 w-4 text-secondary-foreground" /></div>
                                           <div className='flex-1'>
                                                <p className="font-medium text-sm">{meditation.title}</p>
                                                <span className="text-xs text-muted-foreground">Listen on YouTube</span>
                                           </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                         <div className="p-4 rounded-lg border">
                            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2"><BrainCircuit className="text-primary h-5 w-5"/> Wellness Exercises</h3>
                            <ul className="space-y-3">
                                {personalizedContent.exercises.map((exercise, i) => (
                                    <li key={i}>
                                        <a href={`https://www.google.com/search?q=${encodeURIComponent(exercise.googleSearchQuery)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/50 transition-colors">
                                            <div className="p-2 bg-secondary rounded-full"><BrainCircuit className="h-4 w-4 text-secondary-foreground" /></div>
                                            <div className='flex-1'>
                                                <p className="font-medium text-sm">{exercise.title}</p>
                                                <span className="text-xs text-muted-foreground">Learn more on Google</span>
                                            </div>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
            </CardContent>
        </div>
      </CardContent>
    </Card>
  );
}
