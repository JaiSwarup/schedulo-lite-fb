import { db } from "./config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp,
  query,
  where,
  orderBy,
  writeBatch,
} from "firebase/firestore";
import type { Slot, Booking } from "../types";

const SLOTS_COLLECTION = "slots";
const USERS_COLLECTION = "users";

// Helper to generate time slots for seeding
const generateTimeSlots = (): Omit<Slot, 'id' | 'status' | 'bookedByUid' | 'bookedByName' | 'bookedAt' | 'isManuallyUnavailable'>[] => {
  const slots = [];
  // 10 AM to 4 PM (inclusive for start time, so 16:00 is 4 PM - 5 PM slot)
  for (let hour = 10; hour <= 16; hour++) { 
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 || hour === 24 ? "AM" : "PM";
    const nextHourFormatted = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
    const nextAmpm = (hour + 1) < 12 || (hour + 1) === 24 ? "AM" : "PM";
    
    slots.push({
      timeLabel: `${formattedHour}:00 ${ampm} - ${nextHourFormatted}:00 ${nextAmpm}`,
      hour: hour,
    });
  }
  return slots;
};


export async function seedSlots(): Promise<{ success: boolean; error?: string; count?: number }> {
  try {
    const slotsToSeed = generateTimeSlots();
    const batch = writeBatch(db);
    let count = 0;

    for (const slotData of slotsToSeed) {
      const slotId = `${String(slotData.hour).padStart(2, '0')}:00`;
      const slotRef = doc(db, SLOTS_COLLECTION, slotId);
      const slotDoc = await getDoc(slotRef);

      // Only seed if slot doesn't exist
      if (!slotDoc.exists()) {
        const newSlot: Slot = {
          id: slotId,
          ...slotData,
          status: "available",
          isManuallyUnavailable: false,
        };
        batch.set(slotRef, newSlot);
        count++;
      }
    }
    
    await batch.commit();
    return { success: true, count };
  } catch (error: any) {
    console.error("Error seeding slots:", error);
    return { success: false, error: error.message };
  }
}

export async function getSlots(): Promise<Slot[]> {
  try {
    const slotsCollectionRef = collection(db, SLOTS_COLLECTION);
    const q = query(slotsCollectionRef, orderBy("hour", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slot));
  } catch (error) {
    console.error("Error fetching slots:", error);
    return [];
  }
}

export async function getSlotById(slotId: string): Promise<Slot | null> {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    const slotDoc = await getDoc(slotRef);
    if (slotDoc.exists()) {
      return { id: slotDoc.id, ...slotDoc.data() } as Slot;
    }
    return null;
  } catch (error) {
    console.error("Error fetching slot by ID:", error);
    return null;
  }
}

export async function bookSlot(slotId: string, userId: string, userName: string): Promise<{ success: boolean; error?: string }> {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    const slotDoc = await getDoc(slotRef);

    if (!slotDoc.exists()) {
      return { success: false, error: "Slot not found." };
    }

    const slotData = slotDoc.data() as Slot;
    if (slotData.status === "booked" || slotData.isManuallyUnavailable) {
      return { success: false, error: "Slot is not available." };
    }

    await updateDoc(slotRef, {
      status: "booked",
      bookedByUid: userId,
      bookedByName: userName,
      bookedAt: Timestamp.now(),
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error booking slot:", error);
    return { success: false, error: error.message };
  }
}

export async function cancelSlot(slotId: string, userId: string, isAdmin: boolean = false): Promise<{ success: boolean; error?: string }> {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    const slotDoc = await getDoc(slotRef);

    if (!slotDoc.exists()) {
      return { success: false, error: "Slot not found." };
    }
    const slotData = slotDoc.data() as Slot;

    if (slotData.status === "available") {
         return { success: false, error: "Slot is already available." };
    }

    // Allow cancellation if user is admin or booked the slot themselves
    if (!isAdmin && slotData.bookedByUid !== userId) {
      return { success: false, error: "You are not authorized to cancel this booking." };
    }

    await updateDoc(slotRef, {
      status: "available",
      bookedByUid: null,
      bookedByName: null,
      bookedAt: null,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error canceling slot:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserBookings(userId: string): Promise<Booking[]> {
  try {
    const slotsCollectionRef = collection(db, SLOTS_COLLECTION);
    const q = query(
      slotsCollectionRef,
      where("bookedByUid", "==", userId),
      orderBy("hour", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return [];
  }
}


// Admin functions
export async function adminToggleSlotAvailability(slotId: string, makeUnavailable: boolean): Promise<{ success: boolean; error?: string }> {
  try {
    const slotRef = doc(db, SLOTS_COLLECTION, slotId);
    const updateData: Partial<Slot> = {
      isManuallyUnavailable: makeUnavailable,
    };
    // If making unavailable, and it's booked, we might want to cancel it or handle it.
    // For now, just mark it. If it's made available, ensure status reflects that if it wasn't booked.
    if (makeUnavailable) {
      // Optionally, also clear booking if marking unavailable
      // updateData.status = "available";
      // updateData.bookedByUid = null;
      // updateData.bookedByName = null;
      // updateData.bookedAt = null;
    } else {
      // If slot was marked unavailable but not booked, make it available
      const slotDoc = await getDoc(slotRef);
      if (slotDoc.exists()) {
        const slotData = slotDoc.data() as Slot;
        if (slotData.status !== 'booked') {
           updateData.status = "available";
        }
      }
    }

    await updateDoc(slotRef, updateData);
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling slot availability:", error);
    return { success: false, error: error.message };
  }
}

export async function ensureUserDocument(uid: string, email: string | null, displayName: string | null) {
  const userDocRef = doc(db, USERS_COLLECTION, uid);
  const userDoc = await getDoc(userDocRef);
  if (!userDoc.exists()) {
    try {
      await setDoc(userDocRef, {
        uid,
        email,
        displayName,
        createdAt: Timestamp.now(),
        role: "user", // Default role
      });
    } catch (error) {
      console.error("Error creating user document:", error);
    }
  }
}
