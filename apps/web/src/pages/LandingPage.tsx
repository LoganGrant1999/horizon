import { Link } from 'react-router-dom';
import { Button } from '@health-heatmap/ui';
import { TrendingUp, Calendar, Sparkles, Heart } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-accent-peach/10 to-accent-periwinkle/10">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Horizon" className="h-8 w-8" />
              <span className="text-xl font-serif font-bold text-foreground">Horizon</span>
            </div>
            <Link to="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center justify-center min-h-screen px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              Your personal wellness companion
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-foreground leading-tight">
            Understand your health.
            <br />
            <span className="bg-gradient-to-r from-primary via-accent-periwinkle to-primary bg-clip-text text-transparent">
              Plan for a healthy future.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Track your daily wellness patterns, spot trends, and make informed decisions about your
            health—one day at a time.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/signup">
              <Button size="lg" className="text-base px-8 shadow-lg hover:shadow-xl">
                Start Your Journey
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base">
                I already have an account
              </Button>
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-3 justify-center pt-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-border shadow-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Track patterns</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-border shadow-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Daily check-ins</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-border shadow-sm">
              <Heart className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Holistic insights</span>
            </div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl opacity-30 pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent-peach/30 rounded-full blur-3xl opacity-40 pointer-events-none" />
      </main>
    </div>
  );
}