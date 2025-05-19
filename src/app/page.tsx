"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // TODO: Replace with your own session/auth logic
    // For now, just redirect to dashboard (or login if not authenticated)
    // Example: check cookie/localStorage or call an API route
    const isLoggedIn = false; // Replace with real check
    if (isLoggedIn) {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="ml-4 text-lg">Loading Schedulo Lite...</p>
    </div>
  );
}
