"use client";

import { useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Check } from 'lucide-react';
import { achievementIcons } from './achievements';
import { Achievement } from '@/context/app-context';

interface AchievementUnlockedDialogProps {
    achievement: Achievement;
    onDismiss: () => void;
}

export default function AchievementUnlockedDialog({ achievement, onDismiss }: AchievementUnlockedDialogProps) {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onDismiss();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => clearTimeout(timer);
    }, [onDismiss]);

    if (!achievement) return null;

    const Icon = achievementIcons[achievement.id as keyof typeof achievementIcons] || Check;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-in fade-in-50">
            <Card className="w-full max-w-sm mx-4 text-center animate-in slide-in-from-top-full zoom-in-75 duration-500">
                <CardHeader>
                    <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mb-4">
                        <Icon className="h-10 w-10 text-primary" />
                    </div>
                    <CardTitle>Achievement Unlocked!</CardTitle>
                    <CardDescription className="text-lg font-semibold text-primary">{achievement.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{achievement.description}</p>
                    <Button onClick={onDismiss} className="w-full">
                        Continue
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
