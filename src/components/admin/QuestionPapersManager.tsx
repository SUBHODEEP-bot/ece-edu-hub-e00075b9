import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, Folder, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface QuestionPapersManagerProps {
  selectedSemester: string;
}

const folderSchema = z.object({
  subject_name: z.string().min(1, 'Subject name is required'),
  semester: z.string().min(1, 'Semester is required'),
});

const paperSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  year: z.string().min(4, 'Year is required'),
  file_url: z.string().optional(),
  file_name: z.string().optional(),
  folder_id: z.string().min(1, 'Please select a folder'),
});

type FolderFormValues = z.infer<typeof folderSchema>;
type PaperFormValues = z.infer<typeof paperSchema>;

const QuestionPapersManager = ({ selectedSemester }: QuestionPapersManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isPaperDialogOpen, setIsPaperDialogOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingPaperId, setEditingPaperId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [uploadMode, setUploadMode] = useState<'upload' | 'url'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const folderForm = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      subject_name: '',
      semester: selectedSemester,
    },
  });

  const paperForm = useForm<PaperFormValues>({
    resolver: zodResolver(paperSchema),
    defaultValues: {
      title: '',
      year: '',
      file_url: '',
      file_name: '',
      folder_id: '',
    },
  });

  const { data: folders } = useQuery({
    queryKey: ['pyq_folders', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pyq_folders')
        .select('*')
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: papers } = useQuery({
    queryKey: ['question_papers', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('question_papers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const handleSaveFolder = async (values: FolderFormValues) => {
    setLoading(true);
    try {
      if (editingFolderId) {
        const { error } = await supabase
          .from('pyq_folders')
          .update(values)
          .eq('id', editingFolderId);
        if (error) throw error;
        toast.success('Folder updated successfully');
      } else {
        const { error } = await supabase
          .from('pyq_folders')
          .insert([{ 
            subject_name: values.subject_name,
            semester: values.semester,
            created_by: user?.id 
          }]);
        if (error) throw error;
        toast.success('Folder created successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['pyq_folders'] });
      setIsFolderDialogOpen(false);
      folderForm.reset();
      setEditingFolderId(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return null;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `question-papers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      return { url: publicUrl, name: selectedFile.name };
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSavePaper = async (values: PaperFormValues) => {
    setLoading(true);
    try {
      let fileUrl = values.file_url;
      let fileName = values.file_name;

      // Handle file upload if in upload mode
      if (uploadMode === 'upload' && selectedFile && !editingPaperId) {
        const uploadResult = await handleFileUpload();
        if (!uploadResult) {
          setLoading(false);
          return;
        }
        fileUrl = uploadResult.url;
        fileName = uploadResult.name;
      }

      // Validate we have file info
      if (!fileUrl || !fileName) {
        toast.error('Please provide a file or URL');
        setLoading(false);
        return;
      }

      if (editingPaperId) {
        const updateData: any = {
          title: values.title,
          year: values.year,
          folder_id: values.folder_id,
        };
        
        // Only update file info if provided
        if (values.file_url) {
          updateData.file_url = values.file_url;
          updateData.file_name = values.file_name;
        }

        const { error } = await supabase
          .from('question_papers')
          .update(updateData)
          .eq('id', editingPaperId);
        if (error) throw error;
        toast.success('Paper updated successfully');
      } else {
        const folder = folders?.find(f => f.id === values.folder_id);
        const { error } = await supabase
          .from('question_papers')
          .insert([{ 
            title: values.title,
            subject: folder?.subject_name || '',
            year: values.year,
            semester: folder?.semester || selectedSemester,
            file_url: fileUrl,
            file_name: fileName,
            folder_id: values.folder_id,
            uploaded_by: user?.id 
          }]);
        if (error) throw error;
        toast.success('Paper added successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['question_papers'] });
      setIsPaperDialogOpen(false);
      paperForm.reset();
      setEditingPaperId(null);
      setSelectedFile(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFolder = (folder: any) => {
    setEditingFolderId(folder.id);
    folderForm.reset({
      subject_name: folder.subject_name,
      semester: folder.semester,
    });
    setIsFolderDialogOpen(true);
  };

  const handleEditPaper = (paper: any) => {
    setEditingPaperId(paper.id);
    paperForm.reset({
      title: paper.title,
      year: paper.year,
      file_url: paper.file_url,
      file_name: paper.file_name,
      folder_id: paper.folder_id,
    });
    setIsPaperDialogOpen(true);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure? This will delete the folder and all papers inside it.')) return;
    
    try {
      const { error } = await supabase
        .from('pyq_folders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Folder deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['pyq_folders'] });
      queryClient.invalidateQueries({ queryKey: ['question_papers'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleDeletePaper = async (id: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;
    
    try {
      const { error } = await supabase
        .from('question_papers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Paper deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['question_papers'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const getPapersByFolder = (folderId: string) => {
    return papers?.filter(p => p.folder_id === folderId) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Question Papers</h2>
          <p className="text-sm text-muted-foreground mt-1">Viewing: {selectedSemester}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white gap-2" onClick={() => { setEditingFolderId(null); folderForm.reset({ semester: selectedSemester }); }}>
                <Folder className="w-4 h-4" />
                Create Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFolderId ? 'Edit' : 'Create'} Folder</DialogTitle>
                <DialogDescription>Create a subject folder to organize papers</DialogDescription>
              </DialogHeader>
              <Form {...folderForm}>
                <form onSubmit={folderForm.handleSubmit(handleSaveFolder)} className="space-y-4">
                  <FormField
                    control={folderForm.control}
                    name="subject_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Digital Electronics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={folderForm.control}
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
                    <Button type="submit" className="gradient-primary text-white" disabled={loading || uploading}>
                      {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {uploading ? 'Uploading...' : 'Save'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isPaperDialogOpen} onOpenChange={setIsPaperDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={() => { 
                setEditingPaperId(null); 
                paperForm.reset(); 
                setSelectedFile(null);
                setUploadMode('upload');
              }}>
                <Plus className="w-4 h-4" />
                Add Paper
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPaperId ? 'Edit' : 'Add'} Question Paper</DialogTitle>
                <DialogDescription>Add a paper to a subject folder</DialogDescription>
              </DialogHeader>
              <Form {...paperForm}>
                <form onSubmit={paperForm.handleSubmit(handleSavePaper)} className="space-y-4">
                  <FormField
                    control={paperForm.control}
                    name="folder_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Folder</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select folder" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {folders?.map(folder => (
                              <SelectItem key={folder.id} value={folder.id}>
                                {folder.subject_name} ({folder.semester})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paperForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., May 2024 Paper" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={paperForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 2024" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!editingPaperId && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={uploadMode === 'upload' ? 'default' : 'outline'}
                          onClick={() => setUploadMode('upload')}
                          className="flex-1"
                        >
                          Upload PDF
                        </Button>
                        <Button
                          type="button"
                          variant={uploadMode === 'url' ? 'default' : 'outline'}
                          onClick={() => setUploadMode('url')}
                          className="flex-1"
                        >
                          Provide URL
                        </Button>
                      </div>

                      {uploadMode === 'upload' ? (
                        <div className="space-y-2">
                          <FormLabel>Upload PDF File</FormLabel>
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            disabled={uploading}
                          />
                          {selectedFile && (
                            <p className="text-sm text-muted-foreground">
                              Selected: {selectedFile.name}
                            </p>
                          )}
                        </div>
                      ) : (
                        <>
                          <FormField
                            control={paperForm.control}
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
                            control={paperForm.control}
                            name="file_name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>File Name</FormLabel>
                                <FormControl>
                                  <Input placeholder="paper-2024.pdf" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>
                  )}

                  {editingPaperId && (
                    <>
                      <FormField
                        control={paperForm.control}
                        name="file_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File URL (Optional - leave empty to keep current)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={paperForm.control}
                        name="file_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>File Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="paper-2024.pdf" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
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
      </div>

      <div className="space-y-4">
        {folders?.map((folder) => {
          const folderPapers = getPapersByFolder(folder.id);
          const isExpanded = expandedFolders.has(folder.id);
          
          return (
            <Card key={folder.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{folder.subject_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{folderPapers.length} papers</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleEditFolder(folder); }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="pt-4">
                  {folderPapers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No papers in this folder yet</p>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {folderPapers.map((paper) => (
                        <Card key={paper.id} className="border-border/50">
                          <CardHeader className="p-4">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-1 text-primary" />
                              <div className="flex-1">
                                <CardTitle className="text-sm">{paper.title}</CardTitle>
                                <p className="text-xs text-muted-foreground">{paper.year}</p>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditPaper(paper)} className="flex-1">
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeletePaper(paper.id)}>
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}

        {(!folders || folders.length === 0) && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No folders created yet. Click "Create Folder" to get started.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default QuestionPapersManager;
