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
    const { plotLength, plotWidth, rooms, floors, style, openArea } = await req.json();
    console.log('Generating design for:', { plotLength, plotWidth, rooms, floors, style, openArea });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Validate inputs
    if (!plotLength || !plotWidth || !rooms || !floors || !style) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (plotLength <= 0 || plotWidth <= 0 || rooms <= 0 || floors <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid dimensions, room count, or floor count' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate covered area
    const totalArea = plotLength * plotWidth;
    const coveredArea = openArea ? totalArea - openArea : totalArea;
    const floorsNum = parseInt(floors);

    // Validate open area
    if (openArea && openArea < 0) {
      return new Response(
        JSON.stringify({ error: 'Open area cannot be negative' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (openArea && openArea >= totalArea) {
      return new Response(
        JSON.stringify({ error: 'Open area cannot be equal to or greater than total plot area' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (coveredArea < 500) {
      return new Response(
        JSON.stringify({ error: 'Built-up area is too small for the requested number of rooms' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate floor plan using AI image generation
    const floorText = floorsNum === 1 ? 'single-story' : `${floorsNum}-story`;
    const prompt = `Create a professional architectural floor plan for a ${style} style ${floorText} house. 
    Plot dimensions: ${plotLength}ft x ${plotWidth}ft (Total: ${totalArea} sq ft). 
    Number of rooms: ${rooms} across ${floorsNum} floor(s).
    ${openArea ? `Open area required: ${openArea} sq ft (for lawn, courtyard, garden, or terrace).` : ''}
    ${openArea ? `Covered/Built area per floor: ${coveredArea} sq ft.` : ''}
    ${floorsNum > 1 ? `Show floor plans for all ${floorsNum} floors separately or stacked view with labels (Ground Floor, First Floor, etc.).` : ''}
    ${floorsNum > 1 ? 'Include staircase placement connecting the floors.' : ''}
    The floor plan should be a top-down 2D view with clear room labels, dimensions, doors, and windows.
    Use a clean architectural drawing style with black lines on white background.
    Include bedroom(s), bathroom(s), kitchen, living room, and other necessary spaces distributed across ${floorsNum} floor(s).
    ${openArea ? 'Mark the open area clearly (lawn/courtyard/garden) separate from the built structure.' : ''}
    Show proper spacing and realistic room proportions for each floor.`;

    console.log('Calling AI gateway for image generation...');
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        modalities: ['image', 'text']
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
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      throw new Error('No image generated');
    }

    return new Response(
      JSON.stringify({ 
        imageUrl,
        specifications: {
          plotLength,
          plotWidth,
          rooms,
          floors: floorsNum,
          style,
          totalArea,
          openArea: openArea || 0,
          coveredArea: openArea ? coveredArea : totalArea
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-design:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
