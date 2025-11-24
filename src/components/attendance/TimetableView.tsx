import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TimetableViewProps {
  semester: string;
}

export const TimetableView = ({ semester }: TimetableViewProps) => {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [classType, setClassType] = useState<'theory' | 'lab'>('theory');
  const [weeklyClasses, setWeeklyClasses] = useState('1');

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: schedules, refetch } = useQuery({
    queryKey: ['subject-schedules', user?.id, semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('student_id', user?.id)
        .eq('semester', semester)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!semester,
  });

  const handleAddSubject = async () => {
    if (!user || !newSubject.trim()) {
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
        });

      if (error) throw error;

      toast.success('Subject added to timetable');
      setNewSubject('');
      setShowAddDialog(false);
      setSelectedDay(null);
      refetch();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {weekDays.map((day) => {
          const dayName = format(day, 'EEE');
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isSelected = selectedDay === format(day, 'yyyy-MM-dd');

          return (
            <Button
              key={day.toString()}
              variant={isSelected ? 'default' : 'outline'}
              onClick={() => setSelectedDay(format(day, 'yyyy-MM-dd'))}
              className={`flex-shrink-0 min-w-[80px] ${isToday ? 'border-primary' : ''}`}
            >
              <div className="text-center">
                <div className="text-xs">{dayName}</div>
                <div className="text-lg font-bold">{format(day, 'd')}</div>
              </div>
            </Button>
          );
        })}
      </div>

      {selectedDay && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              {format(new Date(selectedDay), 'EEEE, MMMM d')}
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
      )}

      {!selectedDay && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Select a day to view schedule</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tap on any day above to see classes
          </p>
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Subject to Timetable</DialogTitle>
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
              <Label htmlFor="weekly">Classes per Week</Label>
              <Input
                id="weekly"
                type="number"
                min="1"
                value={weeklyClasses}
                onChange={(e) => setWeeklyClasses(e.target.value)}
              />
            </div>
            <Button onClick={handleAddSubject} className="w-full">
              Add Subject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
