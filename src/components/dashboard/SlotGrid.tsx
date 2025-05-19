"use client";

import type { Slot, FirebaseUser } from "@/lib/types";
import { SlotCard } from "./SlotCard";
import { useEffect, useState, useCallback } from "react";
import { BookingModal } from "./BookingModal";
import { useToast } from "@/hooks/use-toast";
import { bookSlot as bookSlotAction, cancelSlot as cancelSlotAction, adminCancelBooking, adminToggleSlotAvailability } from "@/app/_actions/slots";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase/config";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";

interface SlotGridProps {
  initialSlots: Slot[];
}

export function SlotGrid({ initialSlots }: SlotGridProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          isAdmin: userDocSnap.exists() && userDocSnap.data().role === 'admin',
        });
      } else {
        setCurrentUser(null);
      }
    });

    const slotsQuery = query(collection(db, "slots"), orderBy("hour", "asc"));
    const unsubscribeSlots = onSnapshot(slotsQuery, (querySnapshot) => {
      const updatedSlots = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
      setSlots(updatedSlots);
    }, (error) => {
      console.error("Error fetching real-time slots:", error);
      toast({ variant: "destructive", title: "Error", description: "Could not load slot updates." });
    });
    
    return () => {
      unsubscribeAuth();
      unsubscribeSlots();
    };
  }, [toast]);

  const handleBookSlot = (slot: Slot) => {
    if (!currentUser) {
      toast({ variant: "destructive", title: "Not Authenticated", description: "Please login to book a slot." });
      return;
    }
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !currentUser || !currentUser.displayName) {
      toast({ variant: "destructive", title: "Error", description: "User or slot details missing." });
      return;
    }
    
    const result = await bookSlotAction(selectedSlot.id, currentUser.uid, currentUser.displayName);
    if (result.success) {
      toast({ title: "Success", description: `Slot ${selectedSlot.timeLabel} booked.` });
    } else {
      toast({ variant: "destructive", title: "Booking Failed", description: result.error });
    }
    setIsModalOpen(false);
    setSelectedSlot(null);
    // Real-time updates will refresh the UI, manual refresh can be removed.
    // refreshSlots(); 
  };

  const handleCancelSlot = async (slotId: string) => {
    if (!currentUser) return;
    const result = await cancelSlotAction(slotId, currentUser.uid);
    if (result.success) {
      toast({ title: "Success", description: "Booking cancelled." });
    } else {
      toast({ variant: "destructive", title: "Cancellation Failed", description: result.error });
    }
    // refreshSlots();
  };
  
  const handleAdminCancelSlot = async (slotId: string) => {
    if (!currentUser?.isAdmin) return;
    const result = await adminCancelBooking(slotId);
     if (result.success) {
      toast({ title: "Success", description: "Admin: Booking cancelled." });
    } else {
      toast({ variant: "destructive", title: "Admin: Cancellation Failed", description: result.error });
    }
    // refreshSlots();
  }

  const handleAdminToggleAvailability = async (slotId: string, makeUnavailable: boolean) => {
    if (!currentUser?.isAdmin) return;
    const result = await adminToggleSlotAvailability(slotId, makeUnavailable);
    if (result.success) {
      toast({ title: "Success", description: `Admin: Slot availability updated.` });
    } else {
      toast({ variant: "destructive", title: "Admin: Update Failed", description: result.error });
    }
    // refreshSlots();
  }


  if (!slots.length) {
    return <p className="text-center text-muted-foreground">No slots available at the moment. Try seeding them if you are an admin.</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {slots.map((slot) => (
          <SlotCard
            key={slot.id}
            slot={slot}
            currentUser={currentUser}
            onBook={() => handleBookSlot(slot)}
            onCancel={() => handleCancelSlot(slot.id)}
            onAdminCancel={() => handleAdminCancelSlot(slot.id)}
            onAdminToggleAvailability={(makeUnavailable) => handleAdminToggleAvailability(slot.id, makeUnavailable)}
          />
        ))}
      </div>
      {selectedSlot && currentUser && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setSelectedSlot(null); }}
          onConfirm={confirmBooking}
          slot={selectedSlot}
          userName={currentUser.displayName || "User"}
        />
      )}
    </>
  );
}
