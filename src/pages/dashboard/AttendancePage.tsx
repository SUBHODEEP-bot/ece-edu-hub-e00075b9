import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';

export const AttendancePage = () => {
  const { user } = useAuth();

  const { data: attendance, isLoading } = useQuery({
    queryKey: ['attendance', user?.id],
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

  // Calculate attendance statistics
  const stats = attendance?.reduce((acc, record) => {
    acc.total++;
    if (record.status === 'present') acc.present++;
    if (record.status === 'absent') acc.absent++;
    if (record.status === 'late') acc.late++;
    
    // Group by subject
    if (!acc.bySubject[record.subject]) {
      acc.bySubject[record.subject] = { present: 0, total: 0 };
    }
    acc.bySubject[record.subject].total++;
    if (record.status === 'present' || record.status === 'late') {
      acc.bySubject[record.subject].present++;
    }
    
    return acc;
  }, { total: 0, present: 0, absent: 0, late: 0, bySubject: {} as Record<string, { present: number; total: number }> }) || 
  { total: 0, present: 0, absent: 0, late: 0, bySubject: {} };

  const overallPercentage = stats.total > 0 ? Math.round(((stats.present + stats.late) / stats.total) * 100) : 0;

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
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">My Attendance</h2>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 hover:shadow-lg transition-smooth">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Overall Attendance</CardDescription>
            <CardTitle className={`text-3xl font-bold ${getPercentageColor(overallPercentage)}`}>
              {overallPercentage}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallPercentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.present + stats.late} / {stats.total} classes
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth border-green-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Present</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">{stats.present}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Classes attended</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth border-red-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Absent</CardDescription>
            <CardTitle className="text-3xl font-bold text-red-600">{stats.absent}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Classes missed</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-smooth border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardDescription className="text-xs">Late</CardDescription>
            <CardTitle className="text-3xl font-bold text-yellow-600">{stats.late}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Arrived late</p>
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
                const percentage = Math.round((data.present / data.total) * 100);
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
                      {data.present} / {data.total} classes
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
                    <div className="font-semibold text-foreground">{record.subject}</div>
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
