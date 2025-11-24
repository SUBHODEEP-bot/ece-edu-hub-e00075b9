import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfWeek, endOfWeek, differenceInWeeks } from 'date-fns';
import { cn } from '@/lib/utils';
import { SubjectScheduleManager } from '@/components/attendance/SubjectScheduleManager';
import { DailyAttendanceMarker } from '@/components/attendance/DailyAttendanceMarker';

export const AttendancePage = () => {
  const { user } = useAuth();
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  // Fetch user's semester from profile
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('semester')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch subject schedules
  const { data: schedules } = useQuery({
    queryKey: ['subject-schedules', user?.id, profile?.semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('student_id', user?.id)
        .eq('semester', profile?.semester)
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!profile?.semester,
  });

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', user?.id, fromDate, toDate],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select('*')
        .eq('student_id', user?.id);
      
      if (fromDate) {
        query = query.gte('date', format(fromDate, 'yyyy-MM-dd'));
      }
      if (toDate) {
        query = query.lte('date', format(toDate, 'yyyy-MM-dd'));
      }
      
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Calculate expected vs actual attendance based on schedules
  const calculateAttendanceStats = () => {
    if (!schedules || !attendance) {
      return {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        totalTheory: 0,
        presentTheory: 0,
        totalLab: 0,
        presentLab: 0,
        expectedTotal: 0,
        bySubject: {} as Record<string, { present: number; total: number; expected: number }>,
      };
    }

    // Calculate weeks in date range
    const startDate = fromDate || (attendance.length > 0 ? new Date(attendance[attendance.length - 1].date) : new Date());
    const endDate = toDate || new Date();
    const weeks = Math.max(1, differenceInWeeks(endDate, startDate) + 1);

    // Calculate expected classes based on schedules
    const expectedTotal = schedules.reduce((sum, schedule) => sum + (schedule.weekly_classes * weeks), 0);

    const stats = attendance.reduce((acc, record) => {
      acc.total++;
      
      // Count by class type
      if (record.class_type === 'theory') {
        acc.totalTheory++;
        if (record.status === 'present' || record.status === 'late') acc.presentTheory++;
      } else if (record.class_type === 'lab') {
        acc.totalLab++;
        if (record.status === 'present' || record.status === 'late') acc.presentLab++;
      }
      
      if (record.status === 'present') acc.present++;
      if (record.status === 'absent') acc.absent++;
      if (record.status === 'late') acc.late++;
      
      // Group by subject
      if (!acc.bySubject[record.subject]) {
        const schedule = schedules.find(s => s.subject === record.subject);
        acc.bySubject[record.subject] = { 
          present: 0, 
          total: 0,
          expected: schedule ? schedule.weekly_classes * weeks : 0
        };
      }
      acc.bySubject[record.subject].total++;
      if (record.status === 'present' || record.status === 'late') {
        acc.bySubject[record.subject].present++;
      }
      
      return acc;
    }, { 
      total: 0, 
      present: 0, 
      absent: 0, 
      late: 0, 
      totalTheory: 0,
      presentTheory: 0,
      totalLab: 0,
      presentLab: 0,
      expectedTotal,
      bySubject: {} as Record<string, { present: number; total: number; expected: number }> 
    });

    return stats;
  };

  const stats = calculateAttendanceStats();
  const overallPercentage = stats.expectedTotal > 0 
    ? Math.round(((stats.present + stats.late) / stats.expectedTotal) * 100) 
    : 0;
  const isEligibleForExam = overallPercentage >= 75;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'absent':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'late':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      default:
        return '';
    }
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-6 animate-fade-in px-2 sm:px-0">
      <div className="flex flex-col gap-3">
        <h2 className="text-lg sm:text-2xl font-bold text-foreground">My Attendance</h2>
        
        {/* Date Range Filter - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn("w-full sm:w-auto justify-start text-left font-normal h-9", !fromDate && "text-muted-foreground")}
              >
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{fromDate ? format(fromDate, "PP") : "From Date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn("w-full sm:w-auto justify-start text-left font-normal h-9", !toDate && "text-muted-foreground")}
              >
                <Calendar className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">{toDate ? format(toDate, "PP") : "To Date"}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <CalendarComponent mode="single" selected={toDate} onSelect={setToDate} initialFocus className="pointer-events-auto" />
            </PopoverContent>
          </Popover>
          
          {(fromDate || toDate) && (
            <Button 
              variant="ghost" 
              size="sm"
              className="w-full sm:w-auto h-9"
              onClick={() => { setFromDate(undefined); setToDate(undefined); }}
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Subject Schedule Manager */}
      {profile?.semester && <SubjectScheduleManager semester={profile.semester} />}

      {/* Daily Attendance Marker */}
      {profile?.semester && <DailyAttendanceMarker semester={profile.semester} />}

      {/* Exam Eligibility Banner - Mobile Optimized */}
      <Card className={`border-2 ${isEligibleForExam ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-start gap-3 flex-1">
              {isEligibleForExam ? (
                <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 shrink-0 mt-1" />
              ) : (
                <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 shrink-0 mt-1" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm sm:text-lg font-bold ${isEligibleForExam ? 'text-green-600' : 'text-red-600'}`}>
                  {isEligibleForExam ? 'Exam Eligible' : 'Not Eligible'}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isEligibleForExam 
                    ? 'Meets 75% requirement'
                    : `Need ${75 - overallPercentage}% more`
                  }
                </p>
              </div>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold ${getPercentageColor(overallPercentage)} self-end sm:self-auto`}>
              {overallPercentage}%
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Statistics - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Card className="border hover:shadow-lg transition-smooth border-primary/20">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs">Theory Classes</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{stats.totalTheory}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground mb-2">
              Present: {stats.presentTheory} ({stats.totalTheory > 0 ? Math.round((stats.presentTheory / stats.totalTheory) * 100) : 0}%)
            </p>
            <Progress value={stats.totalTheory > 0 ? (stats.presentTheory / stats.totalTheory) * 100 : 0} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="border hover:shadow-lg transition-smooth border-primary/20">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs">Lab Classes</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{stats.totalLab}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground mb-2">
              Present: {stats.presentLab} ({stats.totalLab > 0 ? Math.round((stats.presentLab / stats.totalLab) * 100) : 0}%)
            </p>
            <Progress value={stats.totalLab > 0 ? (stats.presentLab / stats.totalLab) * 100 : 0} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="border hover:shadow-lg transition-smooth border-primary/20">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs">Total Classes</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground">Combined total</p>
          </CardContent>
        </Card>
      </div>

      {/* Overall Statistics - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <Card className="border hover:shadow-lg transition-smooth col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs">Overall</CardDescription>
            <CardTitle className={`text-2xl sm:text-3xl font-bold ${getPercentageColor(overallPercentage)}`}>
              {overallPercentage}%
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <Progress value={overallPercentage} className="h-1.5 mb-2" />
            <p className="text-xs text-muted-foreground">
              {stats.present + stats.late}/{stats.expectedTotal} expected
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth border-green-500/20">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs">Present</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-green-600">{stats.present + stats.late}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground">Attended</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth border-red-500/20">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs">Absent</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-red-600">{stats.absent}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground">Missed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth border-yellow-500/20">
          <CardHeader className="pb-2 pt-4">
            <CardDescription className="text-xs">Late</CardDescription>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-yellow-600">{stats.late}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xs text-muted-foreground">Delayed</p>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Statistics */}
      {Object.keys(stats.bySubject).length > 0 && (
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Subject-wise Attendance
            </CardTitle>
            <CardDescription>Breakdown by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.bySubject).map(([subject, data]) => {
                const percentage = data.expected > 0 ? Math.round((data.present / data.expected) * 100) : 0;
                return (
                  <div key={subject} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{subject}</span>
                      <span className={`font-bold ${getPercentageColor(percentage)}`}>
                        {percentage}%
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Present: {data.present} / Expected: {data.expected} / Marked: {data.total}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Records */}
      <Card className="border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Attendance Records
          </CardTitle>
          <CardDescription>Your complete attendance history</CardDescription>
        </CardHeader>
        <CardContent>
          {attendance && attendance.length > 0 ? (
            <div className="space-y-3">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-smooth"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-foreground">{record.subject}</div>
                      <Badge variant="outline" className="text-xs">
                        {record.class_type === 'theory' ? 'Theory' : 'Lab'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{record.notes}</p>
                    )}
                  </div>
                  <Badge className={getStatusColor(record.status)} variant="outline">
                    {record.status.toUpperCase()}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No attendance records found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your attendance will appear here once marked by faculty
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
