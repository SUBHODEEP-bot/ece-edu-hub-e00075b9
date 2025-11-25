-- Add type column to syllabus table
ALTER TABLE syllabus 
ADD COLUMN type text NOT NULL DEFAULT 'theory' CHECK (type IN ('theory', 'lab'));