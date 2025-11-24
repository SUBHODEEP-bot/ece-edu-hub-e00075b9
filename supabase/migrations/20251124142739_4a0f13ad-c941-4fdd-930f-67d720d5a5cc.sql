-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create mar_support table
CREATE TABLE public.mar_support (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  link_url TEXT NOT NULL,
  semester TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.mar_support ENABLE ROW LEVEL SECURITY;

-- Create policies for mar_support
CREATE POLICY "Anyone can view mar support links"
ON public.mar_support
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert mar support links"
ON public.mar_support
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update mar support links"
ON public.mar_support
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete mar support links"
ON public.mar_support
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_mar_support_updated_at
BEFORE UPDATE ON public.mar_support
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();