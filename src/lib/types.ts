import type { Timestamp } from "firebase/firestore";

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  isAdmin?: boolean; // This might be a custom claim or fetched from Firestore
}

export interface Slot {
  id: string; // e.g., "10:00"
  timeLabel: string; // e.g., "10:00 AM - 11:00 AM"
  hour: number; // e.g., 10, for sorting
  status: "available" | "booked";
  bookedByUid?: string;
  bookedByName?: string;
  bookedAt?: Timestamp;
  isManuallyUnavailable?: boolean;
}

export interface Booking extends Slot {
  // Essentially a Slot that is booked, could add more booking-specific details if needed
}

// For forms
export interface UserProfile {
  displayName: string;
  email: string;
}
