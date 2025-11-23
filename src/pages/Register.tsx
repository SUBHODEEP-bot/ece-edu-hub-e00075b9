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
import { GraduationCap, ArrowLeft, Loader2, Mail, Lock, User, Phone, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email').refine(
    (email) => email.includes('@'),
    'Must be a valid college email address'
  ),
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits').max(15),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
            mobile_number: values.mobile,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast.error('This email is already registered. Please login instead.');
        } else {
          toast.error(error.message);
        }
        return;
      }

      toast.success('Registration successful! Please check your email for verification.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      toast.error('Registration failed. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-40"></div>
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-20"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-[10%] w-96 h-96 bg-primary-light/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-float-delayed"></div>
      
      {/* Animated Particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white/20 rounded-full animate-pulse-slow"
          style={{
            width: Math.random() * 6 + 3 + 'px',
            height: Math.random() * 6 + 3 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 3 + 's',
          }}
        />
      ))}
      
      <Card className="w-full max-w-lg relative z-10 shadow-2xl border-2 border-white/10 backdrop-blur-xl bg-white/95 animate-scale-in">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <div className="relative">
              <div className="w-20 h-20 gradient-primary rounded-3xl flex items-center justify-center shadow-glow animate-float">
                <GraduationCap className="w-11 h-11 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-success text-white border-0 shadow-lg animate-pulse-slow">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <CardTitle className="text-4xl font-heading font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Join the ECE EDU PORTAL community today
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            {[
              { icon: CheckCircle2, text: 'Free Forever' },
              { icon: CheckCircle2, text: 'Instant Access' },
              { icon: CheckCircle2, text: 'No Credit Card' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-success font-medium">
                <item.icon className="w-4 h-4" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          placeholder="John Doe" 
                          className="pl-11 h-12 border-2 focus:border-primary transition-colors" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">College Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="student@college.edu" 
                          className="pl-11 h-12 border-2 focus:border-primary transition-colors" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Mobile Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          placeholder="1234567890" 
                          className="pl-11 h-12 border-2 focus:border-primary transition-colors" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-11 h-12 border-2 focus:border-primary transition-colors" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-11 h-12 border-2 focus:border-primary transition-colors" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full gradient-primary text-white font-bold h-12 text-base rounded-xl hover:shadow-glow-hover transition-all duration-300 relative overflow-hidden group mt-6"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Create My Account</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
                  </>
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground font-medium">
                  Already Have an Account?
                </span>
              </div>
            </div>
            
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full h-12 border-2 hover:border-primary hover:bg-primary/5 font-semibold rounded-xl transition-all">
                Sign In Instead
              </Button>
            </Link>
            
            <Link to="/">
              <Button variant="ghost" className="w-full hover:bg-muted/50 rounded-xl" type="button">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
