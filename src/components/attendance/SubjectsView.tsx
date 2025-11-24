import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { differenceInWeeks, startOfMonth } from 'date-fns';
import { SubjectScheduleManager } from './SubjectScheduleManager';

interface SubjectsViewProps {
  semester: string;
}

export const SubjectsView = ({ semester }: SubjectsViewProps) => {
  const { user } = useAuth();
  const [showAddSubject, setShowAddSubject] = useState(false);

  const { data: schedules } = useQuery({
    queryKey: ['subject-schedules-all', user?.id, semester],
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

  const { data: attendance } = useQuery({
    queryKey: ['all-attendance', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user?.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const calculateSubjectStats = (subject: string) => {
    if (!attendance || !schedules) {
      return { present: 0, absent: 0, off: 0, total: 0, percentage: 0, expected: 0 };
    }

    const schedule = schedules.find(s => s.subject === subject);
    if (!schedule) return { present: 0, absent: 0, off: 0, total: 0, percentage: 0, expected: 0 };

    const subjectAttendance = attendance.filter(a => a.subject === subject);
    const startDate = subjectAttendance.length > 0 
      ? new Date(subjectAttendance[subjectAttendance.length - 1].date) 
      : startOfMonth(new Date());
    const weeks = Math.max(1, differenceInWeeks(new Date(), startDate) + 1);
    const expected = schedule.weekly_classes * weeks;

    const stats = subjectAttendance.reduce((acc, record) => {
      acc.total++;
      if (record.status === 'present' || record.status === 'late') acc.present++;
      if (record.status === 'absent') acc.absent++;
      return acc;
    }, { present: 0, absent: 0, off: 0, total: 0 });

    const percentage = expected > 0 ? Math.round((stats.present / expected) * 100) : 0;

    return { ...stats, percentage, expected };
  };

  return (
    <div className="space-y-4 pb-20">
      {showAddSubject && (
        <div className="mb-4">
          <SubjectScheduleManager semester={semester} />
          <Button 
            variant="ghost" 
            onClick={() => setShowAddSubject(false)}
            className="w-full mt-2"
          >
            Close
          </Button>
        </div>
      )}

      {!showAddSubject && (
        <Button 
          onClick={() => setShowAddSubject(true)}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Subject
        </Button>
      )}

      {schedules && schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const stats = calculateSubjectStats(schedule.subject);
            const barColor = stats.percentage >= 75 ? 'bg-green-500' : 
                           stats.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500';

            return (
              <Card key={schedule.id} className="p-4 bg-card border-border relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${barColor}`} />
                
                <div className="pl-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">{stats.percentage}</div>
                          <div className="text-xs text-muted-foreground border-t border-border pt-0.5">
                            75
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground text-lg">{schedule.subject}</h4>
                          <p className="text-xs text-muted-foreground capitalize">
                            {schedule.class_type} • {schedule.day_of_week || 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Att: <span className="text-green-500 font-medium">{stats.present}</span></span>
                    <span>Miss: <span className="text-red-500 font-medium">{stats.absent}</span></span>
                    <span>Off: <span className="font-medium">{stats.off}</span></span>
                    <span>Tot: <span className="font-medium">{stats.total}</span></span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No subjects added yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click the button above to add your subjects
          </p>
        </div>
      )}
    </div>
  );
};
