"use server";

import { revalidatePath } from "next/cache";
import {
  bookSlot as bookSlotDb,
  cancelSlot as cancelSlotDb,
  adminToggleSlotAvailability as adminToggleSlotAvailabilityDb,
} from "@/lib/prisma/db";

// User actions
export async function bookSlot(
  slotId: string,
  userId: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  const result = await bookSlotDb(slotId, userId, userName);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    revalidatePath("/admin"); // Admins might see changes too
  }
  return result;
}

export async function cancelSlot(
  slotId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const result = await cancelSlotDb(slotId, userId, false); // false for isAdmin
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    revalidatePath("/admin");
  }
  return result;
}

// Admin actions
export async function adminCancelBooking(
  slotId: string
): Promise<{ success: boolean; error?: string }> {
  // Assuming admin role is checked at a higher level (e.g., in the component calling this, or via middleware if applicable)
  // For this action, we call cancelSlotDb with isAdmin = true
  const result = await cancelSlotDb(slotId, "admin", true); // userId is not strictly needed if isAdmin is true and backend logic handles it
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/bookings");
    revalidatePath("/admin");
  }
  return result;
}

export async function adminToggleSlotAvailability(
  slotId: string,
  makeUnavailable: boolean
): Promise<{ success: boolean; error?: string }> {
  const result = await adminToggleSlotAvailabilityDb(slotId, makeUnavailable);
  if (result.success) {
    revalidatePath("/dashboard");
    revalidatePath("/admin");
  }
  return result;
}
