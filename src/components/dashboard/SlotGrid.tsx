"use client";

import type { Slot, User } from "@/generated/prisma";
import { SlotCard } from "./SlotCard";
import { useEffect, useState } from "react";
import { BookingModal } from "./BookingModal";
import { useToast } from "@/hooks/use-toast";
import {
  bookSlot as bookSlotAction,
  cancelSlot as cancelSlotAction,
  adminCancelBooking,
  adminToggleSlotAvailability,
} from "@/app/_actions/slots";
import { getCurrentUserSession } from "@/app/_actions/auth";
import { getSlots } from "@/lib/prisma/db";

interface SlotGridProps {
  initialSlots: Slot[];
}

export function SlotGrid({ initialSlots }: SlotGridProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // TODO: Replace with real user session
  const [slots, setSlots] = useState<Slot[]>(initialSlots);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  // TODO: Replace with your own auth/session logic
  useEffect(() => {
    const fetchUser = async () => {
      // Simulate fetching user session
      const user = await getCurrentUserSession();
      setCurrentUser(user);
    };
    fetchUser()
      .catch((error) => {
        console.error("Error fetching user session:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user session.",
        });
      })
      .finally(() => {
        setIsModalOpen(false);
      });
    const fetchSlots = async () => {
      // Simulate fetching slots from the server
      const fetchedSlots = await getSlots();
      return fetchedSlots;
    };
    fetchSlots()
      .then((fetchedSlots) => {
        setSlots(fetchedSlots);
      })
      .catch((error) => {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load slot data.",
        });
        console.error("Error fetching slots:", error);
      });
  }, [toast]);

  const handleBookSlot = (slot: Slot) => {
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Not Authenticated",
        description: "Please login to book a slot.",
      });
      return;
    }
    setSelectedSlot(slot);
    setIsModalOpen(true);
  };

  const confirmBooking = async () => {
    if (!selectedSlot || !currentUser || !currentUser.displayName) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "User or slot details missing.",
      });
      return;
    }
    const result = await bookSlotAction(
      selectedSlot.id,
      currentUser.id,
      currentUser.displayName
    );
    if (result.success) {
      toast({
        title: "Success",
        description: `Slot ${selectedSlot.timeLabel} booked.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: result.error,
      });
    }
    setIsModalOpen(false);
    setSelectedSlot(null);
  };

  const handleCancelSlot = async (slotId: string) => {
    if (!currentUser) return;
    const result = await cancelSlotAction(slotId, currentUser.id);
    if (result.success) {
      toast({ title: "Success", description: "Booking cancelled." });
    } else {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: result.error,
      });
    }
  };

  const handleAdminCancelSlot = async (slotId: string) => {
    if (!currentUser) return;
    const result = await adminCancelBooking(slotId);
    if (result.success) {
      toast({ title: "Success", description: "Admin: Booking cancelled." });
    } else {
      toast({
        variant: "destructive",
        title: "Admin: Cancellation Failed",
        description: result.error,
      });
    }
  };

  const handleAdminToggleAvailability = async (
    slotId: string,
    makeUnavailable: boolean
  ) => {
    if (!currentUser) return;
    const result = await adminToggleSlotAvailability(slotId, makeUnavailable);
    if (result.success) {
      toast({
        title: "Success",
        description: `Admin: Slot availability updated.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Admin: Update Failed",
        description: result.error,
      });
    }
  };

  if (!slots.length) {
    return (
      <p className="text-center text-muted-foreground">
        No slots available at the moment. Try seeding them if you are an admin.
      </p>
    );
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
            onAdminToggleAvailability={(makeUnavailable) =>
              handleAdminToggleAvailability(slot.id, makeUnavailable)
            }
          />
        ))}
      </div>
      {selectedSlot && currentUser && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSlot(null);
          }}
          onConfirm={confirmBooking}
          slot={selectedSlot}
          userName={currentUser.displayName || "User"}
        />
      )}
    </>
  );
}
