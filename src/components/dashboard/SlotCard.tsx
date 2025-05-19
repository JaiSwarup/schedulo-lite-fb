"use client";

import type { Slot, User } from "@/generated/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  UserIcon,
  XCircle,
  CheckCircle,
  CalendarPlus,
  Ban,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SlotCardProps {
  slot: Slot;
  currentUser: User | null;
  onBook: () => void;
  onCancel: () => void;
  onAdminCancel: () => void;
  onAdminToggleAvailability: (makeUnavailable: boolean) => void;
}

export function SlotCard({
  slot,
  currentUser,
  onBook,
  onCancel,
  onAdminCancel,
  onAdminToggleAvailability,
}: SlotCardProps) {
  const isBookedByCurrentUser =
    slot.status === "booked" && slot.bookedByUid === currentUser?.id;
  const isAdmin = currentUser?.isAdmin || false;
  const isEffectivelyUnavailable =
    slot.isManuallyUnavailable || slot.status === "booked";

  let statusText = "Available";
  let statusColor: "default" | "destructive" | "secondary" = "default"; // green (default for available)
  let statusIcon = <CheckCircle className="mr-2 h-4 w-4" />;

  if (slot.isManuallyUnavailable) {
    statusText = "Unavailable";
    statusColor = "secondary"; // gray
    statusIcon = <Ban className="mr-2 h-4 w-4" />;
  } else if (slot.status === "booked") {
    statusText = `Booked by ${slot.bookedByName || "Someone"}`;
    if (isAdmin && !isBookedByCurrentUser) {
      statusText = "Booked (Admin)";
    }
    statusColor = "destructive"; // red
    statusIcon = <XCircle className="mr-2 h-4 w-4" />;
  }

  return (
    <Card
      className={cn(
        "flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow duration-300",
        slot.isManuallyUnavailable
          ? "bg-muted/50"
          : slot.status === "booked"
          ? "bg-destructive/10"
          : "bg-green-500/10"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-semibold">
          <Clock className="mr-2 h-5 w-5 text-primary" />
          {slot.timeLabel}
        </CardTitle>
        <CardDescription className="flex items-center mt-1">
          {statusIcon}
          <Badge
            variant={statusColor}
            className={cn(
              statusColor === "default" &&
                "bg-green-500 hover:bg-green-600 text-white",
              statusColor === "destructive" &&
                "bg-red-500 hover:bg-red-600 text-white",
              statusColor === "secondary" &&
                "bg-gray-500 hover:bg-gray-600 text-white"
            )}
          >
            {statusText}
          </Badge>
        </CardDescription>
        {slot.status === "booked" && slot.bookedByName && (
          <p className="text-sm text-muted-foreground mt-2 flex items-center">
            <UserIcon className="mr-2 h-4 w-4" /> Booked by: {slot.bookedByName}
          </p>
        )}
      </CardHeader>
      <CardContent className="flex-grow">
        {/* Additional slot details can go here */}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
        {isAdmin && (
          <>
            {slot.status === "booked" && !isBookedByCurrentUser && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAdminCancel}
                className="w-full sm:w-auto"
              >
                <XCircle className="mr-2 h-4 w-4" /> Admin Cancel
              </Button>
            )}
            <Button
              variant={slot.isManuallyUnavailable ? "default" : "secondary"}
              size="sm"
              onClick={() =>
                onAdminToggleAvailability(!slot.isManuallyUnavailable)
              }
              className="w-full sm:w-auto"
            >
              {slot.isManuallyUnavailable ? (
                <Check className="mr-2 h-4 w-4" />
              ) : (
                <Ban className="mr-2 h-4 w-4" />
              )}
              {slot.isManuallyUnavailable ? "Make Available" : "Block Slot"}
            </Button>
          </>
        )}
        {!slot.isManuallyUnavailable && slot.status === "available" && (
          <Button
            onClick={onBook}
            size="sm"
            className="w-full sm:w-auto bg-accent hover:bg-accent/90"
            disabled={isEffectivelyUnavailable}
          >
            <CalendarPlus className="mr-2 h-4 w-4" /> Book Slot
          </Button>
        )}
        {isBookedByCurrentUser && !slot.isManuallyUnavailable && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="w-full sm:w-auto"
            disabled={isEffectivelyUnavailable}
          >
            <XCircle className="mr-2 h-4 w-4" /> Cancel My Booking
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
