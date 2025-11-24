import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, BookOpen, GraduationCap, Calendar, Users, LogOut, BarChart3, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import QuestionPapersManager from '@/components/admin/QuestionPapersManager';
import NotesManager from '@/components/admin/NotesManager';
import SyllabusManager from '@/components/admin/SyllabusManager';
import EventsManager from '@/components/admin/EventsManager';
import UsersManager from '@/components/admin/UsersManager';

const AdminPanel = () => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedSemester, setSelectedSemester] = useState<string>('1st');

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: studentsCount },
        { count: papersCount },
        { count: notesCount },
        { count: syllabusCount },
        { count: eventsCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('question_papers').select('*', { count: 'exact', head: true }),
        supabase.from('notes').select('*', { count: 'exact', head: true }),
        supabase.from('syllabus').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
      ]);

      return {
        students: studentsCount || 0,
        papers: papersCount || 0,
        notes: notesCount || 0,
        syllabus: syllabusCount || 0,
        events: eventsCount || 0,
      };
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-50 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">ECE EDU PORTAL</h1>
              <p className="text-xs text-muted-foreground">Admin Panel</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" size="sm" className="gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section with Semester Filter */}
        <Card className="mb-8 border-2 border-primary/20 shadow-lg animate-slide-up">
          <CardHeader className="gradient-primary text-white rounded-t-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl">Admin Dashboard</CardTitle>
                <CardDescription className="text-blue-50">
                  Manage all educational resources and user accounts
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <Filter className="w-4 h-4" />
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="w-[150px] bg-white text-foreground border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1st">1st Semester</SelectItem>
                    <SelectItem value="2nd">2nd Semester</SelectItem>
                    <SelectItem value="3rd">3rd Semester</SelectItem>
                    <SelectItem value="4th">4th Semester</SelectItem>
                    <SelectItem value="5th">5th Semester</SelectItem>
                    <SelectItem value="6th">6th Semester</SelectItem>
                    <SelectItem value="7th">7th Semester</SelectItem>
                    <SelectItem value="8th">8th Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 h-auto gap-2 bg-muted/50 p-2 rounded-xl">
            <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="papers" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Papers</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="syllabus" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden sm:inline">Syllabus</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Calendar className="w-4 h-4" />
              <span className="hidden sm:inline">Events</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">Overview Statistics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-smooth border-2 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                  <Users className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats?.students || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Registered users</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-2 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Question Papers
                  </CardTitle>
                  <FileText className="w-5 h-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats?.papers || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Available papers</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-2 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Study Notes
                  </CardTitle>
                  <BookOpen className="w-5 h-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats?.notes || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Uploaded notes</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-2 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Syllabus Items
                  </CardTitle>
                  <GraduationCap className="w-5 h-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats?.syllabus || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Available syllabi</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-2 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Events
                  </CardTitle>
                  <Calendar className="w-5 h-5 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stats?.events || 0}</div>
                  <p className="text-xs text-muted-foreground mt-1">Total events</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-smooth border-2 hover:border-primary/30">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Resources
                  </CardTitle>
                  <BarChart3 className="w-5 h-5 text-accent" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {(stats?.papers || 0) + (stats?.notes || 0) + (stats?.syllabus || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Academic materials</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Question Papers Tab */}
          <TabsContent value="papers" className="animate-fade-in">
            <QuestionPapersManager selectedSemester={selectedSemester} />
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="animate-fade-in">
            <NotesManager selectedSemester={selectedSemester} />
          </TabsContent>

          {/* Syllabus Tab */}
          <TabsContent value="syllabus" className="animate-fade-in">
            <SyllabusManager selectedSemester={selectedSemester} />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="animate-fade-in">
            <EventsManager selectedSemester={selectedSemester} />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="animate-fade-in">
            <UsersManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
