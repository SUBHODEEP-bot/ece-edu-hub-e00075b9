import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Loader2, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LabManual {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  link_url: string | null;
  file_name: string | null;
  semester: string;
  created_at: string;
}

const LabManualsPage = () => {
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
    enabled: !!user?.id,
  });

  const { data: labManuals, isLoading } = useQuery({
    queryKey: ['lab-manuals', profile?.semester],
    queryFn: async () => {
      if (!profile?.semester) return [];

      const { data, error } = await supabase
        .from('lab_manuals')
        .select('*')
        .or(`semester.eq.${profile.semester},semester.eq.ALL`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as LabManual[];
    },
    enabled: !!profile?.semester,
  });

  const handleDownload = async (manual: LabManual) => {
    if (manual.file_url) {
      window.open(manual.file_url, '_blank');
    } else if (manual.link_url) {
      window.open(manual.link_url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header Section - Mobile Optimized */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Lab Manuals</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
              Access lab manual documents and resources
            </p>
          </div>
          {profile?.semester && (
            <Badge variant="outline" className="text-sm sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 w-fit">
              {profile.semester} Semester
            </Badge>
          )}
        </div>
      </div>

      {/* Lab Manuals Grid - Mobile Optimized */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {labManuals && labManuals.length > 0 ? (
          labManuals.map((manual) => (
            <Card key={manual.id} className="hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="flex items-start gap-2 text-base sm:text-lg">
                      {manual.link_url ? (
                        <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                      )}
                      <span className="line-clamp-2 break-words">{manual.title}</span>
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {manual.semester}
                  </Badge>
                </div>
                {manual.description && (
                  <CardDescription className="mt-2 line-clamp-2 text-xs sm:text-sm">
                    {manual.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <Button
                  onClick={() => handleDownload(manual)}
                  className="w-full text-sm sm:text-base"
                  variant="default"
                >
                  {manual.link_url ? (
                    <>
                      <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                      Open Link
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                      View PDF
                    </>
                  )}
                </Button>
                {manual.file_name && (
                  <p className="text-xs text-muted-foreground mt-2 truncate" title={manual.file_name}>
                    {manual.file_name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-8 sm:py-12 text-center px-4">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto text-muted-foreground mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2">No Lab Manuals Available</h3>
              <p className="text-sm sm:text-base text-muted-foreground">
                Lab manuals for your semester will appear here when available.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LabManualsPage;
