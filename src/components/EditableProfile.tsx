import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Camera, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  mobile_number: z.string().min(10, 'Mobile number must be at least 10 digits').max(15, 'Mobile number too long'),
  semester: z.string().min(1, 'Please select your semester'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface EditableProfileProps {
  profile: {
    id: string;
    name: string;
    college_email: string;
    mobile_number: string;
    semester: string;
    avatar_url?: string | null;
    is_active?: boolean;
  };
}

export const EditableProfile = ({ profile }: EditableProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      mobile_number: profile.mobile_number,
      semester: profile.semester,
    },
  });

  const semester = watch('semester');

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setUploading(true);

      // Delete old avatar if exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${profile.id}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          mobile_number: data.mobile_number,
          semester: data.semester,
        })
        .eq('id', profile.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <Card className="max-w-2xl border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="gradient-primary text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg md:text-xl font-bold">Profile Information</CardTitle>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm hover:bg-white/90"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-6 sm:pt-8 p-4 sm:p-6 bg-gradient-to-br from-background to-primary/5">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="relative">
            <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
              <DialogTrigger asChild>
                <div className={avatarUrl && !isEditing ? "cursor-pointer" : ""}>
                  <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/30 shadow-xl ring-4 ring-primary/10 hover:ring-primary/30 transition-all">
                    <AvatarImage src={avatarUrl || undefined} alt={profile.name} />
                    <AvatarFallback className="text-xl sm:text-2xl font-bold bg-gradient-primary text-white">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DialogTrigger>
              {avatarUrl && (
                <DialogContent className="max-w-3xl w-[95vw] h-auto p-2 sm:p-4">
                  <div className="flex items-center justify-center w-full h-full">
                    <img 
                      src={avatarUrl} 
                      alt={profile.name}
                      className="max-w-full max-h-[85vh] object-contain rounded-lg"
                    />
                  </div>
                </DialogContent>
              )}
            </Dialog>
            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-lg hover:scale-110"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                />
              </label>
            )}
          </div>
          {uploading && <p className="text-xs sm:text-sm text-muted-foreground animate-pulse">Uploading...</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-5">
          {/* Name Field */}
          <div className="bg-card rounded-lg p-4 border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
            <Label htmlFor="name" className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 block">
              Full Name
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter your name"
                  disabled={isSubmitting}
                  className="text-sm border-primary/30 focus:border-primary"
                />
                {errors.name && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">{errors.name.message}</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-lg font-bold text-foreground">{profile.name}</p>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div className="bg-card rounded-lg p-4 border border-primary/20 shadow-sm">
            <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 block">
              College Email
            </Label>
            <p className="text-base sm:text-lg font-bold text-primary break-all">{profile.college_email}</p>
            {isEditing && (
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            )}
          </div>

          {/* Mobile Number Field */}
          <div className="bg-card rounded-lg p-4 border border-primary/20 shadow-sm hover:shadow-md transition-shadow">
            <Label htmlFor="mobile_number" className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 block">
              Mobile Number
            </Label>
            {isEditing ? (
              <>
                <Input
                  id="mobile_number"
                  {...register('mobile_number')}
                  placeholder="Enter your mobile number"
                  disabled={isSubmitting}
                  className="text-sm border-primary/30 focus:border-primary"
                />
                {errors.mobile_number && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">{errors.mobile_number.message}</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-lg font-bold text-foreground">{profile.mobile_number}</p>
            )}
          </div>

          {/* Semester Field */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border-2 border-primary/30 shadow-md hover:shadow-lg transition-shadow">
            <Label htmlFor="semester" className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 block">
              Current Semester
            </Label>
            {isEditing ? (
              <>
                <Select onValueChange={(value) => setValue('semester', value)} value={semester}>
                  <SelectTrigger className="text-sm border-primary/30 focus:border-primary bg-background">
                    <SelectValue placeholder="Select your semester" />
                  </SelectTrigger>
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
                {errors.semester && (
                  <p className="text-xs sm:text-sm text-destructive mt-1">{errors.semester.message}</p>
                )}
              </>
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-primary">{profile.semester}</p>
            )}
          </div>

          {/* Account Status (Read-only) */}
          <div className="bg-card rounded-lg p-4 border border-primary/20 shadow-sm">
            <Label className="text-xs sm:text-sm font-semibold text-muted-foreground mb-2 block">
              Account Status
            </Label>
            <p className="text-base sm:text-lg font-bold">
              {profile.is_active ? (
                <span className="text-green-600 inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
                  Active
                </span>
              ) : (
                <span className="text-destructive inline-flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
                  Inactive
                </span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                type="submit"
                className="flex-1 gradient-primary text-white text-xs sm:text-sm shadow-lg hover:shadow-xl"
                disabled={isSubmitting}
              >
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="text-xs sm:text-sm border-primary/30 hover:border-primary"
              >
                <X className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};