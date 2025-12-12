import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// USD to PKR conversion rate (you can update this or make it dynamic)
const USD_TO_PKR = 278;

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

    const systemPrompt = `You are a construction cost estimation expert with access to a real materials pricing database.
    Use the provided materials data to calculate accurate costs based on regional adjustments and quality multipliers.
    You must respond with ONLY a valid JSON object - no markdown formatting, no code blocks, just the raw JSON.
    All costs should be calculated in USD first, then will be converted to PKR (Pakistani Rupees).`;

    const userPrompt = `Estimate construction costs for a home construction project in Pakistan.

MATERIALS DATABASE (use this for calculations):
${JSON.stringify(materialsSummary)}

PROJECT SPECIFICATIONS:
- Total Area: ${area} sq ft
- Quality Level: ${quality}
- Location: ${location}

CALCULATION INSTRUCTIONS:
1. Calculate material costs by category (foundation, framing, roofing, exterior, interior, electrical, plumbing)
2. Apply quality_multiplier["${quality}"] to each material's base_price
3. Apply regional_adjustments based on location (determine if urban/suburban/rural)
4. For Pakistan locations, use appropriate regional adjustments for South Asian markets
5. Consider local labor rates and material availability in Pakistan
6. Calculate quantities based on area
7. Add labor costs (40-60% of materials based on quality)
8. Add equipment costs (5-10% of materials + labor)
9. Add permits (1-3% of total)

RESPONSE FORMAT (return ONLY this JSON, no markdown):
{
  "materials": 0,
  "labor": 0,
  "equipment": 0,
  "permits": 0,
  "total": 0,
  "details": "brief explanation of the estimate"
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

    // Convert all USD values to PKR
    const estimateInPKR = {
      materials: Math.round(estimate.materials * USD_TO_PKR),
      labor: Math.round(estimate.labor * USD_TO_PKR),
      equipment: Math.round(estimate.equipment * USD_TO_PKR),
      permits: Math.round(estimate.permits * USD_TO_PKR),
      total: Math.round(estimate.total * USD_TO_PKR),
      details: estimate.details || 'Cost estimate based on current market rates in Pakistan',
      currency: 'PKR',
      conversionRate: USD_TO_PKR
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
