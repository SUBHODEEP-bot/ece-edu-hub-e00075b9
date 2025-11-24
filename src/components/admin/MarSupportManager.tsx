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
import { Plus, Pencil, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MarSupportManagerProps {
  selectedSemester: string;
}

const marSupportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  link_url: z.string().url('Must be a valid URL'),
  semester: z.string().min(1, 'Semester is required'),
});

type MarSupportFormValues = z.infer<typeof marSupportSchema>;

const MarSupportManager = ({ selectedSemester }: MarSupportManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const form = useForm<MarSupportFormValues>({
    resolver: zodResolver(marSupportSchema),
    defaultValues: {
      title: '',
      description: '',
      link_url: '',
      semester: selectedSemester,
    },
  });

  const { data: marSupports } = useQuery({
    queryKey: ['admin-mar-support', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mar_support')
        .select('*')
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleSave = async (values: MarSupportFormValues) => {
    setLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('mar_support')
          .update(values)
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Mar Support link updated successfully');
      } else {
        const { error } = await supabase
          .from('mar_support')
          .insert([{ 
            title: values.title,
            description: values.description || null,
            link_url: values.link_url,
            semester: values.semester,
            created_by: user?.id || null
          }]);
        if (error) throw error;
        toast.success('Mar Support link added successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['admin-mar-support'] });
      queryClient.invalidateQueries({ queryKey: ['mar-support'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (marSupport: any) => {
    setEditingId(marSupport.id);
    form.reset({
      title: marSupport.title,
      description: marSupport.description || '',
      link_url: marSupport.link_url,
      semester: marSupport.semester,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Mar Support link?')) return;
    
    try {
      const { error } = await supabase
        .from('mar_support')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Mar Support link deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-mar-support'] });
      queryClient.invalidateQueries({ queryKey: ['mar-support'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Mar Support</h2>
          <p className="text-sm text-muted-foreground mt-1">Viewing: {selectedSemester} Semester</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="gradient-primary text-white gap-2" 
              onClick={() => { 
                setEditingId(null); 
                form.reset({ 
                  semester: selectedSemester,
                  title: '',
                  description: '',
                  link_url: ''
                }); 
              }}
            >
              <Plus className="w-4 h-4" />
              Add Mar Support Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Mar Support Link</DialogTitle>
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
                        <Input placeholder="e.g., Important Resource Link" {...field} />
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
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief description about this link..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="link_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Link URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {marSupports?.map((marSupport) => (
          <Card key={marSupport.id} className="hover:shadow-lg transition-smooth">
            <CardHeader>
              <CardTitle className="text-lg">{marSupport.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {marSupport.description && (
                <p className="text-sm text-muted-foreground">{marSupport.description}</p>
              )}
              <a 
                href={marSupport.link_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                Open Link <ExternalLink className="w-3 h-3" />
              </a>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(marSupport)} className="flex-1">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(marSupport.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {(!marSupports || marSupports.length === 0) && (
          <Card className="col-span-full">
            <CardContent className="py-8 text-center text-muted-foreground">
              No Mar Support links added yet for this semester.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MarSupportManager;
