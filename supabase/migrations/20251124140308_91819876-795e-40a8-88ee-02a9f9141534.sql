-- Create storage bucket for syllabus files
INSERT INTO storage.buckets (id, name, public)
VALUES ('syllabus', 'syllabus', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for syllabus bucket
CREATE POLICY "Anyone can view syllabus files"
ON storage.objects FOR SELECT
USING (bucket_id = 'syllabus');

CREATE POLICY "Admins can upload syllabus files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'syllabus' 
  AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY "Admins can update syllabus files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'syllabus' 
  AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);

CREATE POLICY "Admins can delete syllabus files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'syllabus' 
  AND auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin')
);