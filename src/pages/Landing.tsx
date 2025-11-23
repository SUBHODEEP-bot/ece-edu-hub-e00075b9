import { Link } from 'react-router-dom';
import { BookOpen, FileText, Calendar, GraduationCap, Users, ArrowRight, Sparkles, Trophy, Target, TrendingUp, Zap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Landing = () => {
  const features = [
    {
      icon: FileText,
      title: 'Question Papers Archive',
      description: 'Comprehensive collection of previous year question papers organized by subject and semester',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      icon: BookOpen,
      title: 'Study Materials',
      description: 'High-quality notes and study materials curated by faculty and top students',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
    },
    {
      icon: GraduationCap,
      title: 'Updated Syllabus',
      description: 'Always up-to-date curriculum and syllabus for all semesters with detailed breakdowns',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      icon: Calendar,
      title: 'Events & Updates',
      description: 'Stay connected with departmental activities, workshops, and technical events',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  const stats = [
    { icon: BookOpen, label: 'Study Resources', value: '500+', color: 'text-primary' },
    { icon: Users, label: 'Active Students', value: '1000+', color: 'text-secondary' },
    { icon: Trophy, label: 'Success Rate', value: '95%', color: 'text-accent' },
    { icon: TrendingUp, label: 'Annual Events', value: '50+', color: 'text-success' },
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Fast Access',
      description: 'Instant access to all resources anytime, anywhere',
    },
    {
      icon: Shield,
      title: 'Verified Content',
      description: 'All materials verified by department faculty',
    },
    {
      icon: Target,
      title: 'Exam Focused',
      description: 'Resources tailored for exam preparation',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Mesh */}
      <section className="relative gradient-hero text-white py-32 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-30"></div>
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-20"></div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary-light/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-float-delayed"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full mb-8 hover:scale-105 transition-smooth">
              <Sparkles className="w-5 h-5 text-accent" />
              <span className="text-sm font-medium">Welcome to ECE Department Portal</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-heading font-bold mb-6 leading-tight">
              ECE EDU PORTAL
            </h1>
            
            <div className="inline-block glass-card px-8 py-4 rounded-2xl mb-8">
              <p className="text-2xl md:text-3xl font-semibold bg-gradient-to-r from-primary-light to-secondary bg-clip-text text-transparent">
                Electronics & Communication Engineering
              </p>
            </div>
            
            <p className="text-lg md:text-xl text-blue-50 mb-12 max-w-3xl mx-auto leading-relaxed">
              Your comprehensive digital platform for academic excellence. Access curated study materials, 
              previous year papers, and stay updated with departmental activities.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up-delayed">
              <Link to="/login">
                <Button size="lg" className="bg-white text-primary hover:bg-blue-50 font-semibold shadow-xl hover:shadow-glow-hover px-8 py-6 text-lg rounded-xl group transition-smooth">
                  Student Portal
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/register">
                <Button size="lg" variant="outline" className="glass border-2 border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-6 text-lg rounded-xl transition-smooth">
                  Register Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full">
            <path fill="hsl(var(--background))" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-background to-muted/30 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-16 animate-slide-up">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                FEATURES
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-foreground">
              Everything You Need to Excel
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive resources designed to support your academic journey
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-smooth border-2 hover:border-primary/20 hover-lift animate-scale-in bg-card/50 backdrop-blur-sm overflow-hidden relative"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-bl-[100px] group-hover:scale-150 transition-smooth"></div>
                <CardHeader>
                  <div className={`w-14 h-14 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-smooth shadow-md`}>
                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-heading group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 gradient-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center group animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 group-hover:scale-110 transition-smooth">
                  <stat.icon className="w-8 h-8" />
                </div>
                <div className="text-5xl font-heading font-bold mb-2 group-hover:scale-110 transition-smooth">
                  {stat.value}
                </div>
                <div className="text-blue-100 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="text-center p-8 rounded-2xl hover:bg-card transition-smooth animate-scale-in group"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-6 group-hover:scale-110 group-hover:shadow-glow transition-smooth">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-heading font-semibold mb-3 text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-10"></div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <div className="glass-card p-12 rounded-3xl shadow-2xl animate-scale-in">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl mb-6 shadow-glow">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 text-foreground">
              Join Our Community
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Be part of a thriving community of students and educators. Access premium study materials 
              and stay ahead in your academic journey.
            </p>
            <Link to="/register">
              <Button size="lg" className="gradient-primary text-white hover:shadow-glow-hover font-semibold px-10 py-6 text-lg rounded-xl group transition-smooth">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-sidebar text-sidebar-foreground py-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10"></div>
        <div className="container mx-auto max-w-7xl text-center relative z-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-heading font-bold">ECE EDU PORTAL</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Electronics & Communication Engineering Department
          </p>
          <p className="text-xs text-muted-foreground">
            © 2025 ECE EDU PORTAL. All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
