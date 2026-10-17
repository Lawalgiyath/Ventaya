"use client";

import { useApp } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Trophy, Award, Star, BookUser, BarChart, Gem, ShieldQuestion, BrainCircuit, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "./ui/tooltip";

export const achievementIcons = {
    firstGoal: Star,
    assessmentComplete: BookUser,
    firstJournal: Award,
    worryJarUse: BrainCircuit,
    contentGenerated: Trophy,
    fiveGoalsDone: Gem,
    tenGoalsDone: Gem,
    moodWeek: BarChart,
    moodMonth: BarChart,
    firstResource: ShieldQuestion,
}

export default function Achievements() {
    const { achievements } = useApp();
    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Your Achievements</CardTitle>
                <CardDescription>
                    You've unlocked {unlockedCount} of {achievements.length} badges. Keep up the great work!
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center">
                <TooltipProvider>
                    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                        {achievements.map((achievement) => {
                            const Icon = achievementIcons[achievement.id as keyof typeof achievementIcons] || Star;
                            return (
                                <Tooltip key={achievement.id}>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "flex flex-col items-center justify-center gap-2 p-3 aspect-square rounded-lg border-2 transition-all duration-300",
                                            achievement.unlocked ? "border-primary/50 bg-primary/10 text-primary" : "border-dashed border-muted-foreground/30 text-muted-foreground/50"
                                        )}>
                                            <Icon className={cn("h-8 w-8 md:h-10 md:w-10", achievement.id === 'tenGoalsDone' && 'text-yellow-400', achievement.id === 'moodMonth' && 'text-blue-400')} />
                                            <p className="text-xs font-semibold text-center leading-tight">{achievement.name}</p>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{achievement.description}</p>
                                    </TooltipContent>
                                </Tooltip>
                            )
                        })}
                    </div>
                </TooltipProvider>
            </CardContent>
        </Card>
    )
}
