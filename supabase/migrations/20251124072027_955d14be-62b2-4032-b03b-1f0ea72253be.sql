-- Add class_type enum
CREATE TYPE class_type AS ENUM ('theory', 'lab');

-- Add class_type column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN class_type class_type NOT NULL DEFAULT 'theory';

-- Add index for better query performance on class type
CREATE INDEX idx_attendance_student_class ON public.attendance(student_id, class_type);