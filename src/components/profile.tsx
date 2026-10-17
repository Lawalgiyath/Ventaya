
'use client';
import { useApp } from '@/context/app-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, LogOut, Mail, User as UserIcon, ShieldQuestion } from 'lucide-react';
import { BillingCard } from './billing-card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

export default function Profile() {
  const { user, logout } = useApp();
  const router = useRouter();

  if (!user) {
    // This should be handled by the layout, but as a fallback:
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.replace('/');
  };

  return (
    <div className="min-h-screen bg-secondary/30 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
            <Card>
                <CardHeader className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                    <Avatar className="h-24 w-24 border-4 border-primary/20">
                    <AvatarImage src={user.avatar ?? undefined} alt={user.name ?? ''} />
                    <AvatarFallback className="text-3xl">
                        {user.name?.[0].toUpperCase() ?? 'G'}
                    </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                    <CardTitle className="text-3xl">{user.name}</CardTitle>
                    <CardDescription>
                       {user.isAnonymous ? "You are currently browsing as a guest." : "Your personal profile and account settings."}
                    </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="mt-6">
                    { user.isAnonymous ? (
                        <div className="space-y-6">
                            <div className="text-center p-6 bg-secondary rounded-lg">
                                <ShieldQuestion className="h-12 w-12 text-primary mx-auto mb-4" />
                                <h3 className="text-xl font-semibold">Keep Your Progress</h3>
                                <p className="text-muted-foreground mt-2 mb-4">
                                    Your goals, moods and achievements are saved to this guest
                                    session, but they live only in this browser and are lost if
                                    you log out or clear your data. Create a free account to keep
                                    them for good.
                                </p>
                                <Button onClick={() => router.push('/signup')}>
                                    Sign Up Now
                                </Button>
                            </div>

                            {/* Guests could previously never leave guest mode from here. */}
                            <div className="flex justify-center">
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Log Out
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                You will be returned to the landing page.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ) : (
                    <div className="space-y-6">
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                            Account Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <InfoItem icon={UserIcon} label="Full Name" value={user.name ?? 'Not set'} />
                            <InfoItem icon={Mail} label="Email Address" value={user.email ?? 'Not set'} />
                        </div>
                        
                        <h3 className="text-lg font-semibold text-foreground border-b pb-2 pt-6">
                            Account Actions
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button variant="outline" disabled>Change Password</Button>
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Log Out
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You will be returned to the landing page.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                    )}
                </CardContent>
            </Card>

            <div className="mt-6">
                <BillingCard />
            </div>
      </div>
    </div>
  );
}


function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-1">
                <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-medium text-foreground">{value}</p>
            </div>
        </div>
    )
}
