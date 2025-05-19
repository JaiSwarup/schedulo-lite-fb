"use client";

import type { FirebaseUser, Slot } from "@/lib/types";
import { useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { getSlots, adminToggleSlotAvailability as adminToggleDb, adminCancelBooking as adminCancelDb } from "@/lib/firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, UserCog, Ban, Check, XCircle, Loader2, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const isAdmin = userDocSnap.exists() && userDocSnap.data().role === 'admin';
        
        if (!isAdmin) {
          toast({ variant: "destructive", title: "Access Denied", description: "You are not authorized to view this page." });
          router.push("/dashboard");
          return;
        }
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAdmin: true,
        });
      } else {
        router.push("/login"); // Should be handled by layout, but good fallback
      }
    });
    return () => unsubscribeAuth();
  }, [router, toast]);

  useEffect(() => {
    if (currentUser?.isAdmin) {
      setIsLoading(true);
      const slotsQuery = query(collection(db, "slots"), orderBy("hour", "asc"));
      const unsubscribeSlots = onSnapshot(slotsQuery, (querySnapshot) => {
        const fetchedSlots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
        setAllSlots(fetchedSlots);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching real-time slots for admin:", error);
        toast({ variant: "destructive", title: "Error", description: "Could not load slot data." });
        setIsLoading(false);
      });
      
      return () => unsubscribeSlots();
    } else if(currentUser && !currentUser.isAdmin) {
      // If user is somehow here but not admin after auth check
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  const handleAdminToggleAvailability = async (slotId: string, makeUnavailable: boolean) => {
    const result = await adminToggleDb(slotId, makeUnavailable);
    if (result.success) {
      toast({ title: "Success", description: `Slot availability updated.` });
    } else {
      toast({ variant: "destructive", title: "Update Failed", description: result.error });
    }
  };

  const handleAdminCancelBooking = async (slotId: string) => {
    const result = await adminCancelDb(slotId);
    if (result.success) {
      toast({ title: "Success", description: `Booking cancelled.` });
    } else {
      toast({ variant: "destructive", title: "Cancellation Failed", description: result.error });
    }
  };
  
  if (isLoading || !currentUser?.isAdmin) { // also check currentUser.isAdmin before rendering sensitive data
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        { !currentUser?.isAdmin && !isLoading && <p className="ml-4">Verifying admin access...</p>}
      </div>
    );
  }


  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Admin Control Panel
          </CardTitle>
          <CardDescription>Manage all time slots and bookings across the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {allSlots.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No slots found. Consider seeding initial slots.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSlots.map((slot) => (
                  <TableRow key={slot.id} className={cn(slot.isManuallyUnavailable && "bg-muted/30")}>
                    <TableCell className="font-medium">{slot.timeLabel}</TableCell>
                    <TableCell>
                      <Badge variant={slot.isManuallyUnavailable ? "secondary" : slot.status === "booked" ? "destructive" : "default"}
                       className={cn(
                         slot.isManuallyUnavailable ? "bg-gray-500" : slot.status === "booked" ? "bg-red-500" : "bg-green-500",
                         "text-white"
                       )}
                      >
                        {slot.isManuallyUnavailable ? "Admin Blocked" : slot.status === "booked" ? "Booked" : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell>{slot.bookedByName || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {slot.status === 'booked' && !slot.isManuallyUnavailable && (
                        <Button variant="outline" size="sm" onClick={() => handleAdminCancelBooking(slot.id)}>
                          <XCircle className="mr-1 h-4 w-4" /> Cancel Booking
                        </Button>
                      )}
                      <Button
                        variant={slot.isManuallyUnavailable ? "default" : "secondary"}
                        size="sm"
                        onClick={() => handleAdminToggleAvailability(slot.id, !slot.isManuallyUnavailable)}
                         className={cn(slot.isManuallyUnavailable ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-600", "text-white")}
                      >
                        {slot.isManuallyUnavailable ? <Check className="mr-1 h-4 w-4" /> : <Ban className="mr-1 h-4 w-4" />}
                        {slot.isManuallyUnavailable ? "Make Available" : "Block Slot"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{allSlots.length} total slots listed.</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
