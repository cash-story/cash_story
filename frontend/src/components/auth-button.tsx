"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {session.user.image && (
            <img
              src={session.user.image}
              alt={session.user.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium hidden sm:inline">
            {session.user.name}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut()}
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Гарах</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => signIn("google")}
    >
      <LogIn className="w-4 h-4 mr-2" />
      Нэвтрэх
    </Button>
  );
}
