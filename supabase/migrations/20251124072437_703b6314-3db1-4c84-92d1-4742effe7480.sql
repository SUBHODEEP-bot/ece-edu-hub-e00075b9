-- Create subject_schedules table for students to define their subjects and weekly class counts
CREATE TABLE public.subject_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  subject text NOT NULL,
  weekly_classes integer NOT NULL CHECK (weekly_classes > 0 AND weekly_classes <= 20),
  class_type class_type NOT NULL DEFAULT 'theory',
  semester text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(student_id, subject, semester)
);

-- Enable RLS
ALTER TABLE public.subject_schedules ENABLE ROW LEVEL SECURITY;

-- Students can view their own schedules
CREATE POLICY "Students can view their own schedules"
ON public.subject_schedules
FOR SELECT
USING (auth.uid() = student_id);

-- Students can insert their own schedules
CREATE POLICY "Students can insert their own schedules"
ON public.subject_schedules
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Students can update their own schedules
CREATE POLICY "Students can update their own schedules"
ON public.subject_schedules
FOR UPDATE
USING (auth.uid() = student_id);

-- Students can delete their own schedules
CREATE POLICY "Students can delete their own schedules"
ON public.subject_schedules
FOR DELETE
USING (auth.uid() = student_id);

-- Admins can view all schedules
CREATE POLICY "Admins can view all schedules"
ON public.subject_schedules
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow students to insert their own attendance
CREATE POLICY "Students can insert their own attendance"
ON public.attendance
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Allow students to update their own attendance (for corrections)
CREATE POLICY "Students can update their own attendance"
ON public.attendance
FOR UPDATE
USING (auth.uid() = student_id);

-- Create index for performance
CREATE INDEX idx_subject_schedules_student ON public.subject_schedules(student_id);
CREATE INDEX idx_subject_schedules_active ON public.subject_schedules(student_id, is_active) WHERE is_active = true;