import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Check, X, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

interface DailyAttendanceMarkerProps {
  semester: string;
}

export const DailyAttendanceMarker = ({ semester }: DailyAttendanceMarkerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const { data: schedules } = useQuery({
    queryKey: ['subject-schedules', user?.id, semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('student_id', user?.id)
        .eq('semester', semester)
        .eq('is_active', true)
        .order('subject');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: todayAttendance } = useQuery({
    queryKey: ['daily-attendance', user?.id, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user?.id)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'));
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ 
      subject, 
      status, 
      class_type 
    }: { 
      subject: string; 
      status: 'present' | 'absent' | 'late'; 
      class_type: 'theory' | 'lab';
    }) => {
      const { error } = await supabase.from('attendance').upsert({
        student_id: user?.id,
        subject,
        date: format(selectedDate, 'yyyy-MM-dd'),
        status,
        class_type,
        semester,
        marked_by: user?.id,
      }, {
        onConflict: 'student_id,subject,date,class_type'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark attendance');
    },
  });

  const getAttendanceStatus = (subject: string, class_type: string) => {
    return todayAttendance?.find(
      (a) => a.subject === subject && a.class_type === class_type
    )?.status;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'absent':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'late':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Mark Daily Attendance</CardTitle>
            <CardDescription>Record your attendance for each class</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar 
                mode="single" 
                selected={selectedDate} 
                onSelect={(date) => date && setSelectedDate(date)} 
                initialFocus 
                className="pointer-events-auto" 
              />
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        {schedules && schedules.length > 0 ? (
          <div className="space-y-3">
            {schedules.map((schedule) => {
              const status = getAttendanceStatus(schedule.subject, schedule.class_type);
              return (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:shadow-sm transition-smooth"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{schedule.subject}</span>
                      <Badge variant="outline" className="text-xs">
                        {schedule.class_type === 'theory' ? 'Theory' : 'Lab'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {schedule.weekly_classes} classes/week
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={status === 'present' ? 'default' : 'outline'}
                      onClick={() =>
                        markAttendanceMutation.mutate({
                          subject: schedule.subject,
                          status: 'present',
                          class_type: schedule.class_type,
                        })
                      }
                      disabled={markAttendanceMutation.isPending}
                      className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={status === 'late' ? 'default' : 'outline'}
                      onClick={() =>
                        markAttendanceMutation.mutate({
                          subject: schedule.subject,
                          status: 'late',
                          class_type: schedule.class_type,
                        })
                      }
                      disabled={markAttendanceMutation.isPending}
                      className={status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={status === 'absent' ? 'default' : 'outline'}
                      onClick={() =>
                        markAttendanceMutation.mutate({
                          subject: schedule.subject,
                          status: 'absent',
                          class_type: schedule.class_type,
                        })
                      }
                      disabled={markAttendanceMutation.isPending}
                      className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Add your subjects first to mark attendance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
