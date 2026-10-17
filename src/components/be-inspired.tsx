
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Sparkles, Heart, Send, Loader2, Star, Sun, Wind, Leaf } from "lucide-react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useApp } from '@/context/app-context';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { useToast } from '@/hooks/use-toast';
import { aiVetStory } from '@/app/actions/ai';
import { useAi } from '@/hooks/use-ai';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore';

const allQuotes = [
    { quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
    { quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
    { quote: "Your present circumstances don't determine where you can go; they merely determine where you start.", author: "Nido Qubein" },
    { quote: "The only journey is the one within.", author: "Rainer Maria Rilke" },
    { quote: "What mental health needs is more sunlight, more candor, and more unashamed conversation.", author: "Glenn Close" },
    { quote: "You are not your illness. You have an individual story to tell.", author: "Julian Seifter" },
    { quote: "It’s not until you’re broken that you find your sharpest edge.", author: "T.D. Jakes" },
    { quote: "The only way out of the labyrinth of suffering is to forgive.", author: "John Green, The Fault in Our Stars" },
    { quote: "Just because no one else can heal or do your inner work for you doesn’t mean you can, should, or need to do it alone.", author: "Lisa Olivera" },
    { quote: "What we achieve inwardly will change outer reality.", author: "Plutarch" }
];


interface SuccessStory {
    name: string;
    story: string;
    avatarHint: string;
    timestamp?: any;
}

const storySchema = z.object({
  story: z.string().min(50, "Please share a bit more of your story (at least 50 characters).").max(500, "Your story is a bit long, please keep it under 500 characters."),
});

type StoryFormValues = z.infer<typeof storySchema>;

const storyIcons = [Star, Sun, Wind, Leaf, Heart];

export default function BeInspired() {
    const { user } = useApp();
    const { run } = useAi();
    const { toast } = useToast();
    const [stories, setStories] = useState<SuccessStory[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [dailyQuote, setDailyQuote] = useState({ quote: '', author: '' });

    useEffect(() => {
        const getDayOfYear = (date: Date) => {
            const start = new Date(date.getFullYear(), 0, 0);
            const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.floor(diff / oneDay);
        };
        const dayIndex = getDayOfYear(new Date());
        setDailyQuote(allQuotes[dayIndex % allQuotes.length]);
    }, []);

    useEffect(() => {
        setLoading(true);
        const storiesRef = collection(db, 'community-stories');
        const q = query(storiesRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedStories: SuccessStory[] = [];
            querySnapshot.forEach((doc) => {
                fetchedStories.push(doc.data() as SuccessStory);
            });
            setStories(fetchedStories);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching stories:", error);
            toast({
                variant: 'destructive',
                title: 'Oh no!',
                description: 'Could not load community stories.'
            });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [toast]);

    const form = useForm<StoryFormValues>({
        resolver: zodResolver(storySchema),
        defaultValues: {
            story: ""
        }
    });

    const onSubmit = async (data: StoryFormValues) => {
        if (!user || user.isAnonymous) {
            toast({
                variant: 'destructive',
                title: 'Please sign up',
                description: 'You need an account to share a story.'
            });
            return;
        }

        setSubmitting(true);
        try {
            const result = await run(aiVetStory, { story: data.story });
            if (!result) return;

            if (result.isApproved) {
                const storiesRef = collection(db, 'community-stories');
                await addDoc(storiesRef, {
                    name: user?.name?.split(' ')[0] || "Community Member",
                    story: data.story,
                    avatarHint: user.avatar ? "" : "person smiling",
                    avatar: user.avatar,
                    timestamp: serverTimestamp()
                });

                toast({
                    title: "Thank You for Sharing!",
                    description: "Your story has been added to the community wall.",
                });
                form.reset();
            } else {
                 toast({
                    variant: "destructive",
                    title: "Story Under Review",
                    description: result.reason || "Your story could not be approved at this time. Please review and try again.",
                });
            }
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Oh no! Something went wrong.',
                description: 'Could not submit your story. Please try again.',
            });
        } finally {
            setSubmitting(false);
        }
    }
    
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                            <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Quote of the Day</CardTitle>
                            <CardDescription>A little inspiration to brighten your day.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <blockquote className="border-l-4 border-primary pl-6 italic text-lg">
                        "{dailyQuote.quote}"
                        <footer className="mt-2 text-sm text-muted-foreground not-italic">{dailyQuote.author}</footer>
                    </blockquote>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                            <Heart className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Community Stories</CardTitle>
                            <CardDescription>Read about the progress and success of others in the Ventaya community.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {loading ? (
                         <div className="flex justify-center items-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                         </div>
                    ) : stories.length === 0 ? (
                        <p className="text-muted-foreground text-center py-10">Be the first to share a story!</p>
                    ) : (
                        stories.map((story, index) => {
                            const Icon = storyIcons[index % storyIcons.length];
                            return (
                                <div key={index} className="p-4 rounded-lg bg-secondary/50 flex items-start gap-4">
                                    <Avatar className="bg-primary/10">
                                        <AvatarFallback className="bg-transparent">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-muted-foreground leading-relaxed">"{story.story}"</p>
                                        <p className="font-semibold mt-2 text-sm text-right w-full">- {story.name}</p>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </CardContent>
            </Card>
            
            <Card>
                 <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full bg-primary/10 border-2 border-primary/20">
                            <Send className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <CardTitle>Share Your Journey</CardTitle>
                            <CardDescription>Inspire others by sharing your own success story. Your story will be reviewed by Aya before posting.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField 
                                control={form.control}
                                name="story"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="sr-only">Your Success Story</FormLabel>
                                        <FormControl>
                                            <Textarea 
                                                placeholder="e.g., When I first started, I struggled with... but now I feel..."
                                                rows={5}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={submitting}>
                                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    {submitting ? "Submitting..." : "Share My Story"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
