"use client";

import { useEffect, useState } from 'react';
import { Smile, Meh, Frown, Annoyed, Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/context/app-context';
import { cn } from '@/lib/utils';
import { subDays, format } from 'date-fns';

const moods = [
  { name: 'Happy', icon: Smile, color: 'text-green-500', message: "It's wonderful to see you're feeling happy!" },
  { name: 'Calm', icon: Wind, color: 'text-blue-500', message: "Embrace the calm. It's a peaceful state to be in." },
  { name: 'Okay', icon: Meh, color: 'text-yellow-500', message: "Just 'okay' is perfectly fine. Thank you for checking in." },
  { name: 'Anxious', icon: Annoyed, color: 'text-orange-500', message: "Thank you for sharing. It's brave to acknowledge anxiety." },
  { name: 'Sad', icon: Frown, color: 'text-purple-500', message: "We hear you. It's okay to not be okay. Be gentle with yourself." },
] as const;

type MoodName = typeof moods[number]['name'];

export default function MoodTracker() {
  const { setMoods, moods: moodData, addAchievement } = useApp();
  const [showPicker, setShowPicker] = useState(true);
  
  const today = new Date().toISOString().split('T')[0];
  const moodForToday = moodData.find(m => m.date === today);

  useEffect(() => {
    if (moodForToday) {
      setShowPicker(false);
    }
  }, [moodForToday]);

  const handleMoodSelect = (mood: MoodName) => {
    setMoods([{ mood, date: today }]);
    setShowPicker(false);
  };

  const handleChangeMood = () => {
    setShowPicker(true);
  }

  useEffect(() => {
    const checkMoodStreak = (days: number) => {
      if (moodData.length < days) return false;
      const recentDates = Array.from({ length: days }).map((_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
      return recentDates.every(date => moodData.some(mood => mood.date === date));
    };

    if (checkMoodStreak(7)) {
      addAchievement('moodWeek');
    }
    if (checkMoodStreak(30)) {
      addAchievement('moodMonth');
    }
  }, [moodData, addAchievement]);

  const selectedMoodDetails = moods.find(m => m.name === moodForToday?.mood);

  return (
    <Card>
      <CardHeader>
        <CardTitle>How are you feeling?</CardTitle>
        <CardDescription>Log your daily mood to see patterns over time.</CardDescription>
      </CardHeader>
      <CardContent>
        {showPicker || !moodForToday ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {moods.map(({ name, icon: Icon, color }) => (
              <Button
                key={name}
                variant="outline"
                className="flex flex-col h-20 gap-2"
                onClick={() => handleMoodSelect(name)}
              >
                <Icon className={cn("h-8 w-8", color)} />
                <span className="text-xs">{name}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-4 bg-secondary rounded-lg text-center">
             <p className="text-sm text-muted-foreground">Today you're feeling:</p>
            <p className="text-3xl font-bold font-headline text-primary">{moodForToday.mood}</p>
            {selectedMoodDetails && (
              <p className="text-sm text-muted-foreground italic">"{selectedMoodDetails.message}"</p>
            )}
            <Button variant="outline" size="sm" onClick={handleChangeMood}>Change Mood</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
