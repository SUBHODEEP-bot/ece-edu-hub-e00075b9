import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const SyllabusPage = () => {
  const { user } = useAuth();

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

  const { data: syllabus } = useQuery({
    queryKey: ['syllabus', profile?.semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syllabus')
        .select('*')
        .eq('semester', profile?.semester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.semester,
  });

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Handle Google Drive links
    let finalUrl = fileUrl;
    
    if (fileUrl.includes('drive.google.com')) {
      // If it's a folder link, just open it as-is
      if (fileUrl.includes('/folders/')) {
        finalUrl = fileUrl;
      }
      // If it's a file link, ensure it opens in view mode
      else if (fileUrl.includes('/file/d/')) {
        const fileId = fileUrl.match(/\/file\/d\/([^/]+)/)?.[1];
        if (fileId) {
          finalUrl = `https://drive.google.com/file/d/${fileId}/view`;
        }
      }
      // If it's already a direct link, use as-is
      else if (fileUrl.includes('drive.google.com/uc')) {
        finalUrl = fileUrl;
      }
    }
    
    // Open the URL in a new tab
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Course Syllabus</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {syllabus?.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-smooth hover:border-primary/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{item.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {item.semester} • {item.academic_year}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              {item.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              <Button
                onClick={() => handleDownload(item.file_url, item.file_name)}
                className="w-full gradient-primary text-white text-xs sm:text-sm"
                size="sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
    </div>
  );
};
