import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
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
    <div className="space-y-4 pb-20">
      <div className="text-center py-4">
        <h3 className="text-lg font-bold text-foreground">Weekly Timetable</h3>
        <p className="text-sm text-muted-foreground">Add subjects to each day</p>
      </div>

      <div className="space-y-3">
        {WEEKDAYS.map((day) => {
          const daySubjects = getSubjectsForDay(day.id);

          return (
            <Card key={day.id} className="p-4 bg-card border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground">{day.fullName}</h4>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedDay(day.id);
                    setShowAddDialog(true);
                  }}
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
                      className="flex items-center justify-between bg-muted/50 rounded-md p-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {schedule.subject}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {schedule.class_type}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteSubject(schedule.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-2">
                  No subjects added
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Subject to {WEEKDAYS.find(d => d.id === selectedDay)?.fullName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject Name</Label>
              <Input
                id="subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g., Network, Signal, DSA"
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
            <Button onClick={handleAddSubject} className="w-full">
              Add Subject
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
