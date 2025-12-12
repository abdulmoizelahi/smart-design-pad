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
      'general': 'General Contractor',
      'plumber': 'Plumber',
      'electrician': 'Electrician',
      'mason': 'Mason',
      'carpenter': 'Carpenter',
      'painter': 'Painter',
      'hvac': 'HVAC Specialist',
      'roofing': 'Roofing Contractor',
      'architect': 'Architect',
      'interior': 'Interior Designer'
    };

    const specialtyName = specialty ? (specialtyMap[specialty] || specialty) : (searchQuery || 'General Contractor');
    const searchLocation = location || 'Pakistan';

    const prompt = `You are a contractor matching AI assistant for construction projects in Pakistan.
Generate a list of 6 realistic contractors based on these search criteria:

${searchCriteria.join('\n')}

REQUIREMENTS:
- Generate contractors with realistic Pakistani/local names
- All contractors should be based in or near: ${searchLocation}
- Primary specialty should be: ${specialtyName}
- Use Pakistani phone format: +92-3XX-XXXXXXX
- Use professional email addresses
- Hourly rates in Pakistani Rupees (Rs 500-3000/hour based on specialty and experience)
- Ratings between 4.0-5.0
- Reviews between 15-150
- Experience between 5-20 years
- Some should be verified (verified: true), others not
- Include 2-4 relevant certifications per contractor
- Completed projects between 20-200
- Brief professional descriptions (2-3 sentences) that highlight expertise

SPECIALTY GUIDELINES:
- General Contractor: Rs 1200-2500/hour, certifications like "Licensed Contractor", "PEC Registered"
- Plumber: Rs 800-1500/hour, certifications like "Plumbing License", "Gas Line Certified"
- Electrician: Rs 900-1800/hour, certifications like "Licensed Electrician", "High Voltage Certified"
- Mason: Rs 700-1400/hour, certifications like "Masonry Expert", "Structural Work Certified"
- Carpenter: Rs 800-1600/hour, certifications like "Carpentry Master", "Furniture Design Certified"
- Painter: Rs 600-1200/hour, certifications like "Professional Painter", "Interior Finish Specialist"
- HVAC: Rs 1000-2000/hour, certifications like "HVAC Certified", "Refrigeration Expert"
- Roofing: Rs 900-1700/hour, certifications like "Roofing Specialist", "Waterproofing Expert"
- Architect: Rs 2000-3500/hour, certifications like "PEC Registered Architect", "RIBA Member"
- Interior Designer: Rs 1500-3000/hour, certifications like "Certified Interior Designer", "IIDA Member"

You must respond with ONLY valid JSON - no markdown, no code blocks, no backticks, just raw JSON.

Return ONLY this JSON structure:
{
  "contractors": [
    {
      "id": "unique-string-id",
      "name": "Full Pakistani Name",
      "specialty": "Exact Specialty Title",
      "location": "City, Area, Pakistan",
      "rating": 4.7,
      "reviews": 89,
      "experience": "10 years",
      "phone": "+92-3XX-XXXXXXX",
      "email": "professional@email.com",
      "hourlyRate": "Rs 1,500/hour",
      "description": "Professional description highlighting expertise and experience...",
      "verified": true,
      "certifications": ["Certification 1", "Certification 2", "Certification 3"],
      "completedProjects": 134
    }
  ]
}`;

    console.log('Calling Lovable AI for contractor search...');
    
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
            content: 'You are a contractor matching assistant. Always respond with valid JSON only, no markdown or code blocks.'
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
    
    if (!result.contractors || !Array.isArray(result.contractors)) {
      throw new Error('Invalid data format received from AI');
    }

    console.log(`Found ${result.contractors.length} contractors`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('find-contractors error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
