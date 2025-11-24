import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TimetableViewProps {
  semester: string;
}

const WEEKDAYS = [
  { id: 'monday', label: 'Mon', fullName: 'Monday' },
  { id: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
  { id: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
  { id: 'thursday', label: 'Thu', fullName: 'Thursday' },
  { id: 'friday', label: 'Fri', fullName: 'Friday' },
  { id: 'saturday', label: 'Sat', fullName: 'Saturday' },
  { id: 'sunday', label: 'Sun', fullName: 'Sunday' },
];

export const TimetableView = ({ semester }: TimetableViewProps) => {
  const { user } = useAuth();
  const currentDayOfWeek = format(new Date(), 'EEEE').toLowerCase();
  const [selectedDay, setSelectedDay] = useState<string>(currentDayOfWeek);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [classType, setClassType] = useState<'theory' | 'lab'>('theory');
  const [weeklyClasses, setWeeklyClasses] = useState('1');

  const { data: schedules, refetch } = useQuery({
    queryKey: ['subject-schedules', user?.id, semester, selectedDay],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('student_id', user?.id)
        .eq('semester', semester)
        .eq('is_active', true)
        .eq('day_of_week', selectedDay);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!semester && !!selectedDay,
  });

  const handleAddSubject = async () => {
    if (!user || !newSubject.trim() || !selectedDay) {
      toast.error('Please enter a subject name');
      return;
    }

    try {
      const { error } = await supabase
        .from('subject_schedules')
        .insert({
          student_id: user.id,
          subject: newSubject.trim(),
          semester,
          class_type: classType,
          weekly_classes: parseInt(weeklyClasses),
          day_of_week: selectedDay,
        });

      if (error) throw error;

      toast.success(`Subject added to ${selectedDayInfo?.fullName}`);
      setNewSubject('');
      setShowAddDialog(false);
      refetch();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
    }
  };

  const selectedDayInfo = WEEKDAYS.find(d => d.id === selectedDay);

  return (
    <div className="space-y-4 pb-20">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {WEEKDAYS.map((day) => {
          const isToday = currentDayOfWeek === day.id;
          const isSelected = selectedDay === day.id;

          return (
            <Button
              key={day.id}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => setSelectedDay(day.id)}
              className={`flex-shrink-0 min-w-[70px] ${isToday ? 'border-primary border-2' : ''}`}
            >
              <div className="text-center">
                <div className="text-xs">{day.label}</div>
                {isToday && <div className="text-xs font-normal mt-0.5">{format(new Date(), 'd')}</div>}
              </div>
            </Button>
          );
        })}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">
            {selectedDayInfo?.fullName}
          </h3>
          <Button size="sm" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Add Subject
          </Button>
        </div>

        {schedules && schedules.length > 0 ? (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <Card key={schedule.id} className="p-3 bg-card border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-foreground">{schedule.subject}</h4>
                    <p className="text-xs text-muted-foreground capitalize">
                      {schedule.class_type} • {schedule.weekly_classes}x per week
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">No subjects for this day</p>
            <p className="text-xs text-muted-foreground mt-1">
              Tap "Add Subject" to add a class
            </p>
          </div>
        )}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject to {selectedDayInfo?.fullName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject Name</Label>
              <Input
                id="subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g., Electronic Devices"
              />
            </div>
            <div>
              <Label htmlFor="type">Class Type</Label>
              <Select value={classType} onValueChange={(v) => setClassType(v as 'theory' | 'lab')}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theory">Theory</SelectItem>
                  <SelectItem value="lab">Lab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weekly">Classes This Day</Label>
              <Input
                id="weekly"
                type="number"
                min="1"
                max="10"
                value={weeklyClasses}
                onChange={(e) => setWeeklyClasses(e.target.value)}
                placeholder="How many classes on this day?"
              />
            </div>
            <Button onClick={handleAddSubject} className="w-full">
              Add to {selectedDayInfo?.label}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
