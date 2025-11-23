import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export const EventsPage = () => {
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

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Upcoming Events & Activities</h2>
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
    </div>
  );
};
