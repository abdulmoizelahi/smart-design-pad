import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { area, quality, location } = await req.json();
    console.log('Estimating cost for:', { area, quality, location });

    // Validate inputs
    if (!area || !quality || !location) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: area, quality, and location are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (area <= 0) {
      return new Response(
        JSON.stringify({ error: 'Area must be greater than 0' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!['basic', 'standard', 'premium', 'luxury'].includes(quality.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: 'Invalid quality level. Must be: basic, standard, premium, or luxury' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Initialize Supabase client to fetch materials data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all materials from database
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*');

    if (materialsError) {
      console.error('Error fetching materials:', materialsError);
      throw new Error('Failed to fetch materials database');
    }

    console.log(`Fetched ${materials?.length || 0} materials from database`);

    // Prepare simplified materials summary for AI context
    const materialsSummary = materials?.map(m => ({
      name: m.name,
      category: m.category,
      unit: m.unit,
      base_price: m.base_price,
      quality_multiplier: m.quality_multiplier,
      regional_adjustments: m.regional_adjustments
    })) || [];

    const systemPrompt = `You are a Pakistan construction cost estimation expert with deep knowledge of local market rates, material prices, and labor costs.
    Use the provided materials data and apply Pakistan-specific pricing considerations.
    You must respond with ONLY a valid JSON object - no markdown formatting, no code blocks, just the raw JSON.
    All costs must be calculated in PKR (Pakistani Rupees) based on current market rates in Pakistan.`;

    const userPrompt = `You are calculating construction costs for Pakistan. Use the provided rate guidelines to give a direct cost estimate.

PROJECT SPECIFICATIONS:
- Total Area: ${area} sq ft
- Quality Level: ${quality}
- Location: ${location}

PAKISTAN CONSTRUCTION RATES (December 2024):

BASE RATES PER SQ FT:
- basic: PKR 2,750/sq ft
- standard: PKR 4,000/sq ft  
- premium: PKR 5,750/sq ft
- luxury: PKR 8,500/sq ft

LOCATION MULTIPLIERS:
- Karachi, Lahore, Islamabad, Rawalpindi: 1.0x (base)
- Faisalabad, Multan, Peshawar, Hyderabad: 0.9x
- Other cities: 0.85x
- Karachi specifically: Add 5% for transport
- Islamabad specifically: Add 10% for regulations

CALCULATION STEPS:
1. Get base rate for "${quality}" quality
2. Multiply base rate × ${area} sq ft = base total
3. Apply location multiplier for "${location}"
4. Split total into components:
   - Materials: 52% of total
   - Labor: 33% of total
   - Equipment: 8% of total
   - Permits: 7% of total

EXAMPLE for 1000 sq ft standard in Lahore:
- Base: 4000 × 1000 = 4,000,000
- Location: 4,000,000 × 1.0 = 4,000,000
- Materials: 4,000,000 × 0.52 = 2,080,000
- Labor: 4,000,000 × 0.33 = 1,320,000
- Equipment: 4,000,000 × 0.08 = 320,000
- Permits: 4,000,000 × 0.07 = 280,000

Now calculate for ${area} sq ft ${quality} quality in ${location}.

Return ONLY this JSON (no markdown, no explanation before/after):
{
  "materials": 0,
  "labor": 0,
  "equipment": 0,
  "permits": 0,
  "total": 0,
  "details": "Estimated at PKR X/sq ft for ${quality} quality in ${location}"
}`;

    console.log('Calling AI gateway for cost estimation...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    let content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    // Clean up response - remove markdown code blocks if present
    content = content.trim();
    content = content.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    // Extract JSON from response more carefully
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Could not find JSON in response:', content);
      throw new Error('Invalid response format from AI');
    }

    let estimate;
    try {
      estimate = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Attempted to parse:', jsonMatch[0].substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
    
    // Validate that all required fields are present and are numbers
    if (
      typeof estimate.materials !== 'number' ||
      typeof estimate.labor !== 'number' ||
      typeof estimate.equipment !== 'number' ||
      typeof estimate.permits !== 'number' ||
      typeof estimate.total !== 'number'
    ) {
      console.error('Invalid estimate format:', estimate);
      throw new Error('AI returned invalid cost estimate format');
    }

    // Round all PKR values to nearest thousand for cleaner presentation
    const estimateInPKR = {
      materials: Math.round(estimate.materials / 1000) * 1000,
      labor: Math.round(estimate.labor / 1000) * 1000,
      equipment: Math.round(estimate.equipment / 1000) * 1000,
      permits: Math.round(estimate.permits / 1000) * 1000,
      total: Math.round(estimate.total / 1000) * 1000,
      details: estimate.details || 'Cost estimate based on current Pakistan market rates',
      currency: 'PKR',
      perSqFtRate: Math.round((estimate.total / area) / 100) * 100
    };
    
    return new Response(
      JSON.stringify(estimateInPKR),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in estimate-cost:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
