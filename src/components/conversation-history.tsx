"use client";

import { useApp } from "@/context/app-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Bot, BookHeart, FileText, Mail } from "lucide-react";
import { format, parseISO } from "date-fns";

const interactionIcons = {
    'Journal': BookHeart,
    'Worry Jar': Mail,
    'Assessment': FileText,
    'Planner': Bot,
}

export default function ConversationHistory() {
    const { interactions } = useApp();

    if (interactions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Conversation History</CardTitle>
                    <CardDescription>Review your past interactions with Aya.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <p>You don't have any saved conversations yet.</p>
                        <p className="text-sm">Complete an assessment or write in your journal to get started.</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Conversation History</CardTitle>
                <CardDescription>Review your past interactions with Aya.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {interactions.map((interaction) => {
                        const Icon = interactionIcons[interaction.type];
                        return (
                             <AccordionItem value={interaction.id} key={interaction.id}>
                                <AccordionTrigger>
                                    <div className="flex items-center gap-4">
                                        <Icon className="h-5 w-5 text-primary" />
                                        <div className="text-left">
                                            <p className="font-semibold">{interaction.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {format(parseISO(interaction.timestamp), "MMMM d, yyyy 'at' h:mm a")}
                                            </p>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="bg-secondary/50 p-4 rounded-md">
                                    <p className="whitespace-pre-wrap">{interaction.content}</p>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </CardContent>
        </Card>
    );
}
