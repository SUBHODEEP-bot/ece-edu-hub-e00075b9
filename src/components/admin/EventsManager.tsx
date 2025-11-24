import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface EventsManagerProps {
  selectedSemester: string;
}

const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  event_date: z.string().min(1, 'Event date is required'),
  event_time: z.string().optional(),
  location: z.string().optional(),
  organizer: z.string().min(1, 'Organizer is required'),
  semester: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal('')),
  is_active: z.boolean(),
});

type EventFormValues = z.infer<typeof eventSchema>;

const EventsManager = ({ selectedSemester }: EventsManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_date: '',
      event_time: '',
      location: '',
      organizer: '',
      semester: selectedSemester,
      image_url: '',
      is_active: true,
    },
  });

  const { data: events } = useQuery({
    queryKey: ['admin-events', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('semester', selectedSemester)
        .order('event_date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSave = async (values: EventFormValues) => {
    setLoading(true);
    try {
      const cleanedValues = {
        ...values,
        image_url: values.image_url || null,
        semester: values.semester === 'ALL' ? null : values.semester, // Convert 'ALL' to null
        event_time: values.event_time || null,
        location: values.location || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('events')
          .update(cleanedValues)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Event updated successfully');
      } else {
        const { error } = await supabase
          .from('events')
          .insert([{ 
            title: values.title,
            description: values.description,
            event_date: values.event_date,
            event_time: values.event_time || null,
            location: values.location || null,
            organizer: values.organizer,
            semester: values.semester === 'ALL' ? null : values.semester, // Convert 'ALL' to null
            image_url: values.image_url || null,
            is_active: values.is_active,
            created_by: user?.id 
          }]);
        if (error) throw error;
        toast.success('Event added successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-events', selectedSemester] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event: any) => {
    setEditingId(event.id);
    form.reset({
      title: event.title,
      description: event.description,
      event_date: event.event_date,
      event_time: event.event_time || '',
      location: event.location || '',
      organizer: event.organizer,
      semester: event.semester || 'ALL', // Use 'ALL' for null/empty semester
      image_url: event.image_url || '',
      is_active: event.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Event deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-events', selectedSemester] });
      queryClient.invalidateQueries({ queryKey: ['admin-events'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Events</h2>
          <p className="text-sm text-muted-foreground mt-1">Viewing: {selectedSemester} Semester</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white gap-2" onClick={() => { setEditingId(null); form.reset({ semester: selectedSemester }); }}>
              <Plus className="w-4 h-4" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Event</DialogTitle>
              <DialogDescription>Fill in the details below</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tech Fest 2025" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Event description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="event_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="event_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Time (Optional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Auditorium" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="organizer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organizer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ECE Department" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester (Optional - Leave blank for all semesters)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester or leave blank" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ALL">All Semesters</SelectItem>
                          <SelectItem value="1st">1st Semester</SelectItem>
                          <SelectItem value="2nd">2nd Semester</SelectItem>
                          <SelectItem value="3rd">3rd Semester</SelectItem>
                          <SelectItem value="4th">4th Semester</SelectItem>
                          <SelectItem value="5th">5th Semester</SelectItem>
                          <SelectItem value="6th">6th Semester</SelectItem>
                          <SelectItem value="7th">7th Semester</SelectItem>
                          <SelectItem value="8th">8th Semester</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>Active Status</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Make this event visible to students
                        </p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit" className="gradient-primary text-white" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {events?.map((event) => (
          <Card key={event.id} className="hover:shadow-lg transition-smooth">
            {event.image_url && (
              <div className="h-48 overflow-hidden rounded-t-lg">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{event.title}</CardTitle>
                {!event.is_active && (
                  <span className="text-xs px-2 py-1 bg-muted rounded">Inactive</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {new Date(event.event_date).toLocaleDateString()}
                {event.event_time && ` • ${event.event_time}`}
              </p>
              {event.location && <p className="text-sm text-muted-foreground">📍 {event.location}</p>}
              <p className="text-sm text-muted-foreground">By: {event.organizer}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">{event.description}</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(event)} className="flex-1">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(event.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default EventsManager;
