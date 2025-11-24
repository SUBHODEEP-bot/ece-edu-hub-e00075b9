import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useState } from 'react';
import { toast } from 'sonner';

interface TodayViewProps {
  semester: string;
}

export const TodayView = ({ semester }: TodayViewProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDayOfWeek = format(new Date(), 'EEEE').toLowerCase();
  const [markingSubject, setMarkingSubject] = useState<string | null>(null);

  const { data: schedules } = useQuery({
    queryKey: ['subject-schedules-today', user?.id, semester, currentDayOfWeek],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('student_id', user?.id)
        .eq('semester', semester)
        .eq('day_of_week', currentDayOfWeek)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!semester,
  });

  const { data: todayAttendance, refetch } = useQuery({
    queryKey: ['today-attendance', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user?.id)
        .eq('date', today);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const handleMarkAttendance = async (subject: string, status: 'present' | 'absent' | 'late') => {
    if (!user) return;
    setMarkingSubject(subject);

    try {
      const schedule = schedules?.find(s => s.subject === subject);
      if (!schedule) {
        toast.error('Subject schedule not found');
        return;
      }

      const existingRecord = todayAttendance?.find(a => a.subject === subject);

      if (existingRecord) {
        const { error } = await supabase
          .from('attendance')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', existingRecord.id);

        if (error) throw error;
        toast.success('Attendance updated');
      } else {
        const { error } = await supabase
          .from('attendance')
          .insert({
            student_id: user.id,
            subject,
            date: today,
            status,
            semester,
            class_type: schedule.class_type,
          });

        if (error) throw error;
        toast.success('Attendance marked');
      }

      refetch();
      queryClient.invalidateQueries({ queryKey: ['all-attendance', user.id] });
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
    } finally {
      setMarkingSubject(null);
    }
  };

  const getAttendanceStatus = (subject: string) => {
    return todayAttendance?.find(a => a.subject === subject)?.status;
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <h3 className="text-2xl font-bold text-foreground mb-1">
          {format(new Date(), 'EEEE, MMMM d')}
        </h3>
        <p className="text-sm text-muted-foreground">Mark your attendance for today</p>
      </div>

      {schedules && schedules.length > 0 ? (
        <div className="space-y-3">
          {schedules.map((schedule) => {
            const status = getAttendanceStatus(schedule.subject);
            const isMarking = markingSubject === schedule.subject;

            return (
              <Card key={schedule.id} className="p-4 bg-card border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{schedule.subject}</h4>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">
                      {schedule.class_type} Class {schedule.class_type === 'lab' && '(×2)'}
                    </p>
                  </div>
                  {status && (
                    <div className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${
                      status === 'present' ? 'bg-green-500/20 text-green-700' :
                      status === 'late' ? 'bg-yellow-500/20 text-yellow-700' :
                      'bg-red-500/20 text-red-700'
                    }`}>
                      {status}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="lg"
                    onClick={() => handleMarkAttendance(schedule.subject, 'present')}
                    disabled={isMarking}
                    className={`flex flex-col items-center gap-1 h-auto py-3 ${
                      status === 'present' 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-green-500/10 hover:bg-green-500/20 text-green-700 border border-green-500/20'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-xs font-semibold">Present</span>
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleMarkAttendance(schedule.subject, 'late')}
                    disabled={isMarking}
                    className={`flex flex-col items-center gap-1 h-auto py-3 ${
                      status === 'late'
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-700 border border-yellow-500/20'
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-xs font-semibold">Late</span>
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => handleMarkAttendance(schedule.subject, 'absent')}
                    disabled={isMarking}
                    className={`flex flex-col items-center gap-1 h-auto py-3 ${
                      status === 'absent'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-red-500/10 hover:bg-red-500/20 text-red-700 border border-red-500/20'
                    }`}
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="text-xs font-semibold">Absent</span>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-lg font-semibold text-foreground mb-1">No classes today</p>
          <p className="text-sm text-muted-foreground">
            Go to Timetable to add subjects for {format(new Date(), 'EEEE')}
          </p>
        </div>
      )}
    </div>
  );
};
