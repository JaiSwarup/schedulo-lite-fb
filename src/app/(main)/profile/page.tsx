"use client";

import type { FirebaseUser, UserProfile as UserProfileType } from "@/lib/types";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Mail, Edit3, LogOut, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { logoutUser, updateUserProfile } from "@/app/_actions/auth";
import { doc, getDoc } from "firebase/firestore";

const profileFormSchema = z.object({
  displayName: z.string().min(2, { message: "Display name must be at least 2 characters." }).max(50),
});

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
    },
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const fetchedUser = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAdmin: userDocSnap.exists() && userDocSnap.data().role === 'admin',
        }
        setCurrentUser(fetchedUser);
        form.reset({ displayName: user.displayName || "" });
      } else {
        setCurrentUser(null);
        router.push("/login");
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [router, form]);

  const handleLogout = async () => {
    const result = await logoutUser();
    if (result.success) {
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push("/login");
    } else {
      toast({ variant: "destructive", title: "Logout Failed", description: result.error });
    }
  };

  const onSubmitProfile = async (data: z.infer<typeof profileFormSchema>) => {
    if (!currentUser) return;
    setIsSaving(true);
    const result = await updateUserProfile(currentUser.uid, { displayName: data.displayName });
    if (result.success) {
      toast({ title: "Profile Updated", description: "Your display name has been updated." });
      setCurrentUser(prev => prev ? { ...prev, displayName: data.displayName } : null);
      setIsEditing(false);
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
    setIsSaving(false);
  };
  
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }


  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return null; // Should be redirected by useEffect
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={`https://placehold.co/150x150.png?text=${getInitials(currentUser.displayName)}`} alt={currentUser.displayName || "User"} data-ai-hint="avatar person"/>
              <AvatarFallback className="text-3xl">{getInitials(currentUser.displayName)}</AvatarFallback>
            </Avatar>
          </div>
          <CardTitle className="text-3xl font-bold text-primary">{currentUser.displayName || "User Profile"}</CardTitle>
          <CardDescription>View and manage your profile information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground"/> Email</Label>
            <Input id="email" type="email" value={currentUser.email || ""} readOnly disabled className="bg-muted/50" />
          </div>

          {isEditing ? (
            <form onSubmit={form.handleSubmit(onSubmitProfile)} className="space-y-4">
              <div>
                <Label htmlFor="displayName" className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/> Display Name</Label>
                <Input 
                  id="displayName" 
                  {...form.register("displayName")} 
                  className={form.formState.errors.displayName ? "border-destructive" : ""}
                />
                {form.formState.errors.displayName && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.displayName.message}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSaving} className="bg-accent hover:bg-accent/80">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4"/> Save Changes
                </Button>
                <Button variant="outline" onClick={() => { setIsEditing(false); form.reset({ displayName: currentUser.displayName || "" }); }}>Cancel</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="currentDisplayName" className="flex items-center"><UserCircle className="mr-2 h-4 w-4 text-muted-foreground"/> Display Name</Label>
              <div className="flex items-center gap-2">
                <Input id="currentDisplayName" value={currentUser.displayName || "Not set"} readOnly disabled className="bg-muted/50 flex-grow" />
                <Button variant="outline" onClick={() => setIsEditing(true)} size="icon" aria-label="Edit display name">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
           {currentUser.isAdmin && (
            <div className="p-3 bg-primary/10 rounded-md">
                <p className="text-sm font-semibold text-primary flex items-center">
                    <ShieldCheck className="mr-2 h-5 w-5"/> You have Administrator privileges.
                </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button variant="destructive" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4"/> Log Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
