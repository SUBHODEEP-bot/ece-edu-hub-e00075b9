import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

interface NotesManagerProps {
  selectedSemester: string;
}

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  semester: z.string().min(1, 'Semester is required'),
  description: z.string().optional(),
  file_url: z.string().url('Must be a valid URL'),
  file_name: z.string().min(1, 'File name is required'),
});

type NoteFormValues = z.infer<typeof noteSchema>;

const NotesManager = ({ selectedSemester }: NotesManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      subject: '',
      semester: selectedSemester,
      description: '',
      file_url: '',
      file_name: '',
    },
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSave = async (values: NoteFormValues) => {
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('notes')
          .update(values)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Note updated successfully');
      } else {
        const { error } = await supabase
          .from('notes')
          .insert([{ 
            title: values.title,
            subject: values.subject,
            semester: values.semester,
            description: values.description,
            file_url: values.file_url,
            file_name: values.file_name,
            uploaded_by: user?.id 
          }]);
        if (error) throw error;
        toast.success('Note added successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['notes', selectedSemester] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (note: any) => {
    setEditingId(note.id);
    form.reset({
      title: note.title,
      subject: note.subject,
      semester: note.semester,
      description: note.description || '',
      file_url: note.file_url,
      file_name: note.file_name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Note deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['notes', selectedSemester] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Notes</h2>
          <p className="text-sm text-muted-foreground mt-1">Viewing: {selectedSemester} Semester</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white gap-2" onClick={() => { setEditingId(null); form.reset({ semester: selectedSemester }); }}>
              <Plus className="w-4 h-4" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Note</DialogTitle>
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
                        <Input placeholder="e.g., Microprocessor Notes - Chapter 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Microprocessors" {...field} />
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
                      <FormLabel>Semester</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="file_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="file_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>File Name</FormLabel>
                      <FormControl>
                        <Input placeholder="microprocessor-notes.pdf" {...field} />
                      </FormControl>
                      <FormMessage />
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes?.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-smooth">
            <CardHeader>
              <CardTitle className="text-lg">{note.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {note.subject} • {note.semester}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {note.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{note.description}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(note)} className="flex-1">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(note.id)}>
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

export default NotesManager;
