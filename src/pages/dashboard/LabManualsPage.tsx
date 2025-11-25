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
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lab Manuals</h1>
          <p className="text-muted-foreground mt-2">
            Access lab manual documents and resources for your semester
          </p>
        </div>
        {profile?.semester && (
          <Badge variant="outline" className="text-lg px-4 py-2">
            {profile.semester} Semester
          </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {labManuals && labManuals.length > 0 ? (
          labManuals.map((manual) => (
            <Card key={manual.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {manual.link_url ? (
                        <LinkIcon className="w-5 h-5 text-primary" />
                      ) : (
                        <FileText className="w-5 h-5 text-primary" />
                      )}
                      <span className="line-clamp-2">{manual.title}</span>
                    </CardTitle>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    {manual.semester}
                  </Badge>
                </div>
                {manual.description && (
                  <CardDescription className="mt-2 line-clamp-2">
                    {manual.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleDownload(manual)}
                    className="flex-1"
                    variant="default"
                  >
                    {manual.link_url ? (
                      <>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Link
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        View PDF
                      </>
                    )}
                  </Button>
                </div>
                {manual.file_name && (
                  <p className="text-xs text-muted-foreground mt-2 truncate">
                    {manual.file_name}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Lab Manuals Available</h3>
              <p className="text-muted-foreground">
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
