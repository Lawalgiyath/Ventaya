
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useApp } from "@/context/app-context"
import { Loader2, Briefcase } from "lucide-react"

const sectors = ["Technology", "Education", "Healthcare", "Finance", "Non-Profit", "Government", "Retail", "Other"];

const formSchema = z.object({
  organizationName: z.string().min(3, {
    message: "Organization name must be at least 3 characters.",
  }),
  name: z.string().min(2, {
    message: "Your name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  sector: z.string().min(1, { message: "Please select your organization's sector." }),
})

export function OrganizationSignupForm() {
  const router = useRouter();
  const { signup } = useApp();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organizationName: "",
      name: "",
      email: "",
      password: "",
      sector: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    try {
        await signup(values.name, values.email, values.password, true, undefined, values.organizationName, values.sector);
        toast({
            title: "Organization Account Created!",
            description: "You have successfully signed up. Taking you to the dashboard...",
        });
        router.push("/organization/dashboard");

    } catch (error) {
        handleAuthError(error, "Signup Failed");
    } finally {
        setLoading(false);
    }
  }

  const handleAuthError = (error: any, title: string) => {
    console.error(title, error);
    let description = "An unexpected error occurred. Please try again.";
    if (error instanceof FirebaseError) {
        switch(error.code) {
            case 'auth/email-already-in-use':
                description = "This email address is already in use by another account.";
                break;
            case 'auth/invalid-email':
                description = "The email address is not valid.";
                break;
            case 'auth/weak-password':
                description = "The password is too weak. Please use a stronger password.";
                break;
            default:
                description = "Could not create your account. Please try again."
        }
    }
    toast({
        variant: "destructive",
        title: title,
        description,
    });
  }

  return (
    <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
             <div className="flex justify-center items-center gap-2 mb-4">
                <div className="p-2.5 rounded-lg bg-primary">
                    <Briefcase className="h-7 w-7 text-primary-foreground" />
                </div>
            </div>
            <CardTitle className="text-3xl font-bold">Create an Organization Account</CardTitle>
            <CardDescription>Set up a wellness dashboard for your team or community.</CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="organizationName"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Organization Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your Company, Inc." {...field} disabled={loading} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="sector"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sector</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                                        <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a sector" />
                                        </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                    </div>
                     <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Your Full Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} disabled={loading} />
                            </FormControl>
                            <FormDescription>This will be the primary contact for the organization.</FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Your Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@example.com" {...field} disabled={loading} />
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
                    </div>
                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Creating Account...' : 'Sign Up and Create Organization'}
                    </Button>
                </form>
            </Form>
            <div className="mt-6 text-center text-sm">
                Already have an organization account?{" "}
                <Link href="/organization/login" className="underline text-primary font-medium">
                    Log in
                </Link>
            </div>
        </CardContent>
    </Card>
  )
}
