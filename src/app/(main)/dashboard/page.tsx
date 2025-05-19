import { SlotGrid } from "@/components/dashboard/SlotGrid";
import { getSlots } from "@/lib/firebase/firestore";
import type { Metadata } from 'next';
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: 'Dashboard - Schedulo Lite',
};

// Revalidate data, e.g., every 60 seconds or on demand
export const revalidate = 0; // Or a higher value for less frequent updates

function SlotGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {[...Array(8)].map((_, i) => (
        <Skeleton key={i} className="h-48 rounded-lg" />
      ))}
    </div>
  )
}

export default async function DashboardPage() {
  // Fetch slots server-side
  // The SlotGrid and SlotCard components will need to be client components
  // if they handle user interactions like booking/cancelling directly through client-side Firebase calls.
  // Or, they can use Server Actions.
  // For now, getSlots is fine here. SlotGrid will receive this data.
  const slots = await getSlots();

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary">Available Time Slots</h1>
        <p className="text-muted-foreground mt-2">
          Book your sessions for today. Slots are in 1-hour intervals from 10 AM to 5 PM.
        </p>
      </header>
      <Suspense fallback={<SlotGridSkeleton />}>
        <SlotGrid initialSlots={slots} />
      </Suspense>
    </div>
  );
}
