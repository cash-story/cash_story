"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LogIn } from "lucide-react";

export function LoginPrompt() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Button variant="ghost" asChild>
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Нүүр хуудас
        </Link>
      </Button>

      <div className="text-center space-y-6 py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <LogIn className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          Нэвтрэх шаардлагатай
        </h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          Санхүүгийн шинжилгээ хийхийн тулд Google хаягаар нэвтэрнэ үү
        </p>
        <Button size="lg" onClick={() => signIn("google")}>
          <LogIn className="w-5 h-5 mr-2" />
          Google-ээр нэвтрэх
        </Button>
      </div>
    </div>
  );
}
