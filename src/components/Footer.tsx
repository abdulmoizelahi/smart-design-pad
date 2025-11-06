import { Home, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">Digital Build</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              AI-powered home construction and design platform for the future of building.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">Home</Link></li>
              <li><Link to="/dashboard" className="text-primary-foreground/80 hover:text-accent transition-colors">Dashboard</Link></li>
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">Features</Link></li>
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">Documentation</Link></li>
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">Blog</Link></li>
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">Support</Link></li>
              <li><Link to="/" className="text-primary-foreground/80 hover:text-accent transition-colors">FAQs</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Contact Us</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 text-accent" />
                <span className="text-primary-foreground/80">support@digitalbuild.com</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="w-4 h-4 mt-0.5 text-accent" />
                <span className="text-primary-foreground/80">+1 (555) 123-4567</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-accent" />
                <span className="text-primary-foreground/80">123 Builder St, Construction City</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Digital Build. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
