import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const NotesPage = () => {
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

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Study Notes</h2>
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
    </div>
  );
};
