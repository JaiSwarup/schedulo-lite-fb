"use server";

import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

async function getCookiesSync() {
  return await cookies();
}

export async function loginUser(credentials: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
  });
  if (!user) return { success: false, error: "User not found" };
  const isValid = await bcrypt.compare(credentials.password, user.password);
  if (!isValid) return { success: false, error: "Invalid password" };
  const cookiesObj = await getCookiesSync();
  cookiesObj.set("session_user_id", user.id, { httpOnly: true });
  return { success: true, user };
}

export async function registerUser(credentials: {
  username?: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const hashed = await bcrypt.hash(credentials.password, 10);
    const user = await prisma.user.create({
      data: {
        email: credentials.email,
        displayName: credentials.username,
        password: hashed,
        role: "user",
        createdAt: new Date(),
      },
    });
    return { success: true, user };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return { success: false, error: "Email already exists" };
      } else {
        return { success: false, error: "Failed to register user" };
      }
    }
    return { success: false, error: "Failed to register user" };
  }
}

export async function logoutUser(): Promise<{
  success: boolean;
  error?: string;
}> {
  const cookiesObj = await getCookiesSync();
  cookiesObj.delete("session_user_id");
  return { success: true };
}

export async function getCurrentUserSession(): Promise<User | null> {
  const cookiesObj = await getCookiesSync();
  const sessionId = cookiesObj.get("session_user_id")?.value;
  if (!sessionId) return null;
  const user = await prisma.user.findUnique({ where: { id: sessionId } });
  return user || null;
}

export async function isUserAdminServer(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.role === "admin";
}

export async function updateUserProfile(
  userId: string,
  data: { displayName: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { displayName: data.displayName },
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unique constraint failed")) {
        return { success: false, error: "Display name already exists" };
      } else {
        return { success: false, error: error.message };
      }
    }
    return { success: false, error: "Failed to update profile" };
  }
}
