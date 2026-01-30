"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Target } from "lucide-react";

export function PageHeader() {
  return (
    <>
      <Button variant="ghost" asChild>
        <Link href="/">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Нүүр хуудас
        </Link>
      </Button>

      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Санхүүгийн Удирдамж Тайлан
        </h1>
        <p className="text-lg text-muted-foreground">
          PDF банкны хуулгаа оруулж, дэлгэрэнгүй санхүүгийн шинжилгээ, эрсдэлийн
          үнэлгээ, зөвлөмжүүд авах
        </p>
      </div>
    </>
  );
}
