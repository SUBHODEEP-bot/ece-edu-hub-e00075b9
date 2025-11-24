import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const scheduleSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(100, 'Subject name too long'),
  weekly_classes: z.coerce.number().min(1, 'At least 1 class per week').max(20, 'Maximum 20 classes per week'),
  class_type: z.enum(['theory', 'lab']),
  day_of_week: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

interface SubjectScheduleManagerProps {
  semester: string;
}

export const SubjectScheduleManager = ({ semester }: SubjectScheduleManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      subject: '',
      weekly_classes: 4,
      class_type: 'theory',
      day_of_week: 'monday',
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['subject-schedules', user?.id, semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subject_schedules')
        .select('*')
        .eq('student_id', user?.id)
        .eq('semester', semester)
        .eq('is_active', true)
        .order('subject');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addScheduleMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      const { error } = await supabase.from('subject_schedules').insert({
        student_id: user?.id,
        subject: values.subject,
        weekly_classes: values.weekly_classes,
        class_type: values.class_type,
        semester: semester,
        day_of_week: values.day_of_week,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-schedules'] });
      toast.success('Subject schedule added successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add subject schedule');
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('subject_schedules')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subject-schedules'] });
      toast.success('Subject schedule removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove subject schedule');
    },
  });

  const onSubmit = (values: ScheduleFormValues) => {
    addScheduleMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">My Subjects</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Weekly class schedule</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 w-full sm:w-auto h-9">
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subject Schedule</DialogTitle>
                <DialogDescription>
                  Enter subject details and how many classes you have per week
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Electronic Devices" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="day_of_week"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select day" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monday">Monday</SelectItem>
                            <SelectItem value="tuesday">Tuesday</SelectItem>
                            <SelectItem value="wednesday">Wednesday</SelectItem>
                            <SelectItem value="thursday">Thursday</SelectItem>
                            <SelectItem value="friday">Friday</SelectItem>
                            <SelectItem value="saturday">Saturday</SelectItem>
                            <SelectItem value="sunday">Sunday</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weekly_classes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Classes Per Week</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="class_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="theory">Theory</SelectItem>
                            <SelectItem value="lab">Lab</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={addScheduleMutation.isPending}>
                      {addScheduleMutation.isPending ? 'Adding...' : 'Add Subject'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        {schedules && schedules.length > 0 ? (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-smooth gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm sm:text-base truncate">{schedule.subject}</span>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {schedule.class_type === 'theory' ? 'Theory' : 'Lab'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                    {schedule.weekly_classes} classes/week • {schedule.day_of_week || 'Not scheduled'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0"
                  onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                  disabled={deleteScheduleMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-muted-foreground">
            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 opacity-50" />
            <p className="text-sm sm:text-base">No subjects added yet</p>
            <p className="text-xs sm:text-sm mt-1">Add subjects to track attendance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
