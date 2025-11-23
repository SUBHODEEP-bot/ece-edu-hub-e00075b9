import { Link } from 'react-router-dom';
import { BookOpen, FileText, Calendar, GraduationCap, Users, ArrowRight, Sparkles, Trophy, TrendingUp, CheckCircle2, Database, Cpu, CircuitBoard, Wifi, Award, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Landing = () => {
  const features = [
    {
      icon: FileText,
      title: 'Question Papers Archive',
      description: 'Comprehensive collection of previous year question papers organized by subject and semester',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      gradient: 'from-primary/20 to-primary/5',
    },
    {
      icon: BookOpen,
      title: 'Study Materials',
      description: 'High-quality notes and study materials curated by faculty and top students',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      gradient: 'from-secondary/20 to-secondary/5',
    },
    {
      icon: GraduationCap,
      title: 'Updated Syllabus',
      description: 'Always up-to-date curriculum and syllabus for all semesters with detailed breakdowns',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      gradient: 'from-accent/20 to-accent/5',
    },
    {
      icon: Calendar,
      title: 'Events & Updates',
      description: 'Stay connected with departmental activities, workshops, and technical events',
      color: 'text-success',
      bgColor: 'bg-success/10',
      gradient: 'from-success/20 to-success/5',
    },
  ];

  const stats = [
    { icon: Database, label: 'Study Resources', value: '500+', color: 'text-primary', desc: 'Quality Materials' },
    { icon: Users, label: 'Active Students', value: '1000+', color: 'text-secondary', desc: 'Engaged Learners' },
    { icon: Trophy, label: 'Success Rate', value: '95%', color: 'text-accent', desc: 'Pass Percentage' },
    { icon: TrendingUp, label: 'Annual Events', value: '50+', color: 'text-success', desc: 'Technical Programs' },
  ];

  const techIcons = [
    { icon: Cpu, label: 'Microprocessors', delay: '0s' },
    { icon: CircuitBoard, label: 'Digital Circuits', delay: '0.5s' },
    { icon: Wifi, label: 'Communication', delay: '1s' },
    { icon: Database, label: 'Embedded Systems', delay: '1.5s' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Animated Circuit Pattern Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-primary rounded-full animate-pulse-slow"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                top: Math.random() * 100 + '%',
                left: Math.random() * 100 + '%',
                animationDelay: Math.random() * 3 + 's',
              }}
            />
          ))}
        </div>
      </div>

      {/* Hero Section - Luxurious Gold & Navy Theme */}
      <section className="relative gradient-secondary text-white pt-12 pb-20 md:pt-20 md:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-60"></div>
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-10"></div>
        
        {/* Animated Tech Icons - Hidden on mobile */}
        <div className="absolute inset-0 overflow-hidden hidden md:block">
          <div className="absolute top-10 left-10 w-20 h-20 border-2 border-gold/30 rounded-lg rotate-12 animate-float"></div>
          <div className="absolute top-40 right-20 w-16 h-16 border-2 border-gold/30 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-40 left-1/4 w-12 h-12 border-2 border-gold/30 rounded-lg -rotate-12 animate-float"></div>
          <CircuitBoard className="absolute top-1/4 right-1/4 w-32 h-32 text-gold/10 animate-pulse-slow" />
          <Cpu className="absolute bottom-1/4 left-1/3 w-24 h-24 text-gold/10 animate-pulse-slow" style={{ animationDelay: '1s' }} />
        </div>
        
        {/* Floating Gold Orbs */}
        <div className="absolute top-20 left-[10%] w-64 h-64 md:w-96 md:h-96 bg-gold/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-[10%] w-80 h-80 md:w-[500px] md:h-[500px] bg-gold/15 rounded-full blur-3xl animate-float-delayed"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full mb-6 md:mb-8 hover:scale-105 transition-smooth animate-slide-up border-2 border-gold/40 bg-gold/10 backdrop-blur-md">
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-gold animate-pulse-slow" />
              <span className="text-xs md:text-sm font-medium text-gold">Electronics & Communication Engineering Department</span>
            </div>
            
            {/* Main Heading */}
            <div className="mb-6 md:mb-8 animate-slide-up-delayed">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-heading font-black mb-3 md:mb-4 leading-tight">
                <span className="inline-block text-white drop-shadow-2xl">
                  ECE EDU
                </span>
              </h1>
              <div className="inline-block px-6 py-3 md:px-10 md:py-5 rounded-2xl md:rounded-3xl shadow-gold border-2 border-gold bg-gold backdrop-blur-md">
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
                  PORTAL
                </p>
              </div>
            </div>
            
            {/* Subtitle */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-silver mb-4 md:mb-6 max-w-4xl mx-auto leading-relaxed animate-slide-up px-4" style={{ animationDelay: '0.3s' }}>
              Your Comprehensive Digital Platform for Academic Excellence
            </p>
            
            {/* Tech Badges */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8 md:mb-12 animate-scale-in px-4" style={{ animationDelay: '0.4s' }}>
              {techIcons.map((tech, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="border-2 border-gold/30 bg-gold/10 text-gold px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-medium hover:scale-110 hover:bg-gold/20 hover:border-gold/50 transition-smooth backdrop-blur-md"
                  style={{ animationDelay: tech.delay }}
                >
                  <tech.icon className="w-3 h-3 md:w-4 md:h-4 mr-1.5 md:mr-2" />
                  <span className="hidden sm:inline">{tech.label}</span>
                </Badge>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center animate-slide-up px-4" style={{ animationDelay: '0.5s' }}>
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto gradient-gold text-navy hover:shadow-gold font-bold shadow-gold hover:scale-105 px-8 py-5 md:px-10 md:py-7 text-base md:text-lg rounded-2xl group transition-smooth relative overflow-hidden border-2 border-gold/20">
                  <span className="relative z-10 flex items-center justify-center font-bold">
                    Access Student Portal
                    <ArrowRight className="ml-2 w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-2 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Button>
              </Link>
              
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gold/50 bg-white/10 text-gold hover:bg-gold/20 hover:border-gold font-bold px-8 py-5 md:px-10 md:py-7 text-base md:text-lg rounded-2xl transition-smooth backdrop-blur-md">
                  Register Now
                </Button>
              </Link>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 max-w-4xl mx-auto animate-scale-in px-4" style={{ animationDelay: '0.6s' }}>
              {[
                { icon: CheckCircle2, label: 'Verified Resources', value: '100%' },
                { icon: Users, label: 'Active Users', value: '1K+' },
                { icon: Award, label: 'Success Rate', value: '95%' },
                { icon: Zap, label: 'Quick Access', value: '24/7' },
              ].map((stat, index) => (
                <div key={index} className="bg-gold/10 backdrop-blur-md p-3 md:p-4 rounded-xl md:rounded-2xl text-center border-2 border-gold/30 hover:scale-105 hover:bg-gold/20 hover:border-gold/50 transition-smooth">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-gold" />
                  <div className="text-xl md:text-2xl font-bold mb-0.5 md:mb-1 text-gold">{stat.value}</div>
                  <div className="text-[10px] md:text-xs text-silver">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Advanced Wave Separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" className="w-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--background))" stopOpacity="0.8" />
                <stop offset="50%" stopColor="hsl(var(--background))" stopOpacity="1" />
                <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path fill="url(#wave-gradient)" d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"></path>
          </svg>
        </div>
      </section>

      {/* Features Section - Modern Cards */}
      <section className="py-16 md:py-28 px-4 relative">
        <div className="absolute inset-0 bg-grid-pattern opacity-30"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center mb-12 md:mb-20 animate-slide-up">
            <Badge className="mb-3 md:mb-4 px-4 md:px-6 py-1.5 md:py-2 gradient-gold text-navy border-gold/20 text-xs md:text-sm">
              FEATURES
            </Badge>
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-4 md:mb-6 text-foreground px-4">
              Everything You Need to
              <span className="block text-navy font-black mt-2">
                Excel in Your Studies
              </span>
            </h2>
            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
              Comprehensive resources and tools designed to support your academic journey from start to finish
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 px-2">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-gold/30 hover:-translate-y-2 animate-scale-in bg-gradient-to-br from-card to-card/50 backdrop-blur-sm overflow-hidden relative w-full"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 bg-gradient-to-br ${feature.gradient} rounded-bl-[80px] sm:rounded-bl-[120px] group-hover:scale-150 transition-all duration-500 opacity-50`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gold/0 to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <CardHeader className="relative z-10 p-4 sm:p-6">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 ${feature.bgColor} rounded-xl md:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 md:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg relative`}>
                    <feature.icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${feature.color}`} />
                    <div className={`absolute inset-0 ${feature.bgColor} rounded-xl md:rounded-2xl blur-xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                  </div>
                  <CardTitle className="text-base sm:text-lg md:text-2xl font-heading group-hover:text-gold transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10 p-4 sm:p-6 pt-0">
                  <CardDescription className="text-sm md:text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
                
                <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gold" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer - Professional Gold Theme */}
      <footer className="gradient-navy text-white py-12 md:py-16 px-4 relative overflow-hidden border-t-4 border-gold">
        <div className="absolute inset-0 bg-grid-pattern-dark opacity-5"></div>
        <div className="absolute top-0 right-0 w-64 h-64 md:w-96 md:h-96 bg-gold/10 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-16 md:h-16 gradient-gold rounded-xl md:rounded-2xl flex items-center justify-center shadow-gold">
                <GraduationCap className="w-6 h-6 md:w-9 md:h-9 text-navy" />
              </div>
              <div className="text-center sm:text-left">
                <span className="text-2xl md:text-3xl font-heading font-bold block text-gold">ECE EDU PORTAL</span>
                <span className="text-xs md:text-sm text-silver">Electronics & Communication Engineering</span>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6 md:mb-8 text-xs md:text-sm">
              <Link to="/login" className="hover:text-gold transition-colors font-medium">Student Login</Link>
              <Link to="/register" className="hover:text-gold transition-colors font-medium">Register</Link>
              <a href="#features" className="hover:text-gold transition-colors font-medium">Features</a>
              <a href="#stats" className="hover:text-gold transition-colors font-medium">About</a>
            </div>
            
            <div className="border-t border-gold/20 pt-6 md:pt-8">
              <p className="text-xs md:text-sm text-silver mb-2 font-medium px-4">
                © 2025 ECE EDU PORTAL - Electronics & Communication Engineering Department
              </p>
              <p className="text-[10px] md:text-xs text-silver/70 px-4">
                Empowering students with quality education resources
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
