-- Add semester field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN semester text DEFAULT '1st';

-- Update existing profiles to have a default semester
UPDATE public.profiles 
SET semester = '1st' 
WHERE semester IS NULL;

-- Make semester not null
ALTER TABLE public.profiles 
ALTER COLUMN semester SET NOT NULL;

-- Add semester field to events table (nullable - events can be for all semesters)
ALTER TABLE public.events 
ADD COLUMN semester text;