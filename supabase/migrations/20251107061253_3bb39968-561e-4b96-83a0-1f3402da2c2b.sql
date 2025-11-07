-- Create the handle_updated_at function for automatic timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create materials table for pricing data
CREATE TABLE public.materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  quality_multiplier JSONB NOT NULL DEFAULT '{"standard": 1.0, "premium": 1.5, "luxury": 2.5}'::jsonb,
  regional_adjustments JSONB NOT NULL DEFAULT '{}'::jsonb,
  supplier_info JSONB,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_materials_category ON public.materials(category);

-- Enable RLS but allow public read access
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Materials are viewable by everyone" 
ON public.materials 
FOR SELECT 
USING (true);

-- Insert sample material data
INSERT INTO public.materials (name, category, unit, base_price, quality_multiplier, regional_adjustments, supplier_info, description) VALUES
-- Foundation materials
('Concrete', 'foundation', 'cubic yard', 150.00, '{"standard": 1.0, "premium": 1.3, "luxury": 1.8}'::jsonb, '{"urban": 1.2, "suburban": 1.0, "rural": 0.9}'::jsonb, '{"suppliers": ["ABC Concrete Co", "QuickMix"], "lead_time": "1-2 weeks"}'::jsonb, 'Standard concrete mix for foundations'),
('Rebar Steel', 'foundation', 'ton', 800.00, '{"standard": 1.0, "premium": 1.4, "luxury": 2.0}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.95}'::jsonb, '{"suppliers": ["Steel Supply Inc"], "lead_time": "2-3 weeks"}'::jsonb, 'Reinforcement steel bars'),
('Gravel Base', 'foundation', 'ton', 30.00, '{"standard": 1.0, "premium": 1.2, "luxury": 1.5}'::jsonb, '{"urban": 1.1, "suburban": 1.0, "rural": 0.85}'::jsonb, '{"suppliers": ["Local Quarry"], "lead_time": "immediate"}'::jsonb, 'Crushed stone base material'),

-- Framing materials
('Lumber 2x4', 'framing', 'board foot', 0.85, '{"standard": 1.0, "premium": 1.5, "luxury": 2.2}'::jsonb, '{"urban": 1.25, "suburban": 1.0, "rural": 0.9}'::jsonb, '{"suppliers": ["Lumber Yard Pro", "BuildMart"], "lead_time": "1 week"}'::jsonb, 'Standard framing lumber'),
('Lumber 2x6', 'framing', 'board foot', 1.20, '{"standard": 1.0, "premium": 1.5, "luxury": 2.2}'::jsonb, '{"urban": 1.25, "suburban": 1.0, "rural": 0.9}'::jsonb, '{"suppliers": ["Lumber Yard Pro"], "lead_time": "1 week"}'::jsonb, 'Heavier framing lumber'),
('Plywood Sheathing', 'framing', 'sheet', 45.00, '{"standard": 1.0, "premium": 1.4, "luxury": 1.9}'::jsonb, '{"urban": 1.2, "suburban": 1.0, "rural": 0.92}'::jsonb, '{"suppliers": ["BuildMart"], "lead_time": "immediate"}'::jsonb, '4x8 sheet plywood'),

-- Roofing materials
('Asphalt Shingles', 'roofing', 'square', 120.00, '{"standard": 1.0, "premium": 1.8, "luxury": 3.0}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.95}'::jsonb, '{"suppliers": ["Roof Supply Co"], "lead_time": "1 week"}'::jsonb, 'Standard 3-tab shingles'),
('Metal Roofing', 'roofing', 'square', 350.00, '{"standard": 1.0, "premium": 1.5, "luxury": 2.5}'::jsonb, '{"urban": 1.2, "suburban": 1.0, "rural": 0.9}'::jsonb, '{"suppliers": ["Metal Roof Specialists"], "lead_time": "2-4 weeks"}'::jsonb, 'Standing seam metal roofing'),
('Underlayment', 'roofing', 'roll', 35.00, '{"standard": 1.0, "premium": 1.6, "luxury": 2.2}'::jsonb, '{"urban": 1.1, "suburban": 1.0, "rural": 0.95}'::jsonb, '{"suppliers": ["Roof Supply Co"], "lead_time": "immediate"}'::jsonb, 'Waterproof underlayment'),

-- Exterior materials
('Vinyl Siding', 'exterior', 'square', 180.00, '{"standard": 1.0, "premium": 1.6, "luxury": 2.4}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.93}'::jsonb, '{"suppliers": ["Siding Solutions"], "lead_time": "1-2 weeks"}'::jsonb, 'Standard vinyl siding'),
('Brick Veneer', 'exterior', 'thousand', 800.00, '{"standard": 1.0, "premium": 1.5, "luxury": 2.5}'::jsonb, '{"urban": 1.25, "suburban": 1.0, "rural": 0.88}'::jsonb, '{"suppliers": ["Brick & Stone Co"], "lead_time": "3-4 weeks"}'::jsonb, 'Clay brick veneer'),
('House Wrap', 'exterior', 'roll', 80.00, '{"standard": 1.0, "premium": 1.4, "luxury": 1.8}'::jsonb, '{"urban": 1.1, "suburban": 1.0, "rural": 0.95}'::jsonb, '{"suppliers": ["BuildMart"], "lead_time": "immediate"}'::jsonb, 'Weather barrier wrap'),

-- Interior materials
('Drywall', 'interior', 'sheet', 12.00, '{"standard": 1.0, "premium": 1.3, "luxury": 1.7}'::jsonb, '{"urban": 1.2, "suburban": 1.0, "rural": 0.9}'::jsonb, '{"suppliers": ["Drywall Direct"], "lead_time": "1 week"}'::jsonb, '4x8 drywall sheet'),
('Paint', 'interior', 'gallon', 35.00, '{"standard": 1.0, "premium": 1.8, "luxury": 3.0}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.92}'::jsonb, '{"suppliers": ["Paint Pro", "ColorWorks"], "lead_time": "immediate"}'::jsonb, 'Interior wall paint'),
('Flooring - Hardwood', 'interior', 'square foot', 8.50, '{"standard": 1.0, "premium": 2.0, "luxury": 4.0}'::jsonb, '{"urban": 1.2, "suburban": 1.0, "rural": 0.95}'::jsonb, '{"suppliers": ["Flooring Experts"], "lead_time": "2-3 weeks"}'::jsonb, 'Solid hardwood flooring'),
('Flooring - Tile', 'interior', 'square foot', 4.50, '{"standard": 1.0, "premium": 2.5, "luxury": 5.0}'::jsonb, '{"urban": 1.18, "suburban": 1.0, "rural": 0.93}'::jsonb, '{"suppliers": ["Tile Gallery"], "lead_time": "1-2 weeks"}'::jsonb, 'Ceramic or porcelain tile'),
('Carpet', 'interior', 'square foot', 3.00, '{"standard": 1.0, "premium": 2.0, "luxury": 3.5}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.9}'::jsonb, '{"suppliers": ["Carpet World"], "lead_time": "1 week"}'::jsonb, 'Standard carpet with padding'),

-- Electrical & Plumbing
('Electrical Wire', 'electrical', 'foot', 0.45, '{"standard": 1.0, "premium": 1.3, "luxury": 1.6}'::jsonb, '{"urban": 1.2, "suburban": 1.0, "rural": 0.92}'::jsonb, '{"suppliers": ["Electric Supply"], "lead_time": "immediate"}'::jsonb, 'Romex wiring'),
('Light Fixtures', 'electrical', 'unit', 75.00, '{"standard": 1.0, "premium": 3.0, "luxury": 8.0}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.95}'::jsonb, '{"suppliers": ["Lighting Plus"], "lead_time": "1-2 weeks"}'::jsonb, 'Interior light fixtures'),
('PVC Pipe', 'plumbing', 'foot', 2.50, '{"standard": 1.0, "premium": 1.4, "luxury": 1.8}'::jsonb, '{"urban": 1.18, "suburban": 1.0, "rural": 0.9}'::jsonb, '{"suppliers": ["Plumbing Pro"], "lead_time": "immediate"}'::jsonb, 'PVC drain pipe'),
('Copper Pipe', 'plumbing', 'foot', 6.00, '{"standard": 1.0, "premium": 1.3, "luxury": 1.6}'::jsonb, '{"urban": 1.25, "suburban": 1.0, "rural": 0.88}'::jsonb, '{"suppliers": ["Plumbing Pro"], "lead_time": "1 week"}'::jsonb, 'Copper water supply pipe'),
('Fixtures - Sink', 'plumbing', 'unit', 200.00, '{"standard": 1.0, "premium": 2.5, "luxury": 6.0}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.92}'::jsonb, '{"suppliers": ["Bath & Kitchen"], "lead_time": "1-2 weeks"}'::jsonb, 'Bathroom or kitchen sink'),
('Fixtures - Toilet', 'plumbing', 'unit', 180.00, '{"standard": 1.0, "premium": 2.0, "luxury": 5.0}'::jsonb, '{"urban": 1.15, "suburban": 1.0, "rural": 0.92}'::jsonb, '{"suppliers": ["Bath & Kitchen"], "lead_time": "1 week"}'::jsonb, 'Standard toilet');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_materials_updated_at
BEFORE UPDATE ON public.materials
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();