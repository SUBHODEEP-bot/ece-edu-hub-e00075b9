import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Shield, Loader2, ArrowLeft } from 'lucide-react';

const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

const ADMIN_USERNAME = 'SUBHODEEP PAL';
const ADMIN_PASSWORD = 'ECEedu@2005';
const ADMIN_EMAIL = 'admin@ece.edu';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);
    
    try {
      // Validate admin credentials
      if (data.username !== ADMIN_USERNAME || data.password !== ADMIN_PASSWORD) {
        toast({
          variant: 'destructive',
          title: 'Invalid Credentials',
          description: 'Username or password is incorrect.',
        });
        setIsLoading(false);
        return;
      }

      // Sign in with Supabase using admin email
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Authentication Error',
          description: error.message,
        });
        setIsLoading(false);
        return;
      }

      if (authData.user) {
        // Verify admin role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authData.user.id)
          .single();

        if (roleData?.role === 'admin') {
          toast({
            title: 'Welcome Admin!',
            description: 'Login successful.',
          });
          navigate('/admin');
        } else {
          await supabase.auth.signOut();
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'You do not have admin privileges.',
          });
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-navy flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-10"></div>
      <div className="absolute top-20 left-10 w-48 h-48 sm:w-64 sm:h-64 md:w-96 md:h-96 bg-gold/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-56 h-56 sm:w-72 sm:h-72 md:w-[500px] md:h-[500px] bg-gold/15 rounded-full blur-3xl animate-float-delayed"></div>
      
      <Card className="w-full max-w-md relative z-10 border-2 border-gold/30 shadow-2xl animate-scale-in">
        <CardHeader className="space-y-1 text-center pb-4 sm:pb-6">
          <div className="mx-auto w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 gradient-gold rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 shadow-gold">
            <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-navy" />
          </div>
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-navy">
            Admin Login
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm md:text-base">
            Enter your admin credentials to access the control panel
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="username" className="text-xs sm:text-sm">Admin Username</Label>
              <Input
                id="username"
                placeholder="Enter admin username"
                {...register('username')}
                disabled={isLoading}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
              {errors.username && (
                <p className="text-xs sm:text-sm text-destructive">{errors.username.message}</p>
              )}
            </div>
            
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="password" className="text-xs sm:text-sm">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                {...register('password')}
                disabled={isLoading}
                className="h-9 sm:h-10 text-sm sm:text-base"
              />
              {errors.password && (
                <p className="text-xs sm:text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            
            <Button
              type="submit"
              className="w-full gradient-gold text-navy hover:shadow-gold font-bold shadow-gold mt-4 sm:mt-6 h-9 sm:h-10 md:h-11 text-sm sm:text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login as Admin'
              )}
            </Button>
          </form>
          
          <div className="mt-4 sm:mt-6 text-center">
            <Link to="/" className="inline-flex items-center text-xs sm:text-sm text-muted-foreground hover:text-gold transition-colors">
              <ArrowLeft className="mr-1.5 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              Back to Home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
