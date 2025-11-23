import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, BookOpen, GraduationCap, Calendar, User, LogOut, Download } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { EditableProfile } from '@/components/EditableProfile';

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('papers');

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

  const { data: questionPapers } = useQuery({
    queryKey: ['question_papers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_papers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: notes } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: syllabus } = useQuery({
    queryKey: ['syllabus'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syllabus')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: events } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

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
              <p className="text-xs text-muted-foreground">Student Dashboard</p>
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
        {/* Welcome Section */}
        <Card className="mb-8 border-2 border-primary/20 shadow-lg animate-slide-up">
          <CardHeader className="gradient-primary text-white rounded-t-lg">
            <CardTitle className="text-2xl">Welcome back, {profile?.name}!</CardTitle>
            <CardDescription className="text-blue-50">
              Access your study materials and stay updated with departmental activities
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Tabs for Resources */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto gap-2 bg-muted/50 p-2 rounded-xl">
            <TabsTrigger value="papers" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Question Papers</span>
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
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:gradient-primary data-[state=active]:text-white">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
          </TabsList>

          {/* Question Papers Tab */}
          <TabsContent value="papers" className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">Previous Year Question Papers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionPapers?.map((paper) => (
                <Card key={paper.id} className="hover:shadow-lg transition-smooth hover:border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{paper.title}</CardTitle>
                    <CardDescription>
                      {paper.subject} • {paper.semester} • {paper.year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleDownload(paper.file_url, paper.file_name)}
                      className="w-full gradient-primary text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {(!questionPapers || questionPapers.length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No question papers available yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">Study Notes</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes?.map((note) => (
                <Card key={note.id} className="hover:shadow-lg transition-smooth hover:border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <CardDescription>
                      {note.subject} • {note.semester}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {note.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{note.description}</p>
                    )}
                    <Button
                      onClick={() => handleDownload(note.file_url, note.file_name)}
                      className="w-full gradient-primary text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {(!notes || notes.length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No notes available yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Syllabus Tab */}
          <TabsContent value="syllabus" className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">Course Syllabus</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {syllabus?.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-smooth hover:border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>
                      {item.semester} • {item.academic_year}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                    )}
                    <Button
                      onClick={() => handleDownload(item.file_url, item.file_name)}
                      className="w-full gradient-primary text-white"
                      size="sm"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {(!syllabus || syllabus.length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No syllabus available yet.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">Upcoming Events & Activities</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {events?.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-smooth hover:border-primary/30">
                  {event.image_url && (
                    <div className="h-48 overflow-hidden rounded-t-lg">
                      <img
                        src={event.image_url}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{event.title}</CardTitle>
                    <CardDescription className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {new Date(event.event_date).toLocaleDateString()}
                        {event.event_time && ` • ${event.event_time}`}
                      </div>
                      {event.location && <div>📍 {event.location}</div>}
                      <div>Organized by: {event.organizer}</div>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{event.description}</p>
                  </CardContent>
                </Card>
              ))}
              {(!events || events.length === 0) && (
                <Card className="col-span-full">
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No upcoming events at the moment.
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-bold text-foreground mb-4">My Profile</h2>
            {profile && <EditableProfile profile={profile} />}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StudentDashboard;
