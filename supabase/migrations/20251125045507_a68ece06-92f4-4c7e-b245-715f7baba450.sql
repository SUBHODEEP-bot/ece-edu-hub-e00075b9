-- Create lab_manuals table
CREATE TABLE public.lab_manuals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  link_url TEXT,
  file_name TEXT,
  semester TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.lab_manuals ENABLE ROW LEVEL SECURITY;

-- Create policies for lab manuals
CREATE POLICY "Anyone can view lab manuals"
ON public.lab_manuals
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert lab manuals"
ON public.lab_manuals
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update lab manuals"
ON public.lab_manuals
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete lab manuals"
ON public.lab_manuals
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_lab_manuals_updated_at
BEFORE UPDATE ON public.lab_manuals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();