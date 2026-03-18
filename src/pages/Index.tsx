import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServicesSection from "@/components/ServicesSection";
import MethodologySection from "@/components/MethodologySection";
import CasesSection from "@/components/CasesSection";
import KeywordsSection from "@/components/KeywordsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";

const Index = () => {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <MethodologySection />
        <CasesSection />
        <KeywordsSection />
        <CTASection />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
};

export default Index;
