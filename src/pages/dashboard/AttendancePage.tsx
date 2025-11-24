import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Home, Grid3x3, Calendar, List, Settings } from 'lucide-react';
import { TodayView } from '@/components/attendance/TodayView';
import { SubjectsView } from '@/components/attendance/SubjectsView';
import { TimetableView } from '@/components/attendance/TimetableView';
import { Button } from '@/components/ui/button';
import { differenceInWeeks, startOfMonth } from 'date-fns';

export const AttendancePage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'today' | 'timetable' | 'subjects'>('today');

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

  const calculateOverallStats = () => {
    if (!schedules || !attendance) return { percentage: 0, expected: 0 };
    
    const startDate = attendance.length > 0 
      ? new Date(attendance[attendance.length - 1].date) 
      : startOfMonth(new Date());
    const weeks = Math.max(1, differenceInWeeks(new Date(), startDate) + 1);
    const expected = schedules.reduce((sum, s) => sum + (s.weekly_classes * weeks), 0);
    const present = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const percentage = expected > 0 ? Math.round((present / expected) * 100) : 0;
    
    return { percentage, expected };
  };

  const stats = calculateOverallStats();

  const tabs = [
    { id: 'today' as const, label: 'Today', icon: Home },
    { id: 'timetable' as const, label: 'Timetable', icon: Grid3x3 },
    { id: 'subjects' as const, label: 'Subjects', icon: List },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{profile?.name || 'Student'}</h1>
          <div className="flex items-center gap-2">
            <div className="bg-card border border-border rounded px-3 py-1.5 text-sm font-medium">
              {stats.percentage} | 75
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
            {activeTab === 'subjects' && <SubjectsView semester={profile.semester} />}
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
                className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
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
            className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-muted-foreground"
          >
            <Calendar className="w-5 h-5" />
            <span className="text-xs">Calendar</span>
          </Button>
          <Button
            variant="ghost"
            className="flex flex-col items-center gap-1 h-auto py-2 px-4 text-muted-foreground"
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs">Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
