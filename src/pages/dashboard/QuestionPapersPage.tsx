import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export const QuestionPapersPage = () => {
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

  const handleDownload = (fileUrl: string, fileName: string) => {
    window.open(fileUrl, '_blank');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Previous Year Question Papers</h2>
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
    </div>
  );
};
