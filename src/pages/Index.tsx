import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TeaCup from '@/components/TeaCup';
import QRCode from '@/components/QRCode';
import { Menu, LayoutDashboard } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/menu?mode=customer` 
    : '/menu?mode=customer';

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
     

      {/* Hero Section */}
      <section className="min-h-screen relative flex flex-col items-center justify-center px-4 pt-12">
        {/* Animated Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Soft glowing blobs */}
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/3 -right-16 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-2xl animate-pulse" />

          {/* Floating tea & food icons */}
          <div className="absolute bottom-16 left-10 text-6xl opacity-20 animate-bounce">
            ☕
          </div>
          <div className="absolute top-16 right-12 text-6xl opacity-20 animate-bounce">
            🍔
          </div>
          <div className="absolute top-12 left-14 text-6xl opacity-15 animate-bounce animation-delay-200">
            🍔
          </div>
          <div className="absolute bottom-12 right-16 text-6xl opacity-15 animate-bounce animation-delay-300">
            ☕
          </div>
        </div>

        {/* Foreground Content */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="text-center mb-8 animate-fade-in-up">
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
                Garage Chiya
            </h2>
            <p className="text-lg md:text-xl text-foreground max-w-md mx-auto">
            ग्यारेज चिया
            </p>
            <p className="text-base text-foreground mt-2">
              Fresh Tea, Delicious Food, Great Vibes
            </p>
          </div>

          {/* Tea Cup Animation */}
          <div className="mb-12 animate-fade-in-up animation-delay-200">
            <TeaCup />
          </div>

          {/* QR Code */}
          <div className="animate-fade-in-up animation-delay-400 mb-8">
            <QRCode url={menuUrl} />
          </div>

          {/* QR Code */}
          <div className="animate-fade-in-up animation-delay-600 flex flex-col items-center sm:flex-row gap-4">
            <Button
              onClick={() => navigate('/menu')}
              size="xl"
              variant="hero"
              className="gap-2"
            >
              <Menu className="h-5 w-5" />
              View Menu
            </Button>
          </div>
          

          {/* Footer Text */}
          <div className="mt-6 text-sm text-foreground animate-fade-in-up animation-delay-800 text-center">
            <p>© 2025 Garage chiya • Made with ❤️</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      
    </main>
  );
};

export default Index;
