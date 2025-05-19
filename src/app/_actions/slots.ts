"use server";

import { 
  bookSlot as bookSlotFs, 
  cancelSlot as cancelSlotFs, 
  adminToggleSlotAvailability as adminToggleSlotAvailabilityFs 
} from "@/lib/firebase/firestore";
import { revalidatePath } from "next/cache";

// User actions
export async function bookSlot(slotId: string, userId: string, userName: string): Promise<{ success: boolean; error?: string }> {
  const result = await bookSlotFs(slotId, userId, userName);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    revalidatePath("/admin"); // Admins might see changes too
  }
  return result;
}

export async function cancelSlot(slotId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  const result = await cancelSlotFs(slotId, userId, false); // false for isAdmin
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    revalidatePath("/admin");
  }
  return result;
}

// Admin actions
export async function adminCancelBooking(slotId: string): Promise<{ success: boolean; error?: string }> {
  // Assuming admin role is checked at a higher level (e.g., in the component calling this, or via middleware if applicable)
  // For this action, we call cancelSlotFs with isAdmin = true
  const result = await cancelSlotFs(slotId, "admin_user_id_placeholder", true); // userId is not strictly needed if isAdmin is true and backend logic handles it
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    revalidatePath("/admin");
  }
  return result;
}

export async function adminToggleSlotAvailability(slotId: string, makeUnavailable: boolean): Promise<{ success: boolean; error?: string }> {
  const result = await adminToggleSlotAvailabilityFs(slotId, makeUnavailable);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/admin");
  }
  return result;
}
