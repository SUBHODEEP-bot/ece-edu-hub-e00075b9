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
    <div className="min-h-screen gradient-secondary flex items-center justify-center p-3 md:p-4 py-8 md:py-12 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-60"></div>
      <div className="absolute inset-0 bg-grid-pattern-dark opacity-10"></div>
      
      {/* Floating Orbs - Smaller on mobile */}
      <div className="absolute top-20 left-[10%] w-48 h-48 md:w-96 md:h-96 bg-gold/20 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-[10%] w-48 h-48 md:w-96 md:h-96 bg-gold/15 rounded-full blur-3xl animate-float-delayed"></div>
      
      {/* Animated Particles - Hidden on small mobile */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute bg-white/20 rounded-full animate-pulse-slow hidden sm:block"
          style={{
            width: Math.random() * 6 + 3 + 'px',
            height: Math.random() * 6 + 3 + 'px',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 3 + 's',
          }}
        />
      ))}
      
      <Card className="w-full max-w-lg relative z-10 shadow-2xl border-2 border-gold/20 backdrop-blur-xl bg-white/95 animate-scale-in mx-4">
        <CardHeader className="space-y-3 md:space-y-4 text-center pb-6 md:pb-8">
          <div className="flex justify-center mb-1 md:mb-2">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 gradient-gold rounded-3xl flex items-center justify-center shadow-gold animate-float">
                <GraduationCap className="w-9 h-9 md:w-11 md:h-11 text-navy" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Badge className="bg-success text-white border-0 shadow-lg animate-pulse-slow text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  New
                </Badge>
              </div>
            </div>
          </div>
          
          <div>
            <CardTitle className="text-3xl md:text-4xl font-heading font-bold mb-2 gradient-gold bg-clip-text text-transparent">
              Create Account
            </CardTitle>
            <CardDescription className="text-sm md:text-base text-muted-foreground px-2">
              Join the ECE EDU PORTAL community today
            </CardDescription>
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 text-xs px-4">
            {[
              { icon: CheckCircle2, text: 'Free Forever' },
              { icon: CheckCircle2, text: 'Instant Access' },
              { icon: CheckCircle2, text: 'No Credit Card' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-1.5 text-gold font-medium">
                <item.icon className="w-4 h-4" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </CardHeader>
        
        <CardContent className="px-4 md:px-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold">Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input 
                          placeholder="John Doe" 
                          className="pl-10 md:pl-11 h-11 md:h-12 border-2 focus:border-gold transition-colors text-sm md:text-base" 
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
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input 
                          type="email" 
                          placeholder="student@college.edu" 
                          className="pl-10 md:pl-11 h-11 md:h-12 border-2 focus:border-gold transition-colors text-sm md:text-base" 
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
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input 
                          type="tel" 
                          placeholder="1234567890" 
                          className="pl-10 md:pl-11 h-11 md:h-12 border-2 focus:border-gold transition-colors text-sm md:text-base" 
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
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10 md:pl-11 h-11 md:h-12 border-2 focus:border-gold transition-colors text-sm md:text-base" 
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
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          className="pl-10 md:pl-11 h-11 md:h-12 border-2 focus:border-gold transition-colors text-sm md:text-base" 
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
                className="w-full gradient-gold text-navy font-bold h-11 md:h-12 text-sm md:text-base rounded-xl hover:shadow-gold transition-all duration-300 relative overflow-hidden group mt-4 md:mt-6 border-2 border-gold/20"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 md:h-5 md:w-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <span className="relative z-10 font-bold">Create My Account</span>
                    <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500"></div>
                  </>
                )}
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
                  Already Have an Account?
                </span>
              </div>
            </div>
            
            <Link to="/login" className="block">
              <Button variant="outline" className="w-full h-11 md:h-12 border-2 border-navy hover:border-gold hover:bg-gold/5 font-semibold rounded-xl transition-all text-sm md:text-base">
                Sign In Instead
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
    </div>
  );
};

export default Register;
