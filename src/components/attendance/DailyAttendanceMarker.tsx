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
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg">Mark Attendance</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Record daily attendance</CardDescription>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn("w-full justify-start text-left font-normal h-9")}
              >
                <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{format(selectedDate, "PP")}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
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
      <CardContent className="pt-3">
        {schedules && schedules.length > 0 ? (
          <div className="space-y-2">
            {schedules.map((schedule) => {
              const status = getAttendanceStatus(schedule.subject, schedule.class_type);
              return (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-smooth gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm sm:text-base truncate">{schedule.subject}</span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {schedule.class_type === 'theory' ? 'Theory' : 'Lab'}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground hidden sm:block">
                      {schedule.weekly_classes} classes/week
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
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
                      className={`h-9 w-9 p-0 ${status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}`}
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
                      className={`h-9 w-9 p-0 ${status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
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
                      className={`h-9 w-9 p-0 ${status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <p className="text-sm">Add subjects first to mark attendance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
