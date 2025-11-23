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
    <div className="space-y-3 sm:space-y-4 animate-fade-in">
      <h2 className="text-xl sm:text-2xl font-bold text-foreground">Upcoming Events & Activities</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {events?.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-smooth hover:border-primary/30">
            {event.image_url && (
              <div className="h-40 sm:h-48 overflow-hidden rounded-t-lg">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">{event.title}</CardTitle>
              <CardDescription className="space-y-1 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  {new Date(event.event_date).toLocaleDateString()}
                  {event.event_time && ` • ${event.event_time}`}
                </div>
                {event.location && <div>📍 {event.location}</div>}
                <div>Organized by: {event.organizer}</div>
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <p className="text-xs sm:text-sm text-muted-foreground">{event.description}</p>
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
