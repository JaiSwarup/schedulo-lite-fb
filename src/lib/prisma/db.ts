import { prisma } from "../prisma";
import { Slot } from "@/generated/prisma";

// Helper to generate time slots for seeding
const generateTimeSlots = (): Omit<
  Slot,
  | "id"
  | "slotId"
  | "status"
  | "bookedByUid"
  | "bookedByName"
  | "bookedAt"
  | "isManuallyUnavailable"
>[] => {
  const slots = [];
  // 10 AM to 4 PM (inclusive for start time, so 16:00 is 4 PM - 5 PM slot)
  for (let hour = 10; hour <= 16; hour++) {
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;
    const ampm = hour < 12 || hour === 24 ? "AM" : "PM";
    const nextHourFormatted = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
    const nextAmpm = hour + 1 < 12 || hour + 1 === 24 ? "AM" : "PM";

    slots.push({
      timeLabel: `${formattedHour}:00 ${ampm} - ${nextHourFormatted}:00 ${nextAmpm}`,
      hour: hour,
    });
  }
  return slots;
};

export async function seedSlots(): Promise<{
  success: boolean;
  error?: string;
  count?: number;
}> {
  try {
    const slotsToSeed = generateTimeSlots();
    let count = 0;
    for (const slotData of slotsToSeed) {
      const slotId = `${String(slotData.hour).padStart(2, "0")}:00`;
      const existing = await prisma.slot.findUnique({ where: { slotId } });
      if (!existing) {
        await prisma.slot.create({
          data: {
            ...slotData,
            slotId,
            status: "available",
            isManuallyUnavailable: false,
          },
        });
        count++;
      }
    }
    return { success: true, count };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return { success: false, error: "Slots already seeded." };
      } else {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Failed to seed slots." };
  }
}

export async function getSlots(): Promise<Slot[]> {
  try {
    return await prisma.slot.findMany({ orderBy: { hour: "asc" } });
  } catch (error) {
    console.error("Error fetching slots:", error);
    return [];
  }
}

export async function getSlotById(slotId: string): Promise<Slot | null> {
  try {
    return await prisma.slot.findUnique({ where: { id: slotId } });
  } catch (error) {
    console.error("Error fetching slot by ID:", error);
    return null;
  }
}

export async function bookSlot(
  slotId: string,
  userId: string,
  userName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot) return { success: false, error: "Slot not found." };
    if (slot.status === "booked" || slot.isManuallyUnavailable)
      return { success: false, error: "Slot is not available." };
    await prisma.slot.update({
      where: { id: slotId },
      data: {
        status: "booked",
        bookedByUid: userId,
        bookedByName: userName,
        bookedAt: new Date(),
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return { success: false, error: "Slot already booked." };
      } else {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Failed to book slot." };
  }
}

export async function cancelSlot(
  slotId: string,
  userId: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot) return { success: false, error: "Slot not found." };
    if (slot.status === "available")
      return { success: false, error: "Slot is already available." };
    if (!isAdmin && slot.bookedByUid !== userId)
      return {
        success: false,
        error: "You are not authorized to cancel this booking.",
      };
    await prisma.slot.update({
      where: { id: slotId },
      data: {
        status: "available",
        bookedByUid: null,
        bookedByName: null,
        bookedAt: null,
      },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return { success: false, error: "Slot already available." };
      } else {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Failed to cancel booking." };
  }
}

export async function getUserBookings(userId: string): Promise<Slot[]> {
  try {
    return await prisma.slot.findMany({
      where: { bookedByUid: userId },
      orderBy: { hour: "asc" },
    });
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return [];
  }
}

// Admin functions
export async function adminToggleSlotAvailability(
  slotId: string,
  makeUnavailable: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const slot = await prisma.slot.findUnique({ where: { id: slotId } });
    if (!slot) return { success: false, error: "Slot not found." };
    const updateData: { isManuallyUnavailable: boolean; status?: string } = {
      isManuallyUnavailable: makeUnavailable,
    };
    if (!makeUnavailable && slot.status !== "booked") {
      updateData.status = "available";
    }
    await prisma.slot.update({ where: { id: slotId }, data: updateData });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return { success: false, error: "Slot already unavailable." };
      } else {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Failed to update slot availability." };
  }
}

export async function ensureUserDocument(
  uid: string,
  email: string | null,
  displayName: string | null
) {
  const user = await prisma.user.findUnique({ where: { id: uid } });
  if (!user) {
    try {
      await prisma.user.create({
        data: {
          id: uid,
          email: email || "",
          displayName: displayName || undefined,
          password: "", // Set properly on registration
          role: "user",
          createdAt: new Date(),
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("Unique constraint failed")) {
          console.error("User already exists.");
        } else {
          console.error("Failed to create user:", error.message);
        }
      } else {
        console.error("Failed to create user:", error);
      }
    }
  }
}
