-- Create attendance status enum
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late');

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  date DATE NOT NULL,
  status attendance_status NOT NULL,
  semester TEXT NOT NULL,
  marked_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(student_id, subject, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Students can view their own attendance"
  ON public.attendance
  FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all attendance"
  ON public.attendance
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert attendance"
  ON public.attendance
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update attendance"
  ON public.attendance
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete attendance"
  ON public.attendance
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Create index for better query performance
CREATE INDEX idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX idx_attendance_date ON public.attendance(date);
CREATE INDEX idx_attendance_semester ON public.attendance(semester);