import { Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { StudentSidebar } from '@/components/StudentSidebar';
import { ProfilePage } from './dashboard/ProfilePage';
import { QuestionPapersPage } from './dashboard/QuestionPapersPage';
import { NotesPage } from './dashboard/NotesPage';
import { SyllabusPage } from './dashboard/SyllabusPage';
import { EventsPage } from './dashboard/EventsPage';

const StudentDashboard = () => {
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
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
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-muted/20 to-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-card border-b shadow-sm backdrop-blur-sm bg-card/95">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ECE EDU PORTAL</h1>
                <p className="text-xs text-muted-foreground">Student Dashboard</p>
              </div>
            </div>
            <Button onClick={signOut} variant="outline" size="sm" className="gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </header>

        {/* Sidebar */}
        <StudentSidebar />

        {/* Main Content */}
        <main className="flex-1 pt-20 pb-8">
          <div className="container mx-auto px-4">
            {/* Welcome Section */}
            <Card className="mb-8 border-2 border-primary/20 shadow-lg animate-slide-up">
              <CardHeader className="gradient-primary text-white rounded-t-lg">
                <CardTitle className="text-2xl">Welcome back, {profile?.name}!</CardTitle>
                <CardDescription className="text-blue-50">
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
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default StudentDashboard;
