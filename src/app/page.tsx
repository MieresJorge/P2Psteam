// src/app/page.tsx
import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/layout/Footer";

export default function HomePage() {
  return (
    <div className="bg-gray-900">
      <Navbar />
      <main className="container mx-auto px-4">
        <HeroSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}