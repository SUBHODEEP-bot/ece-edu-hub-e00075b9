import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, FileText, Link as LinkIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];

export function OrganizersManager({ selectedSemester }: { selectedSemester: string }) {
  const queryClient = useQueryClient();
  const [viewSemester, setViewSemester] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [semester, setSemester] = useState("1st");
  const [contentType, setContentType] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["organizers", viewSemester],
    queryFn: async () => {
      let query = supabase
        .from("organizers")
        .select("*")
        .order("created_at", { ascending: false });

      if (viewSemester !== "all") {
        query = query.eq("semester", viewSemester);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let fileUrl = null;
      let fileName = null;

      if (contentType === "file" && file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const { error } = await supabase.from("organizers").insert({
        title,
        description,
        semester,
        file_url: fileUrl,
        link_url: contentType === "link" ? linkUrl : null,
        file_name: fileName,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] });
      toast.success("Organizer added successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to add organizer: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      let fileUrl = null;
      let fileName = null;

      if (contentType === "file" && file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("documents")
          .getPublicUrl(filePath);

        fileUrl = publicUrl;
        fileName = file.name;
      }

      const updateData: any = {
        title,
        description,
        semester,
      };

      if (contentType === "link") {
        updateData.link_url = linkUrl;
        updateData.file_url = null;
        updateData.file_name = null;
      } else if (fileUrl) {
        updateData.file_url = fileUrl;
        updateData.file_name = fileName;
        updateData.link_url = null;
      }

      const { error } = await supabase
        .from("organizers")
        .update(updateData)
        .eq("id", editingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] });
      toast.success("Organizer updated successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update organizer: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("organizers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizers"] });
      toast.success("Organizer deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete organizer: " + error.message);
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSemester("1st");
    setContentType("file");
    setLinkUrl("");
    setFile(null);
    setEditingId(null);
  };

  const handleEdit = (organizer: any) => {
    setEditingId(organizer.id);
    setTitle(organizer.title);
    setDescription(organizer.description || "");
    setSemester(organizer.semester);
    setContentType(organizer.file_url ? "file" : "link");
    setLinkUrl(organizer.link_url || "");
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate();
    } else {
      createMutation.mutate();
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Organizers</h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={viewSemester} onValueChange={setViewSemester}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {semesters.map((sem) => (
                <SelectItem key={sem} value={sem}>
                  {sem} Semester
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Organizer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Organizer" : "Add New Organizer"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
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
                <Label htmlFor="semester">Semester</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Content Type</Label>
                <RadioGroup value={contentType} onValueChange={(value: any) => setContentType(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="file" id="file" />
                    <Label htmlFor="file" className="font-normal">Upload PDF File</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="link" id="link" />
                    <Label htmlFor="link" className="font-normal">Add Link</Label>
                  </div>
                </RadioGroup>
              </div>

              {contentType === "file" ? (
                <div>
                  <Label htmlFor="file">PDF File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    required={!editingId}
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="link">Link URL</Label>
                  <Input
                    id="link"
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    required
                  />
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Update" : "Add"} Organizer
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {organizers?.map((organizer) => (
          <Card key={organizer.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {organizer.file_url ? (
                      <FileText className="h-5 w-5" />
                    ) : (
                      <LinkIcon className="h-5 w-5" />
                    )}
                    {organizer.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {organizer.semester} Semester
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(organizer)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(organizer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {organizer.description && (
                <p className="text-sm text-muted-foreground mb-2">{organizer.description}</p>
              )}
              {organizer.file_url && (
                <p className="text-sm">
                  <strong>File:</strong> {organizer.file_name}
                </p>
              )}
              {organizer.link_url && (
                <p className="text-sm">
                  <strong>Link:</strong>{" "}
                  <a href={organizer.link_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {organizer.link_url}
                  </a>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
