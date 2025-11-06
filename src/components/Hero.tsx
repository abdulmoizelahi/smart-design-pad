import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

export const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/85 to-architectural/90" />
      </div>

      {/* Animated grid pattern */}
      <div className="absolute inset-0 z-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
          animation: 'gridMove 20s linear infinite'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 backdrop-blur-sm border border-accent/30">
            <Sparkles className="w-4 h-4 text-accent-foreground" />
            <span className="text-sm font-medium text-accent-foreground">AI-Powered Construction Platform</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-primary-foreground leading-tight">
            Design Your Dream Home
            <span className="block bg-gradient-accent bg-clip-text text-transparent mt-2">
              With AI Precision
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl sm:text-2xl text-primary-foreground/90 max-w-2xl mx-auto leading-relaxed">
            From visualization to estimation, Digital Build guides you through every step of home construction with intelligent AI assistance.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link to="/dashboard">
              <Button 
                size="lg" 
                className="group bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 shadow-strong hover:shadow-accent/50 transition-all hover:scale-105"
              >
                Start Designing
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 bg-primary-foreground/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20"
            >
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-12 max-w-2xl mx-auto">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-primary-foreground">10K+</div>
              <div className="text-sm text-primary-foreground/70">Projects Created</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-primary-foreground">95%</div>
              <div className="text-sm text-primary-foreground/70">Accuracy Rate</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-bold text-primary-foreground">24/7</div>
              <div className="text-sm text-primary-foreground/70">AI Assistant</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
      `}</style>
    </section>
  );
};
