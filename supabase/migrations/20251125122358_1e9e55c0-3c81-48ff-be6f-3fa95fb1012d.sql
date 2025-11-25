-- Create pyq_folders table for organizing question papers by subject
CREATE TABLE public.pyq_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_name TEXT NOT NULL,
  semester TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add folder_id to question_papers table
ALTER TABLE public.question_papers
ADD COLUMN folder_id UUID REFERENCES public.pyq_folders(id) ON DELETE CASCADE;

-- Enable RLS on pyq_folders
ALTER TABLE public.pyq_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pyq_folders
CREATE POLICY "Anyone can view folders"
ON public.pyq_folders
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert folders"
ON public.pyq_folders
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update folders"
ON public.pyq_folders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete folders"
ON public.pyq_folders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on pyq_folders
CREATE TRIGGER update_pyq_folders_updated_at
BEFORE UPDATE ON public.pyq_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();