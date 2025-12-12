import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail,
  Briefcase,
  Award,
  DollarSign,
  Filter,
  MessageSquare,
  CheckCircle2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface Contractor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  rating: number;
  reviews: number;
  experience: string;
  phone: string;
  email: string;
  hourlyRate: string;
  description: string;
  verified: boolean;
  certifications: string[];
  completedProjects: number;
}

const Contractors = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [budget, setBudget] = useState("");
  const [projectDetails, setProjectDetails] = useState("");
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);
  const [chatMessage, setChatMessage] = useState("");

  const handleSearch = async () => {
    if (!searchQuery && !specialty && !location) {
      toast({
        title: "Missing Information",
        description: "Please provide at least one search criteria.",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    toast({
      title: "Searching Contractors",
      description: "AI is finding the best matches for your project...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('find-contractors', {
        body: { searchQuery, specialty, location, budget, projectDetails }
      });

      if (error) {
        throw new Error(error.message || 'Failed to search contractors');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.contractors || !Array.isArray(data.contractors)) {
        throw new Error('Invalid data format received');
      }

      if (data.contractors.length === 0) {
        throw new Error('No contractors found matching your criteria. Please try different search terms.');
      }

      setContractors(data.contractors);
      
      toast({
        title: "Search Complete!",
        description: `Found ${data.contractors.length} matching contractors.`,
      });

    } catch (error) {
      console.error('Contractor search error:', error);
      setContractors([]);
      
      toast({
        title: "Search Failed",
        description: error instanceof Error ? error.message : "Failed to find contractors. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleContactContractor = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    toast({
      title: "Contact Initiated",
      description: `You can now message ${contractor.name} directly.`,
    });
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !selectedContractor) return;
    
    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${selectedContractor.name}.`,
    });
    setChatMessage("");
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-accent" />
            Find Contractors
          </h1>
          <p className="text-muted-foreground text-lg">
            Connect with verified local contractors perfectly suited to your project needs
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Search Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 sticky top-24">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-card-foreground mb-1 flex items-center gap-2">
                    <Filter className="w-5 h-5 text-accent" />
                    Search Filters
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Refine your contractor search
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchQuery" className="flex items-center gap-2">
                      <Search className="w-4 h-4" />
                      What do you need?
                    </Label>
                    <Input
                      id="searchQuery"
                      placeholder="e.g., Plumber, Electrician, Builder"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty" className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Specialty
                    </Label>
                    <Select value={specialty} onValueChange={setSpecialty}>
                      <SelectTrigger id="specialty">
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Contractor</SelectItem>
                        <SelectItem value="plumber">Plumber</SelectItem>
                        <SelectItem value="electrician">Electrician</SelectItem>
                        <SelectItem value="mason">Mason</SelectItem>
                        <SelectItem value="carpenter">Carpenter</SelectItem>
                        <SelectItem value="painter">Painter</SelectItem>
                        <SelectItem value="hvac">HVAC Specialist</SelectItem>
                        <SelectItem value="roofing">Roofing Contractor</SelectItem>
                        <SelectItem value="architect">Architect</SelectItem>
                        <SelectItem value="interior">Interior Designer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="Enter city or area"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Budget Range
                    </Label>
                    <Select value={budget} onValueChange={setBudget}>
                      <SelectTrigger id="budget">
                        <SelectValue placeholder="Select budget" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Rs 50,000 - 200,000</SelectItem>
                        <SelectItem value="medium">Rs 200,000 - 500,000</SelectItem>
                        <SelectItem value="high">Rs 500,000 - 1,000,000</SelectItem>
                        <SelectItem value="premium">Rs 1,000,000+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="projectDetails">
                      Project Details (Optional)
                    </Label>
                    <Textarea
                      id="projectDetails"
                      placeholder="Describe your project requirements..."
                      value={projectDetails}
                      onChange={(e) => setProjectDetails(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button 
                    onClick={handleSearch} 
                    className="w-full gap-2 bg-accent hover:bg-accent/90"
                    size="lg"
                    disabled={isSearching}
                  >
                    <Search className="w-4 h-4" />
                    {isSearching ? "Searching..." : "Find Contractors"}
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-4">
            {contractors.length === 0 && !isSearching ? (
              <Card className="p-12">
                <div className="text-center space-y-4">
                  <Users className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-xl font-semibold text-card-foreground mb-2">
                      No Contractors Yet
                    </h3>
                    <p className="text-muted-foreground">
                      Use the search filters to find contractors that match your project needs
                    </p>
                  </div>
                </div>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-foreground">
                    {contractors.length} Contractors Found
                  </h2>
                  <Badge variant="secondary" className="px-3 py-1">
                    AI Matched
                  </Badge>
                </div>

                {contractors.map((contractor) => (
                  <Card key={contractor.id} className="p-6 hover:shadow-strong transition-all duration-300">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-card-foreground">
                              {contractor.name}
                            </h3>
                            {contractor.verified && (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2">
                            {contractor.specialty}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {contractor.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {contractor.experience}
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              {contractor.completedProjects} projects
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            <span className="font-bold text-lg">{contractor.rating}</span>
                            <span className="text-muted-foreground text-sm">
                              ({contractor.reviews})
                            </span>
                          </div>
                          <p className="text-accent font-semibold">
                            {contractor.hourlyRate}
                          </p>
                        </div>
                      </div>

                      <p className="text-muted-foreground">
                        {contractor.description}
                      </p>

                      {contractor.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {contractor.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => window.open(`tel:${contractor.phone}`)}
                        >
                          <Phone className="w-4 h-4" />
                          Call
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-2"
                          onClick={() => window.open(`mailto:${contractor.email}`)}
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </Button>
                        <Button
                          className="flex-1 gap-2 bg-accent hover:bg-accent/90"
                          onClick={() => handleContactContractor(contractor)}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Contact Modal */}
        {selectedContractor && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-2xl w-full p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-card-foreground flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-accent" />
                    Contact {selectedContractor.name}
                  </h2>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedContractor(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="border border-border rounded-lg bg-muted/30 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedContractor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedContractor.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedContractor.location}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Your Message</Label>
                  <Textarea
                    placeholder="Describe your project and requirements..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedContractor(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    className="flex-1 gap-2 bg-accent hover:bg-accent/90"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Send Message
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Contractors;
