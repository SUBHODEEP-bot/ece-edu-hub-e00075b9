import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Bell, BellOff } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const semesters = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
const notificationTypes = [
  { value: "info", label: "Info", color: "bg-blue-500" },
  { value: "warning", label: "Warning", color: "bg-yellow-500" },
  { value: "success", label: "Success", color: "bg-green-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
];

export function NotificationsManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [semester, setSemester] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notifications").insert({
        title,
        message,
        type,
        semester,
        is_active: isActive,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-admin"] });
      toast.success("Notification created successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to create notification: " + error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({
          title,
          message,
          type,
          semester,
          is_active: isActive,
        })
        .eq("id", editingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-admin"] });
      toast.success("Notification updated successfully");
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update notification: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-admin"] });
      toast.success("Notification deleted successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete notification: " + error.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-admin"] });
      toast.success("Notification status updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update status: " + error.message);
    },
  });

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setType("info");
    setSemester(null);
    setIsActive(true);
    setEditingId(null);
  };

  const handleEdit = (notification: any) => {
    setEditingId(notification.id);
    setTitle(notification.title);
    setMessage(notification.message);
    setType(notification.type);
    setSemester(notification.semester);
    setIsActive(notification.is_active);
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

  const getTypeColor = (type: string) => {
    return notificationTypes.find((t) => t.value === type)?.color || "bg-gray-500";
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Create Notification
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit Notification" : "Create New Notification"}
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
                  placeholder="Notification title"
                />
              </div>

              <div>
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Notification message..."
                />
              </div>

              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="semester">Target Semester (Optional)</Label>
                <Select value={semester || "all"} onValueChange={(v) => setSemester(v === "all" ? null : v)}>
                  <SelectTrigger>
                    <SelectValue />
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
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                />
                <Label htmlFor="active">Active</Label>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Update" : "Create"} Notification
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {notifications?.map((notification) => (
          <Card key={notification.id} className={notification.is_active ? "" : "opacity-60"}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getTypeColor(notification.type)}`} />
                    <CardTitle>{notification.title}</CardTitle>
                    {!notification.is_active && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                  </div>
                  {notification.semester && (
                    <p className="text-sm text-muted-foreground">
                      Target: {notification.semester} Semester
                    </p>
                  )}
                  {!notification.semester && (
                    <p className="text-sm text-muted-foreground">
                      Target: All Semesters
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActiveMutation.mutate({
                      id: notification.id,
                      isActive: !notification.is_active
                    })}
                  >
                    {notification.is_active ? (
                      <BellOff className="h-4 w-4" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(notification)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteMutation.mutate(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{notification.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                Created: {new Date(notification.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
