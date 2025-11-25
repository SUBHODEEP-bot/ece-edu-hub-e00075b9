import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  id: number;
  text: string;
  isBot: boolean;
}

const HelpChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi! I'm here to help you navigate the ECE EDU Portal. Ask me anything about using the platform!",
      isBot: true,
    },
  ]);
  const [input, setInput] = useState('');

  const quickQuestions = [
    "How do I register?",
    "What resources are available?",
    "How to access question papers?",
    "What is the attendance tracker?",
  ];

  const getResponse = (question: string): string => {
    const lowerQ = question.toLowerCase();

    if (lowerQ.includes('register') || lowerQ.includes('sign up')) {
      return "To register: Click 'Register Now' → Enter your college email, name, mobile number, and choose your semester → Create a password → Submit! You'll be logged in automatically.";
    }
    
    if (lowerQ.includes('login') || lowerQ.includes('sign in')) {
      return "To login: Click 'Access Student Portal' → Enter your college email and password → Click Login. You'll be directed to your dashboard.";
    }

    if (lowerQ.includes('resources') || lowerQ.includes('materials')) {
      return "Available resources: Previous Year Question Papers (PYQ), Study Notes, Syllabus, Lab Manuals, Organizers, Events, and MAR Support materials - all organized by semester!";
    }

    if (lowerQ.includes('question paper') || lowerQ.includes('pyq')) {
      return "Access Question Papers: Login → Dashboard → 'Question Papers' section. You can view, download PDFs, and use the Smart PYQ Analyzer to analyze patterns and important topics!";
    }

    if (lowerQ.includes('notes') || lowerQ.includes('study material')) {
      return "Access Notes: Login → Dashboard → 'Notes' section. All notes are filtered by your semester and organized by subject. Download or view directly!";
    }

    if (lowerQ.includes('attendance') || lowerQ.includes('track')) {
      return "Attendance Tracker: Login → Dashboard → 'Attendance' section. Add your subjects with their schedules, mark daily attendance, and view both today's and overall attendance percentages!";
    }

    if (lowerQ.includes('profile') || lowerQ.includes('account')) {
      return "Manage Profile: Login → Dashboard → 'Profile' section. Update your name, email, mobile number, semester, and upload a profile photo!";
    }

    if (lowerQ.includes('lab manual')) {
      return "Access Lab Manuals: Login → Dashboard → 'Lab Manuals' section. View or download lab manuals for your semester, organized by subject!";
    }

    if (lowerQ.includes('event') || lowerQ.includes('organizer')) {
      return "View Events & Organizers: Login → Dashboard → 'Events' and 'Organizers' sections. Stay updated with departmental activities, workshops, and access organizational materials!";
    }

    if (lowerQ.includes('timetable') || lowerQ.includes('schedule')) {
      return "Create Study Timetable: Login → Dashboard → 'Timetable' section. Enter your subjects with difficulty levels, select study days, and generate a personalized weekly study schedule!";
    }

    if (lowerQ.includes('admin')) {
      return "Admin Access: Click 'Admin Login' on the home page → Enter admin credentials (Username: SUBHODEEP PAL). Admins can manage all resources, users, and notifications.";
    }

    if (lowerQ.includes('semester') || lowerQ.includes('change')) {
      return "Change Semester: Login → Go to Profile section → Update your semester. All resources will automatically filter based on your selected semester!";
    }

    if (lowerQ.includes('help') || lowerQ.includes('support')) {
      return "Need help? Use this chatbot for guidance, or contact your department administrator. All resources are designed to be user-friendly and mobile-responsive!";
    }

    return "I can help you with: Registration, Login, Question Papers, Notes, Syllabus, Lab Manuals, Attendance Tracking, Profile Management, Events, Organizers, Study Timetable, and Admin features. What would you like to know?";
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      isBot: false,
    };

    const botResponse: Message = {
      id: messages.length + 2,
      text: getResponse(input),
      isBot: true,
    };

    setMessages([...messages, userMessage, botResponse]);
    setInput('');
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => handleSend(), 100);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-gold gradient-gold hover:shadow-glow-hover transition-smooth z-50"
        size="icon"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-navy" />
        ) : (
          <MessageCircle className="h-6 w-6 text-navy" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 left-6 w-[90vw] sm:w-96 h-[500px] shadow-xl border-2 border-gold/30 z-50 flex flex-col">
          <CardHeader className="gradient-gold border-b-2 border-gold/30 flex-shrink-0">
            <CardTitle className="text-navy flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              ECE Portal Guide
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
            {/* Messages */}
            <ScrollArea className="flex-1 pr-4 mb-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-lg ${
                        message.isBot
                          ? 'bg-secondary text-secondary-foreground'
                          : 'gradient-gold text-navy'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick Questions */}
            {messages.length <= 1 && (
              <div className="mb-4 flex-shrink-0">
                <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-2">
                  {quickQuestions.map((q, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickQuestion(q)}
                      className="text-xs border-gold/30 hover:bg-gold/10"
                    >
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 flex-shrink-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="gradient-gold text-navy hover:shadow-gold"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default HelpChatbot;
