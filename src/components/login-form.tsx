
"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { FirebaseError } from "firebase/app"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/context/app-context"
import { HeartPulse, Loader2, User, Briefcase } from "lucide-react"
import { Separator } from "./ui/separator"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
})

const GoogleIcon = () => (
    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
        <path fill="#4285F4" d="M21.35 11.1h-9.1v3.8h5.2a4.4 4.4 0 01-1.9 2.9v2.5h3.2a9.4 9.4 0 002.8-7.2z"></path>
        <path fill="#34A853" d="M12.25 22c2.5 0 4.6-.8 6.1-2.2l-3.2-2.5a5.4 5.4 0 01-2.9 1c-2.3 0-4.2-1.6-4.8-3.7H4.2v2.6A9.9 9.9 0 0012.25 22z"></path>
        <path fill="#FBBC05" d="M7.45 14.1a5.4 5.4 0 010-3.2V8.3h-3.2a10 10 0 000 7.4l3.2-2.6z"></path>
        <path fill="#EA4335" d="M12.25 6.4a5.2 5.2 0 013.7 1.4l2.8-2.8A9.8 9.8 0 0012.25 2a9.9 9.9 0 00-8 5.3l3.2 2.6c.7-2 2.6-3.5 4.8-3.5z"></path>
    </svg>
)


export function LoginForm() {
  const router = useRouter();
  const { login, loginWithGoogle, loginAnonymously } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [anonymousLoading, setAnonymousLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        await login(values.email, values.password);
        toast({
            title: "Login Successful!",
            description: "Welcome back! Redirecting you to the dashboard...",
        });
        router.push("/dashboard");

    } catch(error) {
        handleAuthError(error, "Login Failed");
    } finally {
        setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
        await loginWithGoogle();
        toast({
            title: "Signed in with Google!",
            description: "Welcome! Redirecting you to the dashboard...",
        });
        router.push("/dashboard");
    } catch(error) {
         handleAuthError(error, "Google Sign-In Failed");
    } finally {
        setGoogleLoading(false);
    }
  }
  
  async function handleAnonymousSignIn() {
    setAnonymousLoading(true);
    try {
      await loginAnonymously();
      toast({
          title: "Welcome, Guest!",
          description: "You're browsing anonymously. Sign up to save your progress.",
      });
      router.push('/dashboard');
    } catch (error) {
      handleAuthError(error, "Guest Sign-In Failed");
    } finally {
      setAnonymousLoading(false);
    }
  }
  
  const handleAuthError = (error: any, title: string) => {
    console.error(title, error);
    let description = "An unexpected error occurred. Please try again.";
    if (error instanceof FirebaseError) {
         switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                description = "Invalid email or password. Please try again.";
                break;
            case 'auth/invalid-credential':
                description = "The email or password you entered is incorrect. Please double-check your credentials and try again.";
                break;
            case 'auth/invalid-email':
                description = "The email address is not valid.";
                break;
            case 'auth/popup-closed-by-user':
            case 'auth/cancelled-popup-request':
                 return; // Do not show toast for this, user cancelled intentionally
            default:
                description = "Could not sign you in. Please try again."
        }
    }
    toast({
        variant: "destructive",
        title: title,
        description,
    });
  }

  return (
    <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <div className="p-1.5 rounded-lg bg-primary">
                    <HeartPulse className="h-6 w-6 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">Ventaya</h1>
            </div>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
                    {googleLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon />}
                    {googleLoading ? "Signing in..." : "Continue with Google"}
                </Button>
                 <Button variant="secondary" className="w-full" onClick={handleAnonymousSignIn} disabled={anonymousLoading || loading}>
                    {anonymousLoading ? <Loader2 className="animate-spin mr-2" /> : <User className="mr-2 h-4 w-4" />}
                    {anonymousLoading ? "Entering..." : "Continue as Guest"}
                </Button>
            </div>
            
            <div className="flex items-center my-6">
                <div className="flex-grow border-t border-muted"></div>
                <span className="mx-4 text-xs text-muted-foreground">OR</span>
                <div className="flex-grow border-t border-muted"></div>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="name@example.com" {...field} disabled={loading || googleLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                            <Input type="password" placeholder="••••••••" {...field} disabled={loading || googleLoading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Logging In...' : 'Log In with Email'}
                    </Button>
                </form>
            </Form>
            <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline text-primary">
                    Sign up
                </Link>
            </div>
             <Separator className="my-4" />
             <div className="text-center">
                 <Button variant="ghost" onClick={() => router.push('/organization/login')}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Organization Leader Login
                </Button>
            </div>
        </CardContent>
    </Card>
  )
}
