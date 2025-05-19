"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <main className="w-full max-w-md">{children}</main>
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isLoginPage ? (
            <span>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Sign Up
              </Link>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline">
                Log In{" "}
              </a>
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
