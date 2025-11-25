import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { GraduationCap, ArrowLeft, Loader2, Mail, Lock, Sparkles, Shield, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});
type LoginFormValues = z.infer<typeof loginSchema>;
const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });
  const onSubmit = async (values: LoginFormValues) => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password
      });
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          toast.error('Please verify your email before logging in.');
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (data.user) {
        // Fetch all roles and prioritize admin role
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);
        
        // Check if user has admin role, otherwise default to student
        const hasAdminRole = rolesData?.some(r => r.role === 'admin');
        
        toast.success('Login successful! Welcome back.');
        
        if (hasAdminRole) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error: any) {
      toast.error('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen gradient-secondary flex items-center justify-center p-3 md:p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-60"></div>
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-10"></div>
      
      {/* Floating Orbs - Smaller on mobile */}
      <div className="absolute top-20 left-[10%] w-48 h-48 md:w-96 md:h-96 bg-gold/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-[10%] w-48 h-48 md:w-96 md:h-96 bg-gold/15 rounded-full blur-3xl animate-float-delayed"></div>
      
      {/* Animated Particles - Hidden on small mobile */}
      {[...Array(10)].map((_, i) => <div key={i} className="absolute bg-white/20 rounded-full animate-pulse-slow hidden sm:block" style={{
      width: Math.random() * 6 + 3 + 'px',
      height: Math.random() * 6 + 3 + 'px',
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      animationDelay: Math.random() * 3 + 's'
    }} />)}
      
      <Card className="w-full max-w-md relative z-10 shadow-2xl border-2 border-gold/20 backdrop-blur-xl bg-white/95 animate-scale-in mx-4">
        <CardHeader className="space-y-3 md:space-y-4 text-center pb-6 md:pb-8">
          <div className="flex justify-center mb-1 md:mb-2">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 gradient-gold rounded-3xl flex items-center justify-center shadow-gold animate-float">
                <GraduationCap className="w-9 h-9 md:w-11 md:h-11 text-navy" />
              </div>
              <div className="absolute -top-2 -right-2">
                
              </div>
            </div>
          </div>
          
          <div>
            <CardTitle className="text-3xl md:text-4xl font-heading font-bold mb-2 gradient-gold bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground px-2">
              Sign in to access your ECE EDU PORTAL account
            </CardDescription>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4 text-gold" />
            <span>Secure Login • Protected Access</span>
          </div>
        </CardHeader>
        
        <CardContent className="px-4 md:px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-5">
              <FormField control={form.control} name="email" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm font-semibold">Email Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input type="email" placeholder="student@college.edu" className="pl-10 md:pl-11 h-11 md:h-12 border-2 focus:border-gold transition-colors text-sm md:text-base" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <FormField control={form.control} name="password" render={({
              field
            }) => <FormItem>
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="pl-10 md:pl-11 pr-11 md:pr-12 h-11 md:h-12 border-2 focus:border-gold transition-colors text-sm md:text-base" {...field} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 md:h-9 md:w-9 p-0 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>} />

              <Button type="submit" className="w-full gradient-gold text-navy font-bold h-11 md:h-12 text-sm md:text-base rounded-xl hover:shadow-gold transition-all duration-300 relative overflow-hidden group border-2 border-gold/20" disabled={loading}>
                {loading ? <>
                    <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    Signing In...
                  </> : <>
                    <span className="relative z-10 font-bold">Sign In to Portal</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
                  </>}
              </Button>
            </form>
          </Form>

          <div className="mt-6 md:mt-8 space-y-3 md:space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">
                  NEW TO ECE PORTAL??
                </span>
              </div>
            </div>
            
            <Link to="/register" className="block">
              <Button variant="outline" className="w-full h-11 md:h-12 border-2 border-navy hover:border-gold hover:bg-gold/5 font-semibold rounded-xl transition-all text-sm md:text-base">
                Create New Account
              </Button>
            </Link>
            
            <Link to="/">
              <Button variant="ghost" className="w-full hover:bg-muted/50 rounded-xl text-sm md:text-base" type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>;
};
export default Login;