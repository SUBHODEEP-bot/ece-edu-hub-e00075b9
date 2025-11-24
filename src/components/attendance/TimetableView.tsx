import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
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
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [newSubject, setNewSubject] = useState('');
  const [classType, setClassType] = useState<'theory' | 'lab'>('theory');

  const { data: schedules, refetch } = useQuery({
    queryKey: ['subject-schedules-all', user?.id, semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('student_id', user?.id)
        .eq('semester', semester)
        .eq('is_active', true)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!semester,
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
          weekly_classes: 1,
          day_of_week: selectedDay,
        });

      if (error) throw error;

      toast.success('Subject added');
      setNewSubject('');
      setShowAddDialog(false);
      refetch();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast.error('Failed to add subject');
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('subject_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Subject deleted');
      refetch();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
    }
  };

  const getSubjectsForDay = (dayId: string) => {
    return schedules?.filter(s => s.day_of_week === dayId) || [];
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <h3 className="text-xl font-bold text-foreground mb-1">Weekly Timetable</h3>
        <p className="text-sm text-muted-foreground">Manage your class schedule</p>
      </div>

      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const daySubjects = getSubjectsForDay(day.id);
          const isToday = format(new Date(), 'EEEE').toLowerCase() === day.id;

          return (
            <Card key={day.id} className={`p-4 bg-card border-border shadow-sm ${isToday ? 'border-primary border-2' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="text-lg font-bold text-foreground">{day.fullName}</h4>
                  {isToday && <p className="text-xs text-primary font-medium">Today</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDay(day.id);
                    setShowAddDialog(true);
                  }}
                  className="border-primary/20 hover:bg-primary/10"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>

              {daySubjects.length > 0 ? (
                <div className="space-y-2">
                  {daySubjects.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">
                          {schedule.subject}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {schedule.class_type} {schedule.class_type === 'lab' && '(×2)'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSubject(schedule.id)}
                        className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-3 bg-muted/30 rounded-lg">
                  No classes scheduled
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-[90vw] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Add Subject to {WEEKDAYS.find(d => d.id === selectedDay)?.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject" className="text-sm font-medium">Subject Name</Label>
              <Input
                id="subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g., Network, Signal, DSA"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="type" className="text-sm font-medium">Class Type</Label>
              <Select value={classType} onValueChange={(v) => setClassType(v as 'theory' | 'lab')}>
                <SelectTrigger id="type" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="theory">Theory (×1)</SelectItem>
                  <SelectItem value="lab">Lab (×2)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAddSubject} className="w-full" size="lg">
              Add Subject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
