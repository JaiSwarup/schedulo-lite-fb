"use client";

import type { User, Slot } from "@/generated/prisma";
import { useEffect, useState } from "react";
import { getSlots } from "@/lib/prisma/db";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UserCog, Ban, Check, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  adminCancelBooking as adminCancelDb,
  adminToggleSlotAvailability as adminToggleDb,
} from "@/app/_actions/slots";
import { getCurrentUserSession } from "@/app/_actions/auth";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null); // TODO: Replace with real session/auth logic
  const [allSlots, setAllSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    // TODO: Replace with your own session/auth logic
    // Example: fetch user from session/cookie or context
    const fetchUser = async () => {
      // Simulate fetching user session
      const user = await getCurrentUserSession();
      return user;
    };
    fetchUser()
      .then((user) => {
        setCurrentUser(user);
        if (!user || user.role !== "admin") {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You are not authorized to view this page.",
          });
          router.push("/dashboard");
        }
      })
      .catch((error) => {
        console.error("Error fetching user session:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch user session.",
        });
        router.push("/login");
      });
  }, [router, toast]);

  useEffect(() => {
    if (currentUser?.role === "admin") {
      setIsLoading(true);
      getSlots()
        .then((fetchedSlots) => {
          setAllSlots(fetchedSlots);
          setIsLoading(false);
        })
        .catch((error) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Could not load slot data.",
          });
          console.error("Error fetching slots:", error);
          setIsLoading(false);
        });
    } else if (currentUser && currentUser.role !== "admin") {
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You are not authorized to view this page.",
      });
      router.push("/dashboard");
    }
  }, [currentUser, toast, router]);

  const handleAdminToggleAvailability = async (
    slotId: string,
    makeUnavailable: boolean
  ) => {
    const result = await adminToggleDb(slotId, makeUnavailable);
    if (result.success) {
      toast({ title: "Success", description: `Slot availability updated.` });
      // Optionally refresh slots
      setAllSlots(await getSlots());
    } else {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: result.error,
      });
    }
  };

  const handleAdminCancelBooking = async (slotId: string) => {
    const result = await adminCancelDb(slotId);
    if (result.success) {
      toast({ title: "Success", description: `Booking cancelled.` });
      setAllSlots(await getSlots());
    } else {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: result.error,
      });
    }
  };

  if (isLoading || !currentUser?.role || currentUser.role !== "admin") {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        {!currentUser?.role && !isLoading && (
          <p className="ml-4">Verifying admin access...</p>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <UserCog className="mr-3 h-8 w-8" /> Admin Control Panel
          </CardTitle>
          <CardDescription>
            Manage all time slots and bookings across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allSlots.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              No slots found. Consider seeding initial slots.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Booked By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allSlots.map((slot) => (
                  <TableRow
                    key={slot.id}
                    className={cn(slot.isManuallyUnavailable && "bg-muted/30")}
                  >
                    <TableCell className="font-medium">
                      {slot.timeLabel}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          slot.isManuallyUnavailable
                            ? "secondary"
                            : slot.status === "booked"
                            ? "destructive"
                            : "default"
                        }
                        className={cn(
                          slot.isManuallyUnavailable
                            ? "bg-gray-500"
                            : slot.status === "booked"
                            ? "bg-red-500"
                            : "bg-green-500",
                          "text-white"
                        )}
                      >
                        {slot.isManuallyUnavailable
                          ? "Admin Blocked"
                          : slot.status === "booked"
                          ? "Booked"
                          : "Available"}
                      </Badge>
                    </TableCell>
                    <TableCell>{slot.bookedByName || "N/A"}</TableCell>
                    <TableCell className="text-right space-x-2">
                      {slot.status === "booked" &&
                        !slot.isManuallyUnavailable && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAdminCancelBooking(slot.id)}
                          >
                            <XCircle className="mr-1 h-4 w-4" /> Cancel Booking
                          </Button>
                        )}
                      <Button
                        variant={
                          slot.isManuallyUnavailable ? "default" : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          handleAdminToggleAvailability(
                            slot.id,
                            !slot.isManuallyUnavailable
                          )
                        }
                        className={cn(
                          slot.isManuallyUnavailable
                            ? "bg-green-500 hover:bg-green-600"
                            : "bg-gray-500 hover:bg-gray-600",
                          "text-white"
                        )}
                      >
                        {slot.isManuallyUnavailable ? (
                          <Check className="mr-1 h-4 w-4" />
                        ) : (
                          <Ban className="mr-1 h-4 w-4" />
                        )}
                        {slot.isManuallyUnavailable
                          ? "Make Available"
                          : "Block Slot"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{allSlots.length} total slots listed.</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
