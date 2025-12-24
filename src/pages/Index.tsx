import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import TeaCup from '@/components/TeaCup';
import QRCode from '@/components/QRCode';
import { Menu, LayoutDashboard } from 'lucide-react';

const Index: React.FC = () => {
  const navigate = useNavigate();
  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/menu` 
    : '/menu';

  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <h1 className="font-display text-xl md:text-2xl font-bold text-primary">
            Burger Chiya Pasal
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-16">
        <div className="text-center mb-8 animate-fade-in-up">
          <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4">
            Burger Chiya Pasal
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-md mx-auto">
            बर्गर चिया पसल
          </p>
          <p className="text-base text-muted-foreground mt-2">
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

        {/* Direct Menu Button */}
        <div className="animate-fade-in-up animation-delay-600 flex flex-col sm:flex-row gap-4">
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

        {/* Decorative Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-accent/10 rounded-full blur-3xl" />
      </section>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center text-sm text-muted-foreground bg-background/80 backdrop-blur-md border-t border-border">
        <p>© 2024 Burger Chiya Pasal • Made with ❤️</p>
      </footer>
    </main>
  );
};

export default Index;
