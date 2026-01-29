import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AuthButton } from "@/components/auth-button";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "МөнгөнТойм - Банкны хуулга шинжлэгч",
  description:
    "Банкны хуулга PDF файлаа оруулж, AI ашиглан санхүүгийн дэлгэрэнгүй тайлан авах",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn" suppressHydrationWarning={true}>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <span className="text-primary-foreground font-bold text-sm">
                        ₮
                      </span>
                    </div>
                    <span className="font-bold text-xl">МөнгөнТойм</span>
                  </div>
                  <AuthButton />
                </div>
              </div>
            </header>

            {/* Main content */}
            <main className="container mx-auto px-4 py-8">{children}</main>

            {/* Footer */}
            <footer className="border-t mt-auto">
              <div className="container mx-auto px-4 py-6">
                <p className="text-center text-sm text-muted-foreground">
                  Таны санхүүгийн мэдээлэл нууцлагдсан бөгөөд хадгалагдахгүй
                </p>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
