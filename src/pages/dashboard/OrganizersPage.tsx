import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export default function OrganizersPage() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("semester")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: organizers, isLoading } = useQuery({
    queryKey: ["organizers", profile?.semester],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizers")
        .select("*")
        .eq("semester", profile?.semester)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.semester,
  });

  const handleDownload = async (fileUrl: string, fileName: string) => {
    try {
      if (fileUrl.includes("supabase")) {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        window.open(fileUrl, "_blank");
      }
      toast.success("Download started");
    } catch (error) {
      toast.error("Failed to download file");
      console.error("Download error:", error);
    }
  };


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Organizers</h1>

      {organizers && organizers.length > 0 ? (
        <div className="grid gap-6">
          {organizers.map((organizer) => (
            <Card key={organizer.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {organizer.file_url ? (
                    <FileText className="h-5 w-5" />
                  ) : (
                    <LinkIcon className="h-5 w-5" />
                  )}
                  {organizer.title}
                </CardTitle>
                <CardDescription>
                  {organizer.semester} Semester
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {organizer.description && (
                  <p className="text-sm text-muted-foreground">{organizer.description}</p>
                )}
                
                {organizer.file_url && (
                  <Button
                    onClick={() => handleDownload(organizer.file_url!, organizer.file_name || "document.pdf")}
                    className="w-full sm:w-auto"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download {organizer.file_name}
                  </Button>
                )}

                {organizer.link_url && (
                  <a 
                    href={organizer.link_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Link
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No organizers available for your semester yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
