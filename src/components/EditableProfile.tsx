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
    <Card className="max-w-2xl">
      <CardHeader className="gradient-primary text-white rounded-t-lg p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base sm:text-lg md:text-xl">Profile Information</CardTitle>
          {!isEditing && (
            <Button
              onClick={() => setIsEditing(true)}
              variant="secondary"
              size="sm"
              className="text-xs sm:text-sm"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 p-4 sm:p-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <div className="relative">
            <Avatar className="w-24 h-24 sm:w-32 sm:h-32 border-4 border-primary/20">
              <AvatarImage src={avatarUrl || undefined} alt={profile.name} />
              <AvatarFallback className="text-xl sm:text-2xl font-bold bg-gradient-primary text-white">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-1.5 sm:p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors shadow-lg"
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
          {uploading && <p className="text-xs sm:text-sm text-muted-foreground">Uploading...</p>}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
            {isEditing ? (
              <>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter your name"
                  disabled={isSubmitting}
                  className="text-sm"
                />
                {errors.name && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.name.message}</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-lg font-semibold">{profile.name}</p>
            )}
          </div>

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">College Email</Label>
            <p className="text-base sm:text-lg font-semibold text-muted-foreground break-all">{profile.college_email}</p>
            {isEditing && (
              <p className="text-[10px] sm:text-xs text-muted-foreground">Email cannot be changed</p>
            )}
          </div>

          {/* Mobile Number Field */}
          <div className="space-y-2">
            <Label htmlFor="mobile_number" className="text-xs sm:text-sm">Mobile Number</Label>
            {isEditing ? (
              <>
                <Input
                  id="mobile_number"
                  {...register('mobile_number')}
                  placeholder="Enter your mobile number"
                  disabled={isSubmitting}
                  className="text-sm"
                />
                {errors.mobile_number && (
                  <p className="text-xs sm:text-sm text-destructive">{errors.mobile_number.message}</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-lg font-semibold">{profile.mobile_number}</p>
            )}
          </div>

          {/* Semester Field */}
          <div className="space-y-2">
            <Label htmlFor="semester" className="text-xs sm:text-sm">Current Semester</Label>
            {isEditing ? (
              <>
                <Select onValueChange={(value) => setValue('semester', value)} value={semester}>
                  <SelectTrigger className="text-sm">
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
                  <p className="text-xs sm:text-sm text-destructive">{errors.semester.message}</p>
                )}
              </>
            ) : (
              <p className="text-base sm:text-lg font-semibold">{profile.semester}</p>
            )}
          </div>

          {/* Account Status (Read-only) */}
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Account Status</Label>
            <p className="text-base sm:text-lg font-semibold">
              {profile.is_active ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-destructive">Inactive</span>
              )}
            </p>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                type="submit"
                className="flex-1 gradient-primary text-white text-xs sm:text-sm"
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
                className="text-xs sm:text-sm"
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
