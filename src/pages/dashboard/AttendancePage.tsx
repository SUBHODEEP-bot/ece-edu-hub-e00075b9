import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Home, Grid3x3, Settings } from 'lucide-react';
import { TodayView } from '@/components/attendance/TodayView';
import { TimetableView } from '@/components/attendance/TimetableView';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export const AttendancePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'timetable'>('today');
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentDayOfWeek = format(new Date(), 'EEEE').toLowerCase();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('semester, name')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: schedules } = useQuery({
    queryKey: ['subject-schedules-all', user?.id, profile?.semester],
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

  const calculateTodayStats = () => {
    if (!schedules || !attendance) return { percentage: 0, present: 0, total: 0 };

    const todaySchedules = schedules.filter(s => s.day_of_week === currentDayOfWeek);
    const total = todaySchedules.length;
    const present = attendance.filter(
      a => a.date === today && (a.status === 'present' || a.status === 'late')
    ).length;

    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { percentage, present, total };
  };

  const calculateOverallStats = () => {
    if (!attendance || attendance.length === 0) return { percentage: 0, present: 0, total: 0 };

    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const total = attendance.length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { percentage, present, total };
  };

  const todayStats = calculateTodayStats();
  const stats = calculateOverallStats();

  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Home },
    { id: 'timetable' as const, label: 'Timetable', icon: Grid3x3 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{profile?.name || 'Student'}</h1>
          <div className="flex items-center gap-2">
            <div className={`border rounded px-3 py-1.5 text-sm font-medium ${
              todayStats.percentage >= 75 ? 'bg-green-500/10 border-green-500/20 text-green-700' :
              todayStats.percentage >= 50 ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-700' :
              'bg-red-500/10 border-red-500/20 text-red-700'
            }`}>
              Today: {todayStats.percentage}% ({todayStats.present}/{todayStats.total})
            </div>
            <div className="bg-card border border-border rounded px-3 py-1.5 text-xs text-muted-foreground font-medium">
              Overall: {stats.percentage}% ({stats.present}/{stats.total})
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {profile?.semester && (
          <>
            {activeTab === 'today' && <TodayView semester={profile.semester} />}
            {activeTab === 'timetable' && <TimetableView semester={profile.semester} />}
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="flex items-center justify-around py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 h-auto py-2 px-6 ${
                  activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{tab.label}</span>
              </Button>
            );
          })}
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 px-6 text-muted-foreground"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
