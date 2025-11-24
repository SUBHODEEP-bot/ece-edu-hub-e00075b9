import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export const MarSupportPage = () => {
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

  const { data: marSupports } = useQuery({
    queryKey: ['mar-support', profile?.semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mar_support')
        .select('*')
        .eq('semester', profile?.semester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.semester,
  });

  return (
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Mar Support</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {marSupports?.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-smooth hover:border-primary/30">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">{item.title}</CardTitle>
              {item.description && (
                <CardDescription className="text-xs sm:text-sm">
                  {item.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
              <Button
                onClick={() => window.open(item.link_url, '_blank')}
                className="w-full gradient-primary text-white text-xs sm:text-sm"
                size="sm"
              >
                <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Open Link
              </Button>
            </CardContent>
          </Card>
        ))}
        {(!marSupports || marSupports.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No Mar Support links available yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
