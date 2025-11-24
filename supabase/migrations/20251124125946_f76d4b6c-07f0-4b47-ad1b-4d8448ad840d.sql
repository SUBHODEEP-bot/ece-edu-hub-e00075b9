-- Drop the old unique constraint that doesn't include day_of_week
ALTER TABLE subject_schedules 
DROP CONSTRAINT IF EXISTS subject_schedules_student_id_subject_semester_key;

-- Add new unique constraint that includes day_of_week
-- This allows the same subject on different days but prevents duplicates on the same day
ALTER TABLE subject_schedules 
ADD CONSTRAINT subject_schedules_student_subject_semester_day_key 
UNIQUE (student_id, subject, semester, day_of_week);