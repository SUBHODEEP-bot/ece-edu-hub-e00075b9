-- Add day_of_week column to subject_schedules table
ALTER TABLE subject_schedules ADD COLUMN IF NOT EXISTS day_of_week text;

-- Add a check constraint to ensure valid days
ALTER TABLE subject_schedules DROP CONSTRAINT IF EXISTS valid_day_of_week;
ALTER TABLE subject_schedules ADD CONSTRAINT valid_day_of_week 
  CHECK (day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'));

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_subject_schedules_day ON subject_schedules(day_of_week);

-- Update existing records to have a default day (optional, for existing data)
UPDATE subject_schedules SET day_of_week = 'monday' WHERE day_of_week IS NULL;