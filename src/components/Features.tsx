import { Card } from "@/components/ui/card";
import { Sparkles, DollarSign, Package, Users, MessageSquare, BarChart } from "lucide-react";
import aiDesignIcon from "@/assets/ai-design-icon.jpg";
import costIcon from "@/assets/cost-icon.jpg";
import materialsIcon from "@/assets/materials-icon.jpg";

const features = [
  {
    icon: Sparkles,
    image: aiDesignIcon,
    title: "AI Design Generator",
    description: "Generate stunning floor plans and 3D visualizations based on your requirements using advanced AI technology.",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: DollarSign,
    image: costIcon,
    title: "Smart Cost Estimation",
    description: "Get accurate budget estimates with detailed material breakdowns and local market insights powered by AI.",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: Package,
    image: materialsIcon,
    title: "Material Optimization",
    description: "Discover cost-effective and sustainable materials tailored to your budget and design preferences.",
    color: "from-orange-500 to-amber-500"
  },
  {
    icon: Users,
    title: "Contractor Matching",
    description: "Connect with verified local contractors and suppliers perfectly suited to your project needs.",
    color: "from-purple-500 to-pink-500"
  },
  {
    icon: MessageSquare,
    title: "AI Chat Assistant",
    description: "Get instant answers to your questions and expert construction advice from our intelligent chatbot.",
    color: "from-indigo-500 to-blue-500"
  },
  {
    icon: BarChart,
    title: "Project Management",
    description: "Track progress, manage timelines, and organize all aspects of your construction project in one place.",
    color: "from-red-500 to-rose-500"
  }
];

export const Features = () => {
  return (
    <section className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
            Everything You Need to Build
          </h2>
          <p className="text-xl text-muted-foreground">
            Comprehensive tools and AI-powered features to turn your dream home into reality
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group p-6 hover:shadow-strong transition-all duration-300 hover:-translate-y-1 border-border bg-card overflow-hidden relative"
            >
              {/* Background gradient on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative z-10 space-y-4">
                {feature.image ? (
                  <div className="w-full h-48 rounded-lg overflow-hidden mb-4">
                    <img 
                      src={feature.image} 
                      alt={feature.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-card-foreground">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
