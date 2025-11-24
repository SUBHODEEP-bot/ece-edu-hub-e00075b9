import { useState } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Check, X, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

interface AttendanceManagerProps {
  selectedSemester: string;
}

const attendanceSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

const AttendanceManager = ({ selectedSemester }: AttendanceManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState('');

  const form = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      subject: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  // Fetch students by semester
  const { data: students } = useQuery({
    queryKey: ['students', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('semester', selectedSemester)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch existing attendance for selected date and subject
  const { data: existingAttendance } = useQuery({
    queryKey: ['attendance-by-date', selectedDate, selectedSubject, selectedSemester],
    queryFn: async () => {
      if (!selectedDate || !selectedSubject) return [];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)
        .eq('subject', selectedSubject)
        .eq('semester', selectedSemester);
      if (error) throw error;
      return data;
    },
    enabled: !!selectedDate && !!selectedSubject,
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async ({ studentId, status, notes }: { studentId: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('attendance')
        .upsert({
          student_id: studentId,
          subject: selectedSubject,
          date: selectedDate,
          status: status as any,
          semester: selectedSemester,
          marked_by: user?.id || null,
          notes: notes || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-by-date'] });
      toast.success('Attendance marked successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark attendance');
    },
  });

  const bulkMarkAttendance = async (status: string) => {
    if (!selectedDate || !selectedSubject) {
      toast.error('Please select date and subject');
      return;
    }

    const notes = form.getValues('notes');
    
    try {
      const promises = students?.map((student) =>
        markAttendanceMutation.mutateAsync({
          studentId: student.id,
          status,
          notes,
        })
      );
      
      if (promises) {
        await Promise.all(promises);
        toast.success(`All students marked as ${status}`);
        setIsDialogOpen(false);
        form.reset();
      }
    } catch (error) {
      console.error('Bulk attendance error:', error);
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    return existingAttendance?.find((a) => a.student_id === studentId)?.status;
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'present':
        return <Check className="w-4 h-4 text-green-600" />;
      case 'absent':
        return <X className="w-4 h-4 text-red-600" />;
      case 'late':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20';
      case 'absent':
        return 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20';
      case 'late':
        return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Attendance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Marking attendance for: {selectedSemester} Semester
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white gap-2">
              <Plus className="w-4 h-4" />
              Mark Attendance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mark Attendance</DialogTitle>
              <DialogDescription>
                Select subject and date, then mark attendance for students
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Digital Electronics"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSelectedSubject(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            onChange={(e) => {
                              field.onChange(e);
                              setSelectedDate(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Any additional notes..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {selectedSubject && selectedDate && (
                  <>
                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        type="button"
                        onClick={() => bulkMarkAttendance('present')}
                        variant="outline"
                        className="flex-1 border-green-500/50 hover:bg-green-500/10"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Mark All Present
                      </Button>
                      <Button
                        type="button"
                        onClick={() => bulkMarkAttendance('absent')}
                        variant="outline"
                        className="flex-1 border-red-500/50 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Mark All Absent
                      </Button>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <h3 className="font-semibold">Students ({students?.length || 0})</h3>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {students?.map((student) => {
                          const status = getAttendanceStatus(student.id);
                          return (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-3 rounded-lg border hover:shadow-sm"
                            >
                              <div className="flex items-center gap-3">
                                {getStatusIcon(status)}
                                <div>
                                  <p className="font-medium">{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.college_email}</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={status === 'present' ? 'default' : 'outline'}
                                  onClick={() =>
                                    markAttendanceMutation.mutate({
                                      studentId: student.id,
                                      status: 'present',
                                      notes: form.getValues('notes'),
                                    })
                                  }
                                  className={status === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={status === 'late' ? 'default' : 'outline'}
                                  onClick={() =>
                                    markAttendanceMutation.mutate({
                                      studentId: student.id,
                                      status: 'late',
                                      notes: form.getValues('notes'),
                                    })
                                  }
                                  className={status === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                                >
                                  <Clock className="w-3 h-3" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={status === 'absent' ? 'default' : 'outline'}
                                  onClick={() =>
                                    markAttendanceMutation.mutate({
                                      studentId: student.id,
                                      status: 'absent',
                                      notes: form.getValues('notes'),
                                    })
                                  }
                                  className={status === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </form>
            </Form>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      {students && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{students.length}</div>
              <p className="text-sm text-muted-foreground">
                Students in {selectedSemester} Semester
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AttendanceManager;
