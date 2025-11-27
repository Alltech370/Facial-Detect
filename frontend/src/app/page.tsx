import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StatsGrid } from '@/components/home/StatsGrid';
import { FeaturesSection } from '@/components/home/FeaturesSection';
import { ConnectionTest } from '@/components/ConnectionTest';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-4 sm:py-6 md:py-8 px-4 sm:px-6">
        {/* Hero Section */}
        <section className="text-center py-6 sm:py-8 md:py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-foreground mb-4 sm:mb-6">
              Sistema de Controle de Acesso
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Reconhecimento facial com detecção de liveness para controle de acesso seguro
            </p>
          </div>
        </section>

        {/* Features Section */}
        <FeaturesSection />

        {/* Stats Section */}
        <section className="py-6 sm:py-8 md:py-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">
            Estatísticas do Sistema
          </h2>
          <StatsGrid />
        </section>

        {/* Connection Test Section */}
        <section className="py-6 sm:py-8 md:py-12">
          <div className="flex justify-center">
            <ConnectionTest />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
