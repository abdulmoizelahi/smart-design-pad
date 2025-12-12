import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchQuery, specialty, location, budget, projectDetails } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build search criteria
    const searchCriteria: string[] = [];
    if (searchQuery) searchCriteria.push(`Search query: ${searchQuery}`);
    if (specialty) searchCriteria.push(`Specialty: ${specialty}`);
    if (location) searchCriteria.push(`Location: ${location}`);
    if (budget) searchCriteria.push(`Budget range: ${budget}`);
    if (projectDetails) searchCriteria.push(`Project details: ${projectDetails}`);

    const specialtyMap: Record<string, string> = {
      'interior': 'Interior Designer',
      'architect': 'Architect',
      'landscape': 'Landscape Designer',
      'residential': 'Residential Designer',
      'commercial': 'Commercial Designer',
      'kitchen-bath': 'Kitchen & Bath Designer',
      'sustainable': 'Sustainable Design Specialist',
      'lighting': 'Lighting Designer',
      '3d': '3D Visualization Specialist',
      'space-planning': 'Space Planning Expert'
    };

    const specialtyName = specialty ? (specialtyMap[specialty] || specialty) : (searchQuery || 'Interior Designer');
    const searchLocation = location || 'Pakistan';

    const prompt = `You are a designer matching AI assistant for construction and interior design projects in Pakistan.
Generate a list of 6 realistic designers based on these search criteria:

${searchCriteria.join('\n')}

REQUIREMENTS:
- Generate designers with realistic Pakistani/local names
- All designers should be based in or near: ${searchLocation}
- Primary specialty should be: ${specialtyName}
- Use Pakistani phone format: +92-3XX-XXXXXXX
- Use professional email addresses
- Hourly rates in Pakistani Rupees (Rs 1500-5000/hour based on specialty and experience)
- Ratings between 4.2-5.0
- Reviews between 20-180
- Experience between 5-20 years
- Some should be verified (verified: true), others not
- Include 2-4 relevant certifications per designer
- Completed projects between 25-250
- Brief professional descriptions (2-3 sentences) that highlight design philosophy and expertise
- Include 3-5 portfolio highlights for each designer (e.g., "Luxury Villa Design", "Modern Office Space", "Eco-Friendly Home")

SPECIALTY GUIDELINES:
- Interior Designer: Rs 2000-4000/hour, certifications like "NCIDQ Certified", "Certified Interior Designer", "IIDA Member"
- Architect: Rs 2500-5000/hour, certifications like "PEC Registered Architect", "RIBA Member", "LEED Accredited"
- Landscape Designer: Rs 1800-3500/hour, certifications like "Landscape Architecture License", "Sustainable Design Certified"
- Residential Designer: Rs 1800-3500/hour, certifications like "Residential Design Specialist", "Custom Home Expert"
- Commercial Designer: Rs 2200-4500/hour, certifications like "Commercial Design Certified", "Retail Space Expert"
- Kitchen & Bath Designer: Rs 1500-3000/hour, certifications like "NKBA Certified", "Kitchen Design Professional"
- Sustainable Design Specialist: Rs 2000-4000/hour, certifications like "LEED AP", "Green Building Certified"
- Lighting Designer: Rs 1800-3500/hour, certifications like "Lighting Design Certified", "IES Member"
- 3D Visualization Specialist: Rs 2000-3800/hour, certifications like "3D Rendering Expert", "CAD Certified"
- Space Planning Expert: Rs 1900-3600/hour, certifications like "Space Planning Certified", "Ergonomics Specialist"

Portfolio highlights should be relevant to the specialty and impressive project types.

You must respond with ONLY valid JSON - no markdown, no code blocks, no backticks, just raw JSON.

Return ONLY this JSON structure:
{
  "designers": [
    {
      "id": "unique-string-id",
      "name": "Full Pakistani Name",
      "specialty": "Exact Specialty Title",
      "location": "City, Area, Pakistan",
      "rating": 4.8,
      "reviews": 124,
      "experience": "12 years",
      "phone": "+92-3XX-XXXXXXX",
      "email": "professional@email.com",
      "hourlyRate": "Rs 2,500/hour",
      "description": "Professional description highlighting design philosophy and expertise...",
      "verified": true,
      "certifications": ["Certification 1", "Certification 2", "Certification 3"],
      "completedProjects": 156,
      "portfolioHighlights": ["Project Type 1", "Project Type 2", "Project Type 3", "Project Type 4"]
    }
  ]
}`;

    console.log('Calling Lovable AI for designer search...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a designer matching assistant. Always respond with valid JSON only, no markdown or code blocks.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required. Please add funds to your workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response received from AI');
    }

    // Clean up the response - remove markdown code blocks if present
    content = content.trim();
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/g, '');
    
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', content.substring(0, 200));
      throw new Error('Invalid response format from AI');
    }

    const result = JSON.parse(jsonMatch[0]);
    
    if (!result.designers || !Array.isArray(result.designers)) {
      throw new Error('Invalid data format received from AI');
    }

    console.log(`Found ${result.designers.length} designers`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('find-designers error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
