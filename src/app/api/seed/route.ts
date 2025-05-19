import { NextResponse } from "next/server";
import { seedSlots } from "@/lib/prisma/db";
import { headers } from "next/headers";

// Basic protection: Check for a specific header or secret query param in a real app for internal routes.
// Or ensure this can only be run in development.
const SEED_SECRET =
  process.env.SEED_SECRET || "your-very-secret-key-for-seeding";

export async function POST() {
  const headersList = await headers();
  const authorization = headersList.get("Authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authorization !== `Bearer ${SEED_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedSlots();
    if (result.success) {
      return NextResponse.json(
        { message: `Successfully seeded/verified ${result.count || 0} slots.` },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to seed slots." },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error seeding slots:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to seed slots." },
      { status: 500 }
    );
  }
}

// Fallback GET handler if someone tries to access via browser
export async function GET() {
  return NextResponse.json(
    { message: "This endpoint is for POST requests to seed data." },
    { status: 405 }
  );
}
