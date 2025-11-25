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
import { Plus, Pencil, Trash2, Loader2, Folder, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NotesManagerProps {
  selectedSemester: string;
}

const folderSchema = z.object({
  subject_name: z.string().min(1, 'Subject name is required'),
  semester: z.string().min(1, 'Semester is required'),
});

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  file_url: z.string().url('Must be a valid URL'),
  file_name: z.string().min(1, 'File name is required'),
  folder_id: z.string().min(1, 'Please select a folder'),
});

type FolderFormValues = z.infer<typeof folderSchema>;
type NoteFormValues = z.infer<typeof noteSchema>;

const NotesManager = ({ selectedSemester }: NotesManagerProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const folderForm = useForm<FolderFormValues>({
    resolver: zodResolver(folderSchema),
    defaultValues: {
      subject_name: '',
      semester: selectedSemester,
    },
  });

  const noteForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      description: '',
      file_url: '',
      file_name: '',
      folder_id: '',
    },
  });

  const { data: folders } = useQuery({
    queryKey: ['notes_folders', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes_folders')
        .select('*')
        .eq('semester', selectedSemester)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: notes } = useQuery({
    queryKey: ['notes', selectedSemester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
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
          .from('notes_folders')
          .update(values)
          .eq('id', editingFolderId);
        if (error) throw error;
        toast.success('Folder updated successfully');
      } else {
        const { error } = await supabase
          .from('notes_folders')
          .insert([{ 
            subject_name: values.subject_name,
            semester: values.semester,
            created_by: user?.id 
          }]);
        if (error) throw error;
        toast.success('Folder created successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['notes_folders'] });
      setIsFolderDialogOpen(false);
      folderForm.reset();
      setEditingFolderId(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async (values: NoteFormValues) => {
    setLoading(true);
    try {
      if (editingNoteId) {
        const { error } = await supabase
          .from('notes')
          .update(values)
          .eq('id', editingNoteId);
        if (error) throw error;
        toast.success('Note updated successfully');
      } else {
        const folder = folders?.find(f => f.id === values.folder_id);
        const { error } = await supabase
          .from('notes')
          .insert([{ 
            title: values.title,
            subject: folder?.subject_name || '',
            semester: folder?.semester || selectedSemester,
            description: values.description,
            file_url: values.file_url,
            file_name: values.file_name,
            folder_id: values.folder_id,
            uploaded_by: user?.id 
          }]);
        if (error) throw error;
        toast.success('Note added successfully');
      }
      
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      setIsNoteDialogOpen(false);
      noteForm.reset();
      setEditingNoteId(null);
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

  const handleEditNote = (note: any) => {
    setEditingNoteId(note.id);
    noteForm.reset({
      title: note.title,
      description: note.description || '',
      file_url: note.file_url,
      file_name: note.file_name,
      folder_id: note.folder_id,
    });
    setIsNoteDialogOpen(true);
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure? This will delete the folder and all notes inside it.')) return;
    
    try {
      const { error } = await supabase
        .from('notes_folders')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Folder deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['notes_folders'] });
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Note deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const getNotesByFolder = (folderId: string) => {
    return notes?.filter(n => n.folder_id === folderId) || [];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manage Notes</h2>
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
                <DialogDescription>Create a subject folder to organize notes</DialogDescription>
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
                    <Button type="submit" className="gradient-primary text-white" disabled={loading}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" onClick={() => { setEditingNoteId(null); noteForm.reset(); }}>
                <Plus className="w-4 h-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingNoteId ? 'Edit' : 'Add'} Note</DialogTitle>
                <DialogDescription>Add a note to a subject folder</DialogDescription>
              </DialogHeader>
              <Form {...noteForm}>
                <form onSubmit={noteForm.handleSubmit(handleSaveNote)} className="space-y-4">
                  <FormField
                    control={noteForm.control}
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
                    control={noteForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Chapter 1 - Introduction" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={noteForm.control}
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
                    control={noteForm.control}
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
                    control={noteForm.control}
                    name="file_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>File Name</FormLabel>
                        <FormControl>
                          <Input placeholder="notes-chapter1.pdf" {...field} />
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
      </div>

      <div className="space-y-4">
        {folders?.map((folder) => {
          const folderNotes = getNotesByFolder(folder.id);
          const isExpanded = expandedFolders.has(folder.id);
          
          return (
            <Card key={folder.id} className="overflow-hidden">
              <CardHeader className="bg-muted/30 cursor-pointer" onClick={() => toggleFolder(folder.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Folder className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{folder.subject_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{folderNotes.length} notes</p>
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
                  {folderNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No notes in this folder yet</p>
                  ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {folderNotes.map((note) => (
                        <Card key={note.id} className="border-border/50">
                          <CardHeader className="p-4">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-1 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-sm">{note.title}</CardTitle>
                                {note.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{note.description}</p>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditNote(note)} className="flex-1">
                                <Pencil className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteNote(note.id)}>
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

export default NotesManager;
