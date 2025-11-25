import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Folder, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const NotesPage = () => {
  const { user } = useAuth();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

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

  const { data: folders } = useQuery({
    queryKey: ['notes_folders', profile?.semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_folders')
        .select('*')
        .eq('semester', profile?.semester)
        .order('subject_name', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.semester,
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', profile?.semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('semester', profile?.semester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.semester,
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const getNotesByFolder = (folderId: string) => {
    return notes?.filter(n => n.folder_id === folderId) || [];
  };

  const handleDownload = (fileUrl: string) => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Study Notes</h2>
      
      <div className="space-y-3 sm:space-y-4">
        {folders?.map((folder) => {
          const folderNotes = getNotesByFolder(folder.id);
          const isExpanded = expandedFolders.has(folder.id);
          
          return (
            <Card key={folder.id} className="overflow-hidden hover:shadow-lg transition-smooth">
              <CardHeader 
                className="bg-muted/30 cursor-pointer p-4 sm:p-6"
                onClick={() => toggleFolder(folder.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    ) : (
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    )}
                    <Folder className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    <div>
                      <CardTitle className="text-base sm:text-lg">{folder.subject_name}</CardTitle>
                      <p className="text-xs sm:text-sm text-muted-foreground">{folderNotes.length} notes available</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="p-4 sm:p-6">
                  {folderNotes.length === 0 ? (
                    <p className="text-xs sm:text-sm text-muted-foreground text-center py-4">No notes available yet</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {folderNotes.map((note) => (
                        <Card key={note.id} className="border-border/50 hover:border-primary/30 transition-smooth">
                          <CardHeader className="p-3 sm:p-4">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm sm:text-base">{note.title}</CardTitle>
                                {note.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{note.description}</p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-3 sm:p-4 pt-0">
                            <Button
                              onClick={() => handleDownload(note.file_url)}
                              className="w-full gradient-primary text-white text-xs sm:text-sm"
                              size="sm"
                            >
                              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Download
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {(!folders || folders.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground text-sm sm:text-base">
              No notes available yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
