import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              My Subject Schedule
            </CardTitle>
            <CardDescription>Define your subjects and weekly class count</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
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
      <CardContent>
        {schedules && schedules.length > 0 ? (
          <div className="space-y-2">
            {schedules.map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm transition-smooth"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{schedule.subject}</span>
                    <span className="text-xs text-muted-foreground">
                      ({schedule.class_type === 'theory' ? 'Theory' : 'Lab'})
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {schedule.weekly_classes} classes per week
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteScheduleMutation.mutate(schedule.id)}
                  disabled={deleteScheduleMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No subjects added yet</p>
            <p className="text-sm mt-1">Add your subjects to start tracking attendance</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
