import { Features } from "@/components/features";
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { ImageShowcase } from "@/components/image-showcase";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <main className="overflow-hidden bg-[#08090d] text-zinc-100">
      <Navbar />
      <Hero />
      <ImageShowcase />
      <Features />
      <Footer />
    </main>
  );
}
