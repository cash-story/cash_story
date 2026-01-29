import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Shield,
  Zap,
  Target,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Award,
  Landmark,
  Crown,
} from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="max-w-4xl mx-auto text-center space-y-8 py-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Target className="w-4 h-4" />
            Санхүүгийн эрх чөлөөний төлөвлөгөө
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
            Санхүүгийн <span className="text-primary">эрх чөлөө</span> рүү замаа
            олоорой
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Банкны хуулгаа оруулаад, санхүүгийн үнэлгээ, эрх чөлөөний 4 шат,
            хөрөнгийн өсөлтийн тусгал авах боломжтой. Мянгат малчин стратегиар
            баялгаа бүтээ.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/upload">
              Төлөвлөгөө гаргах
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="#features">Дэлгэрэнгүй</a>
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Үнэгүй ашиглах
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Google-ээр нэвтрэх
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Түүхээ хадгалах
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-5xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Юу мэдэж авах вэ?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Банкны хуулгаас санхүүгийн эрх чөлөөний бүрэн төлөвлөгөө гаргана
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="relative overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-blue-500/10 w-fit">
                <Award className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold">Санхүүгийн үнэлгээ</h3>
              <p className="text-sm text-muted-foreground">
                AA-аас E хүртэл үнэлгээгээр таны санхүүгийн байдлыг тодорхойлно.
                Ганбатын загвар дээр суурилсан.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-green-500/10 w-fit">
                <Target className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold">Эрх чөлөөний 4 шат</h3>
              <p className="text-sm text-muted-foreground">
                Хамгаалалт, тав тух, эрх чөлөө, супер эрх чөлөө - шат бүрт хэдэн
                жилд хүрэхийг тооцоолно.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-amber-500/10 w-fit">
                <Landmark className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold">Мянгат малчин стратеги</h3>
              <p className="text-sm text-muted-foreground">
                Монголын уламжлалт ухаанд суурилсан хөрөнгө төрөлжүүлэлтийн
                зөвлөмж авах.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-purple-500/10 w-fit">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold">
                Хөрөнгийн өсөлтийн тусгал
              </h3>
              <p className="text-sm text-muted-foreground">
                5, 15, 30 жилийн дараах хөрөнгийн өсөлтийг 12% жилийн өгөөжөөр
                тооцоолно.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-red-500/10 w-fit">
                <Shield className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold">Аюулгүй байдал</h3>
              <p className="text-sm text-muted-foreground">
                Таны мэдээлэл аюулгүй хадгалагдаж, зөвхөн танд харагдана.
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="p-3 rounded-lg bg-cyan-500/10 w-fit">
                <FileText className="w-6 h-6 text-cyan-500" />
              </div>
              <h3 className="text-lg font-semibold">Олон банк дэмжинэ</h3>
              <p className="text-sm text-muted-foreground">
                Хаан, Голомт, Хас, ХХБ, Төрийн болон бусад банкуудын хуулга
                дэмжигдэнэ.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Хэрхэн ажилладаг вэ?
          </h2>
          <p className="text-muted-foreground">
            Гурван энгийн алхамаар санхүүгийн эрх чөлөөний төлөвлөгөөгөө авах
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
              1
            </div>
            <h3 className="font-semibold">PDF оруулах</h3>
            <p className="text-sm text-muted-foreground">
              Банкны хуулгаа PDF хэлбэрээр чирж оруулах эсвэл сонгох
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
              2
            </div>
            <h3 className="font-semibold">AI шинжилгээ</h3>
            <p className="text-sm text-muted-foreground">
              Хиймэл оюун ухаан автоматаар гүйлгээнүүдийг уншиж, дүн шинжилгээ
              хийнэ
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
              3
            </div>
            <h3 className="font-semibold">Төлөвлөгөө авах</h3>
            <p className="text-sm text-muted-foreground">
              Үнэлгээ, зорилго, стратеги болон хөрөнгийн тусгал бүхий бүрэн
              төлөвлөгөө авах
            </p>
          </div>
        </div>
      </section>

      {/* 4 Milestones explanation */}
      <section className="max-w-4xl mx-auto">
        <div className="text-center space-y-4 mb-12">
          <h2 className="text-3xl font-bold tracking-tight">
            Санхүүгийн эрх чөлөөний 4 шат
          </h2>
          <p className="text-muted-foreground">
            Таны санхүүгийн аяллын зорилтууд
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6 flex gap-4">
              <div className="p-3 rounded-lg bg-blue-100 h-fit">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  1. Санхүүгийн хамгаалалт
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  6 сарын зардлыг хадгаламжаар нөхөх чадвартай болох
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="p-6 flex gap-4">
              <div className="p-3 rounded-lg bg-green-100 h-fit">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">
                  2. Санхүүгийн тав тух
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Суурь хэрэгцээний 50%-ийг хөрөнгө оруулалтаас авах
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50">
            <CardContent className="p-6 flex gap-4">
              <div className="p-3 rounded-lg bg-purple-100 h-fit">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">
                  3. Санхүүгийн эрх чөлөө
                </h3>
                <p className="text-sm text-purple-700 mt-1">
                  Амьжиргааны бүх зардлыг хөрөнгө оруулалтаас авах
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-6 flex gap-4">
              <div className="p-3 rounded-lg bg-amber-100 h-fit">
                <Crown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900">
                  4. Супер эрх чөлөө
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  ₮1 тэрбумын хөрөнгөтэй болж, өндөр хөрөнгөтний эгнээнд нэгдэх
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-3xl mx-auto">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold">
              Санхүүгийн эрх чөлөө рүү замаа эхлүүлэх цаг болжээ
            </h2>
            <p className="text-muted-foreground">
              Одоо л банкны хуулгаа оруулж, хувийн санхүүгийн төлөвлөгөөгөө авах
            </p>
            <Button size="lg" asChild>
              <Link href="/upload">
                Үнэгүй эхлүүлэх
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
