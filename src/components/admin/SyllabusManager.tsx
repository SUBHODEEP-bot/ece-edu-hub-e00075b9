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
import { Plus, Pencil, Trash2, Loader2, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface SyllabusManagerProps {
  selectedSemester: string;
}

const syllabusSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  semester: z.string().min(1, 'Semester is required'),
  academic_year: z.string().min(1, 'Academic year is required'),
  type: z.enum(['theory', 'lab']),
  description: z.string().optional(),
  file_url: z.string().optional(),
  file_name: z.string().optional(),
});

type SyllabusFormValues = z.infer<typeof syllabusSchema>;

const SyllabusManager = ({ selectedSemester }: SyllabusManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<SyllabusFormValues>({
    resolver: zodResolver(syllabusSchema),
    defaultValues: {
      title: '',
      semester: selectedSemester,
      academic_year: '',
      type: 'theory',
      description: '',
      file_url: '',
      file_name: '',
    },
  });

  const { data: syllabus } = useQuery({
    queryKey: ['syllabus', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('syllabus')
        .select('*')
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${selectedSemester}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('syllabus')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('syllabus')
        .getPublicUrl(filePath);

      form.setValue('file_url', publicUrl);
      form.setValue('file_name', file.name);
      toast.success('File uploaded successfully');
      return publicUrl;
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (values: SyllabusFormValues) => {
    setLoading(true);
    try {
      let fileUrl = values.file_url;
      let fileName = values.file_name;

      // Upload file if one was selected
      if (uploadedFile) {
        fileUrl = await handleFileUpload(uploadedFile);
        fileName = uploadedFile.name;
      }

      if (!fileUrl || !fileName) {
        toast.error('Please upload a file or provide a file URL');
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from('syllabus')
          .update({
            ...values,
            file_url: fileUrl,
            file_name: fileName,
          })
          .eq('id', editingId);
        if (error) throw error;
        toast.success('Syllabus updated successfully');
      } else {
        const { error } = await supabase
          .from('syllabus')
          .insert([{ 
            title: values.title,
            semester: values.semester,
            academic_year: values.academic_year,
            type: values.type,
            description: values.description,
            file_url: fileUrl,
            file_name: fileName,
            uploaded_by: user?.id 
          }]);
        if (error) throw error;
        toast.success('Syllabus added successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['syllabus', selectedSemester] });
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
      setIsDialogOpen(false);
      form.reset();
      setEditingId(null);
      setUploadedFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    form.reset({
      title: item.title,
      semester: item.semester,
      academic_year: item.academic_year,
      type: item.type || 'theory',
      description: item.description || '',
      file_url: item.file_url,
      file_name: item.file_name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this syllabus?')) return;
    
    try {
      const { error } = await supabase
        .from('syllabus')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Syllabus deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['syllabus', selectedSemester] });
      queryClient.invalidateQueries({ queryKey: ['syllabus'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Syllabus</h2>
          <p className="text-sm text-muted-foreground mt-1">Viewing: {selectedSemester} Semester</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-white gap-2" onClick={() => { setEditingId(null); form.reset({ semester: selectedSemester }); }}>
              <Plus className="w-4 h-4" />
              Add Syllabus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Syllabus</DialogTitle>
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
                        <Input placeholder="e.g., B.Tech ECE Syllabus" {...field} />
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
                  name="academic_year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2024-25" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Syllabus Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <FormLabel>Upload File (Recommended)</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setUploadedFile(file);
                            form.setValue('file_name', file.name);
                          }
                        }}
                        disabled={uploading}
                      />
                      {uploadedFile && (
                        <span className="text-sm text-green-600">✓ {uploadedFile.name}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Upload PDF file (recommended for better reliability)
                    </p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or use external URL</span>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="file_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File URL (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} value={field.value || ''} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Only if not uploading a file above
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="file_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="syllabus-sem5.pdf" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
        {syllabus?.map((item) => (
          <Card 
            key={item.id} 
            className={`hover:shadow-lg transition-smooth ${
              item.type === 'lab' 
                ? 'border-purple-500/50 bg-purple-50 dark:bg-purple-950/20' 
                : 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20'
            }`}
          >
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                {item.type === 'lab' ? '🧪' : '📚'} {item.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {item.semester} • {item.academic_year} • {item.type === 'lab' ? 'Lab' : 'Theory'}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEdit(item)} className="flex-1">
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(item.id)}>
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

export default SyllabusManager;
