import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StudentSidebar } from '@/components/StudentSidebar';
import { NotificationBell } from '@/components/NotificationBell';
import { ProfilePage } from './dashboard/ProfilePage';
import { QuestionPapersPage } from './dashboard/QuestionPapersPage';
import { NotesPage } from './dashboard/NotesPage';
import { SyllabusPage } from './dashboard/SyllabusPage';
import { EventsPage } from './dashboard/EventsPage';
import { AttendancePage } from './dashboard/AttendancePage';
import OrganizersPage from './dashboard/OrganizersPage';
import { MarSupportPage } from './dashboard/MarSupportPage';
import { TimetablePage } from './dashboard/TimetablePage';
import { PYQAnalyzerPage } from './dashboard/PYQAnalyzerPage';

const StudentDashboard = () => {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-sm backdrop-blur-sm bg-card/95">
          <div className="px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <SidebarTrigger />
              <div className="w-8 h-8 sm:w-10 sm:h-10 gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm sm:text-lg md:text-xl font-bold text-foreground">ECE EDU PORTAL</h1>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Student Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button onClick={signOut} variant="outline" size="sm" className="gap-1 sm:gap-2 text-xs sm:text-sm">
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <StudentSidebar />

        {/* Main Content */}
        <main className="flex-1 pt-16 sm:pt-20 pb-6 sm:pb-8">
          <div className="px-3 sm:px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
            {/* Welcome Section */}
            <Card className="mb-4 sm:mb-6 md:mb-8 border-2 border-primary/20 shadow-lg animate-slide-up">
              <CardHeader className="gradient-primary text-white rounded-t-lg p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl md:text-2xl">Welcome back, {profile?.name}!</CardTitle>
                <CardDescription className="text-blue-50 text-xs sm:text-sm">
                  Access your study materials and stay updated with departmental activities
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Routes */}
            <Routes>
              <Route index element={<ProfilePage />} />
              <Route path="papers" element={<QuestionPapersPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="syllabus" element={<SyllabusPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="organizers" element={<OrganizersPage />} />
              <Route path="mar-support" element={<MarSupportPage />} />
              <Route path="attendance" element={<AttendancePage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="pyq-analyzer" element={<PYQAnalyzerPage />} />
          </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;
