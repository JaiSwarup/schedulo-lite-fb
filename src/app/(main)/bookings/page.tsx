"use client";

import type { User, Slot } from "@/generated/prisma";
import { useEffect, useState } from "react";
import { getUserBookings } from "@/lib/prisma/db";
import { cancelSlot as cancelSlotAction } from "@/app/_actions/slots";
import { useToast } from "@/hooks/use-toast";
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
import { XCircle, CalendarCheck2, Loader2 } from "lucide-react";
import { format } from "date-fns"; // For formatting timestamp if needed
import { cn } from "@/lib/utils";

export default function BookingsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // TODO: Replace with your own session/auth logic
  // Example: fetch user from session/cookie or context
  // setCurrentUser({ id: "demo", email: "demo@demo.com", displayName: "Demo User", role: "user", createdAt: new Date() });
  useEffect(() => {
    setCurrentUser({
      id: "demo",
      email: "demo@demo.com",
      displayName: "Demo User",
      isAdmin: false,
      password: "",
      role: "user",
      createdAt: new Date(),
    });
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      setIsLoading(true);
      getUserBookings(currentUser.id).then((userBookings: Slot[]) => {
        setBookings(userBookings);
        setIsLoading(false);
      });
    }
  }, [currentUser]);

  const handleCancelBooking = async (slotId: string) => {
    if (!currentUser) return;
    const result = await cancelSlotAction(slotId, currentUser.id);
    if (result.success) {
      toast({ title: "Success", description: "Booking cancelled." });
      setBookings(await getUserBookings(currentUser.id));
    } else {
      toast({
        variant: "destructive",
        title: "Cancellation Failed",
        description: result.error,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center">
            <CalendarCheck2 className="mr-3 h-8 w-8" /> My Bookings
          </CardTitle>
          <CardDescription>
            Here are all the time slots you have booked.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">
              You have no bookings yet.{" "}
              <a href="/dashboard" className="text-primary hover:underline">
                Book a slot!
              </a>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Booked On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">
                      {booking.timeLabel}
                    </TableCell>
                    <TableCell>
                      {booking.bookedAt
                        ? format(booking.bookedAt, "MMM d, yyyy 'at' h:mm a")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          booking.isManuallyUnavailable
                            ? "secondary"
                            : "default"
                        }
                        className={cn(
                          booking.isManuallyUnavailable
                            ? "bg-gray-500"
                            : "bg-green-500",
                          "text-white"
                        )}
                      >
                        {booking.isManuallyUnavailable
                          ? "Admin Blocked"
                          : "Confirmed"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!booking.isManuallyUnavailable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.id)}
                          disabled={booking.isManuallyUnavailable}
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                      )}
                      {booking.isManuallyUnavailable && (
                        <span className="text-sm text-muted-foreground italic">
                          Blocked by Admin
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableCaption>{bookings.length} booking(s) found.</TableCaption>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
