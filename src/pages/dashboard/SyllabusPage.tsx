import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      // For Supabase storage URLs, use the storage client to avoid Chrome blocking
      if (fileUrl.includes('supabase.co/storage')) {
        // Extract the path from the URL
        const urlParts = fileUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const [bucket, ...pathParts] = urlParts[1].split('/');
          const filePath = pathParts.join('/');
          
          // Download using Supabase client
          const { data, error } = await supabase.storage
            .from(bucket)
            .download(filePath);
          
          if (error) throw error;
          
          // Create blob URL and trigger download
          const url = URL.createObjectURL(data);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('File downloaded successfully!');
        }
      } else {
        // For external URLs, try to open
        window.open(fileUrl, '_blank');
        toast.info('If the file doesn\'t open, please contact your admin to upload it directly to the system.');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Course Syllabus</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {syllabus?.map((item) => (
          <Card 
            key={item.id} 
            className={`hover:shadow-lg transition-smooth ${
              item.type === 'lab' 
                ? 'border-purple-500/50 bg-purple-50/50 dark:bg-purple-950/20' 
                : 'border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20'
            }`}
          >
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                {item.type === 'lab' ? '🧪' : '📚'} {item.title}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {item.semester} • {item.academic_year} • {item.type === 'lab' ? 'Lab' : 'Theory'}
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
