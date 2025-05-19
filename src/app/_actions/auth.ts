"use server";

import { auth } from '@/lib/firebase/config';
import { signInWithEmailAndPassword, signOut, updateProfile as firebaseUpdateProfile, createUserWithEmailAndPassword } from "firebase/auth";
import type { FirebaseUser } from "@/lib/types";
import { cookies } from "next/headers"; // For potential session management if not relying solely on Firebase SDK client-side state
import { getDoc, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// Note: Firebase Auth typically manages session state on the client-side.
// Server actions can perform auth operations, but redirect/state updates are best handled client-side after action completion.
// For this example, we'll return success/error states.

export async function loginUser(credentials: { email: string; password: string }): Promise<{ success: boolean; error?: string; user?: FirebaseUser }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const firebaseUser = userCredential.user;
    
    // Simulate setting a session cookie or token if needed for server-side rendering based on auth state
    // For now, Firebase client SDK will handle auth persistence.
    // cookies().set("session", firebaseUser.uid, { httpOnly: true, secure: process.env.NODE_ENV === "production" });


    // Check for admin role
    let isAdmin = false;
    if (firebaseUser) {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
        isAdmin = true;
      }
    }

    return { 
      success: true, 
      user: { 
        uid: firebaseUser.uid, 
        email: firebaseUser.email, 
        displayName: firebaseUser.displayName,
        isAdmin,
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function registerUser(credentials: { username?: string; email: string; password: string }): Promise<{ success: boolean; error?: string; user?: FirebaseUser }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
    const firebaseUser = userCredential.user;

    // Optional: Update user profile with username
    if (credentials.username && firebaseUser) {
      await firebaseUpdateProfile(firebaseUser, { displayName: credentials.username });
      // Also save to Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, { email: firebaseUser.email, displayName: credentials.username, role: 'user' }); // Default role to 'user'
    }

    return { success: true, user: { uid: firebaseUser.uid, email: firebaseUser.email, displayName: firebaseUser.displayName, isAdmin: false } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


export async function logoutUser(): Promise<{ success: boolean; error?: string }> {
  try {
    await signOut(auth);
    // cookies().delete("session");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// This function is more for server-side checks if using cookies/tokens.
// Client-side auth state is usually obtained via `onAuthStateChanged`.
export async function getCurrentUserSession(): Promise<FirebaseUser | null> {
  // const session = cookies().get("session")?.value;
  // if (!session || !auth.currentUser) { // This check is problematic on server
  //   return null;
  // }
  // For server components, it's tricky to get Firebase `currentUser` directly without client involvement or passing token.
  // This function's utility is limited in a pure server action context without a custom token verification.
  // We'll rely on client-side auth state for routing and UI updates.
  // The (main)/layout.tsx will handle client-side auth check.
  
  // Placeholder for actual implementation if custom session management is used.
  // For now, this will not be directly used for route protection from server.
  return null; 
}


export async function isUserAdminServer(userId: string): Promise<boolean> {
  if (!userId) return false;
  try {
    const userDocRef = doc(db, "users", userId);
    const userDocSnap = await getDoc(userDocRef);
    if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export async function updateUserProfile(userId: string, data: { displayName: string }): Promise<{ success: boolean; error?: string }> {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    return { success: false, error: "User not authenticated or mismatch." };
  }

  try {
    await firebaseUpdateProfile(currentUser, { displayName: data.displayName });
    // Update in Firestore users collection as well
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, { displayName: data.displayName }, { merge: true });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
