
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
import { Loader2, Briefcase, BookOpen } from "lucide-react"

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
})

export function OrganizationLoginForm() {
  const router = useRouter();
  const { login } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

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
        await login(values.email, values.password, true); // Pass isLeader flag
        toast({
            title: "Login Successful!",
            description: "Welcome back! Redirecting you to your organization dashboard...",
        });
        router.push("/organization/dashboard");

    } catch(error) {
        handleAuthError(error, "Login Failed");
    } finally {
        setLoading(false);
    }
  }
  
  const handleAuthError = (error: any, title: string) => {
    console.error(title, error);
    let description = "An unexpected error occurred. Please try again.";
    if (error instanceof FirebaseError) {
         switch(error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                description = "Invalid email or password. Please check that you are using your organization leader credentials.";
                break;
            case 'auth/invalid-credential':
                description = "The email or password you entered is incorrect. Please ensure you are using your organization leader credentials and try again.";
                break;
            case 'auth/invalid-email':
                description = "The email address is not valid.";
                break;
            default:
                description = "Could not sign you in. Please try again."
        }
    } else if (error instanceof Error && error.message === 'NOT_A_LEADER') {
        description = "This account is not registered as an organization leader."
    }
    toast({
        variant: "destructive",
        title: title,
        description,
    });
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                 <div className="p-2.5 rounded-lg bg-primary">
                    <BookOpen className="h-7 w-7 text-primary-foreground" />
                </div>
            </div>
            <CardTitle className="text-3xl font-bold">Ventaya for Organizations</CardTitle>
            <CardDescription>Log in to your organization's wellness dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                            <Input placeholder="leader@my-organization.com" {...field} disabled={loading} />
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
                            <Input type="password" placeholder="••••••••" {...field} disabled={loading} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Logging In...' : 'Log In'}
                    </Button>
                </form>
            </Form>
            <div className="mt-6 text-center text-sm">
                Don&apos;t have an organization account?{" "}
                <Link href="/organization/signup" className="underline text-primary font-medium">
                    Create one now
                </Link>
            </div>
             <div className="mt-2 text-center text-sm">
                Are you a team member?{" "}
                <Link href="/login" className="underline text-primary font-medium">
                    Log in here
                </Link>
            </div>
        </CardContent>
    </Card>
  )
}
