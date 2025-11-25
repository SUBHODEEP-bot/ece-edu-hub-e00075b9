import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { FileText, Trash2, Edit, Loader2, Link as LinkIcon, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface LabManual {
  id: string;
  title: string;
  description: string | null;
  file_url: string | null;
  link_url: string | null;
  file_name: string | null;
  semester: string;
  created_at: string;
}

const LabManualsManager = ({ selectedSemester }: { selectedSemester: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingManual, setEditingManual] = useState<LabManual | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [semester, setSemester] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data: labManuals, isLoading } = useQuery({
    queryKey: ['lab-manuals', selectedSemester],
    queryFn: async () => {
      let query = supabase
        .from('lab_manuals')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedSemester !== 'all') {
        query = query.or(`semester.eq.${selectedSemester},semester.eq.ALL`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as LabManual[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const manual = labManuals?.find(m => m.id === id);
      
      if (manual?.file_url) {
        const fileName = manual.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('documents').remove([fileName]);
        }
      }

      const { error } = await supabase.from('lab_manuals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lab-manuals'] });
      toast.success('Lab manual deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete lab manual');
      console.error(error);
    },
  });

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSemester('');
    setUploadType('file');
    setLinkUrl('');
    setFile(null);
    setEditingManual(null);
    setIsDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (uploadType === 'file' && file) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const manualData = {
        title,
        description: description || null,
        file_url: uploadType === 'file' ? fileUrl : null,
        link_url: uploadType === 'link' ? linkUrl : null,
        file_name: fileName,
        semester,
        uploaded_by: user.id,
      };

      if (editingManual) {
        const { error } = await supabase
          .from('lab_manuals')
          .update(manualData)
          .eq('id', editingManual.id);

        if (error) throw error;
        toast.success('Lab manual updated successfully');
      } else {
        const { error } = await supabase
          .from('lab_manuals')
          .insert([manualData]);

        if (error) throw error;
        toast.success('Lab manual added successfully');
      }

      queryClient.invalidateQueries({ queryKey: ['lab-manuals'] });
      resetForm();
    } catch (error) {
      toast.error('Failed to save lab manual');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (manual: LabManual) => {
    setEditingManual(manual);
    setTitle(manual.title);
    setDescription(manual.description || '');
    setSemester(manual.semester);
    setUploadType(manual.link_url ? 'link' : 'file');
    setLinkUrl(manual.link_url || '');
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Lab Manuals</h2>
          <p className="text-muted-foreground">Manage lab manual documents and links</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Upload className="w-4 h-4 mr-2" />
              Add Lab Manual
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingManual ? 'Edit Lab Manual' : 'Add New Lab Manual'}</DialogTitle>
              <DialogDescription>
                Upload a PDF file or provide a link to lab manual resources
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="semester">Semester *</Label>
                <Select value={semester} onValueChange={setSemester} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
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
              </div>

              <div>
                <Label>Upload Type *</Label>
                <Select value={uploadType} onValueChange={(v: 'file' | 'link') => setUploadType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">Upload PDF File</SelectItem>
                    <SelectItem value="link">Provide Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {uploadType === 'file' ? (
                <div>
                  <Label htmlFor="file">PDF File *</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required={!editingManual}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="link">Link URL *</Label>
                  <Input
                    id="link"
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com/lab-manual"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingManual ? 'Update' : 'Add'} Lab Manual
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {labManuals && labManuals.length > 0 ? (
          labManuals.map((manual) => (
            <Card key={manual.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {manual.link_url ? (
                        <LinkIcon className="w-5 h-5" />
                      ) : (
                        <FileText className="w-5 h-5" />
                      )}
                      {manual.title}
                    </CardTitle>
                    <CardDescription>{manual.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(manual)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(manual.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{manual.semester}</Badge>
                  {manual.link_url ? (
                    <a
                      href={manual.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Open Link
                    </a>
                  ) : manual.file_url ? (
                    <a
                      href={manual.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      View PDF
                    </a>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No lab manuals found. Add your first lab manual to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LabManualsManager;
