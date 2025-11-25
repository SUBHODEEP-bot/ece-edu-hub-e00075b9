-- Create notes_folders table for organizing notes by subject
CREATE TABLE public.notes_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_name TEXT NOT NULL,
  semester TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Add folder_id to notes table
ALTER TABLE public.notes
ADD COLUMN folder_id UUID REFERENCES public.notes_folders(id) ON DELETE CASCADE;

-- Enable RLS on notes_folders
ALTER TABLE public.notes_folders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notes_folders
CREATE POLICY "Anyone can view notes folders"
ON public.notes_folders
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert notes folders"
ON public.notes_folders
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update notes folders"
ON public.notes_folders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete notes folders"
ON public.notes_folders
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at on notes_folders
CREATE TRIGGER update_notes_folders_updated_at
BEFORE UPDATE ON public.notes_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();