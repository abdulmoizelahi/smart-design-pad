import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Home, 
  DollarSign, 
  MessageSquare, 
  Sparkles,
  Ruler,
  Building,
  Palette,
  Box
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import FloorPlan3D from "@/components/FloorPlan3D";

const Dashboard = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("design");
  
  // Form states
  const [plotLength, setPlotLength] = useState("");
  const [plotWidth, setPlotWidth] = useState("");
  const [rooms, setRooms] = useState("");
  const [style, setStyle] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);

  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [show3D, setShow3D] = useState(false);

  const handleGenerateDesign = async () => {
    if (!plotLength || !plotWidth || !rooms || !style) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to generate your design.",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    toast({
      title: "Generating Design",
      description: "AI is creating your custom floor plan...",
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-design`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plotLength: parseFloat(plotLength),
          plotWidth: parseFloat(plotWidth),
          rooms: parseInt(rooms),
          style
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate design');
      }

      const data = await response.json();
      setGeneratedImage(data.imageUrl);
      
      toast({
        title: "Design Generated!",
        description: "Your custom floor plan is ready.",
      });
    } catch (error) {
      console.error('Design generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Failed to generate design. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimateArea, setEstimateArea] = useState("");
  const [estimateQuality, setEstimateQuality] = useState("");
  const [estimateLocation, setEstimateLocation] = useState("");

  const handleEstimateCost = async () => {
    if (!estimateArea || !estimateQuality || !estimateLocation) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to calculate estimate.",
        variant: "destructive"
      });
      return;
    }

    setIsEstimating(true);
    toast({
      title: "Calculating Costs",
      description: "Analyzing materials and labor for accurate estimation...",
    });

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-cost`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          area: parseFloat(estimateArea),
          quality: estimateQuality,
          location: estimateLocation
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to estimate cost');
      }

      const data = await response.json();
      setCostEstimate(data);
      
      toast({
        title: "Estimate Complete!",
        description: "Your cost breakdown is ready.",
      });
    } catch (error) {
      console.error('Cost estimation error:', error);
      toast({
        title: "Estimation Failed",
        description: error instanceof Error ? error.message : "Failed to calculate estimate. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsEstimating(false);
    }
  };

  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || isSending) return;
    
    const userMessage = { role: "user", content: chatMessage };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setChatMessage("");
    setIsSending(true);
    
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newHistory
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: data.response 
      }]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Chat Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive"
      });
      // Remove the user message if it failed
      setChatHistory(chatHistory);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Your Dashboard
            </h1>
            <p className="text-muted-foreground">
              Design, estimate, and plan your dream home with AI assistance
            </p>
          </div>
          <Button className="gap-2 bg-accent hover:bg-accent/90">
            <Plus className="w-4 h-4" />
            New Project
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="design" className="gap-2">
              <Sparkles className="w-4 h-4" />
              AI Design
            </TabsTrigger>
            <TabsTrigger value="estimate" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Cost Estimate
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>

          {/* AI Design Tab */}
          <TabsContent value="design" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-accent" />
                    AI Design Generator
                  </h2>
                  <p className="text-muted-foreground">
                    Enter your requirements and let AI create custom floor plans for you
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="length" className="flex items-center gap-2">
                          <Ruler className="w-4 h-4" />
                          Plot Length (ft)
                        </Label>
                        <Input
                          id="length"
                          type="number"
                          placeholder="e.g., 50"
                          value={plotLength}
                          onChange={(e) => setPlotLength(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="width" className="flex items-center gap-2">
                          <Ruler className="w-4 h-4" />
                          Plot Width (ft)
                        </Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="e.g., 40"
                          value={plotWidth}
                          onChange={(e) => setPlotWidth(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rooms" className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Number of Rooms
                      </Label>
                      <Input
                        id="rooms"
                        type="number"
                        placeholder="e.g., 4"
                        value={rooms}
                        onChange={(e) => setRooms(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="style" className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Architectural Style
                      </Label>
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger id="style">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modern">Modern</SelectItem>
                          <SelectItem value="traditional">Traditional</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="contemporary">Contemporary</SelectItem>
                          <SelectItem value="colonial">Colonial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleGenerateDesign} 
                      className="w-full gap-2 bg-accent hover:bg-accent/90"
                      size="lg"
                      disabled={isGenerating}
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGenerating ? "Generating..." : "Generate Design"}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-blueprint rounded-lg border-2 border-dashed border-border overflow-hidden min-h-[400px]">
                      {generatedImage ? (
                        <>
                          {show3D ? (
                            <div className="h-[500px]">
                              <FloorPlan3D
                                plotLength={parseFloat(plotLength) || 50}
                                plotWidth={parseFloat(plotWidth) || 40}
                                rooms={parseInt(rooms) || 4}
                                style={style || 'modern'}
                              />
                            </div>
                          ) : (
                            <img 
                              src={generatedImage} 
                              alt="Generated floor plan" 
                              className="w-full h-auto"
                            />
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-[400px]">
                          <div className="text-center space-y-3">
                            <Home className="w-16 h-16 mx-auto text-muted-foreground" />
                            <p className="text-muted-foreground">
                              Your AI-generated floor plan will appear here
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {generatedImage && (
                      <div className="flex gap-2">
                        <Button
                          variant={!show3D ? "default" : "outline"}
                          onClick={() => setShow3D(false)}
                          className="flex-1"
                        >
                          2D View
                        </Button>
                        <Button
                          variant={show3D ? "default" : "outline"}
                          onClick={() => setShow3D(true)}
                          className="flex-1 gap-2"
                        >
                          <Box className="w-4 h-4" />
                          3D View
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Cost Estimate Tab */}
          <TabsContent value="estimate" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-accent" />
                    Smart Cost Estimation
                  </h2>
                  <p className="text-muted-foreground">
                    Get accurate budget estimates based on your design and material choices
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Total Area (sq ft)</Label>
                      <Input 
                        type="number" 
                        placeholder="e.g., 2000" 
                        value={estimateArea}
                        onChange={(e) => setEstimateArea(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Construction Quality</Label>
                      <Select value={estimateQuality} onValueChange={setEstimateQuality}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select quality" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                          <SelectItem value="luxury">Luxury</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input 
                        placeholder="Enter your city" 
                        value={estimateLocation}
                        onChange={(e) => setEstimateLocation(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={handleEstimateCost} 
                      className="w-full gap-2"
                      size="lg"
                      disabled={isEstimating}
                    >
                      {isEstimating ? "Calculating..." : "Calculate Estimate"}
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <Card className="p-4 bg-muted">
                      <h3 className="font-semibold mb-3">Estimated Breakdown</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Materials</span>
                          <span className="font-medium">
                            {costEstimate ? `$${costEstimate.materials.toLocaleString()}` : '$---'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Labor</span>
                          <span className="font-medium">
                            {costEstimate ? `$${costEstimate.labor.toLocaleString()}` : '$---'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equipment</span>
                          <span className="font-medium">
                            {costEstimate ? `$${costEstimate.equipment.toLocaleString()}` : '$---'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Permits & Fees</span>
                          <span className="font-medium">
                            {costEstimate ? `$${costEstimate.permits.toLocaleString()}` : '$---'}
                          </span>
                        </div>
                        <div className="border-t border-border pt-2 mt-2 flex justify-between text-base">
                          <span className="font-semibold">Total Estimate</span>
                          <span className="font-bold text-accent">
                            {costEstimate ? `$${costEstimate.total.toLocaleString()}` : '$---'}
                          </span>
                        </div>
                      </div>
                      {costEstimate?.details && (
                        <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">
                          {costEstimate.details}
                        </p>
                      )}
                    </Card>
                    <p className="text-xs text-muted-foreground">
                      * Estimates are based on average market rates and may vary based on actual conditions and contractor quotes.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-card-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-accent" />
                    AI Construction Assistant
                  </h2>
                  <p className="text-muted-foreground">
                    Ask questions about your project, materials, or construction best practices
                  </p>
                </div>

                <div className="border border-border rounded-lg bg-muted/30">
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <div className="text-center space-y-2">
                          <MessageSquare className="w-12 h-12 mx-auto" />
                          <p>Start a conversation with your AI assistant</p>
                        </div>
                      </div>
                    ) : (
                      chatHistory.map((msg, idx) => (
                        <div 
                          key={idx} 
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user' 
                                ? 'bg-accent text-accent-foreground' 
                                : 'bg-card text-card-foreground border border-border'
                            }`}
                          >
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="border-t border-border p-4">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Ask me anything about your construction project..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                        className="min-h-[60px]"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        className="gap-2"
                        disabled={isSending}
                      >
                        <MessageSquare className="w-4 h-4" />
                        {isSending ? "Sending..." : "Send"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
