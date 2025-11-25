import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

type Difficulty = 'easy' | 'medium' | 'hard';

interface Subject {
  id: string;
  name: string;
  difficulty: Difficulty;
}

interface TimetableDay {
  day: string;
  subjects: Subject[];
}

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getDifficultyColor = (difficulty: Difficulty) => {
  switch (difficulty) {
    case 'easy':
      return 'bg-success text-success-foreground';
    case 'medium':
      return 'bg-primary text-primary-foreground';
    case 'hard':
      return 'bg-destructive text-destructive-foreground';
  }
};

const getDifficultyFrequency = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case 'hard':
      return 3;
    case 'medium':
      return 2;
    case 'easy':
      return 1;
  }
};

const generateTimetable = (subjects: Subject[], studyDays: number): TimetableDay[] => {
  // Create array of subjects with their required frequency
  const subjectPool: Subject[] = [];
  subjects.forEach(subject => {
    const frequency = getDifficultyFrequency(subject.difficulty);
    for (let i = 0; i < frequency; i++) {
      subjectPool.push(subject);
    }
  });

  // Sort subjects: Hard first, then Medium, then Easy for consistent distribution
  subjectPool.sort((a, b) => {
    const difficultyOrder = { hard: 0, medium: 1, easy: 2 };
    return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
  });

  // Initialize days
  const timetable: TimetableDay[] = WEEKDAYS.slice(0, studyDays).map(day => ({
    day,
    subjects: []
  }));

  // Distribute subjects across days
  let currentDayIndex = 0;
  subjectPool.forEach(subject => {
    // Find the day with least subjects (max 2 per day)
    let targetDayIndex = currentDayIndex % studyDays;
    
    // Check if current day has less than 2 subjects
    if (timetable[targetDayIndex].subjects.length >= 2) {
      // Find next available day with space
      for (let i = 0; i < studyDays; i++) {
        const checkIndex = (currentDayIndex + i) % studyDays;
        if (timetable[checkIndex].subjects.length < 2) {
          targetDayIndex = checkIndex;
          break;
        }
      }
    }
    
    timetable[targetDayIndex].subjects.push(subject);
    currentDayIndex++;
  });

  return timetable;
};

export function TimetablePage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>('medium');
  const [studyDays, setStudyDays] = useState<number>(5);
  const [generatedTimetable, setGeneratedTimetable] = useState<TimetableDay[]>([]);
  const timetableRef = useRef<HTMLDivElement>(null);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addSubject = () => {
    if (currentSubject.trim()) {
      setSubjects([...subjects, {
        id: Date.now().toString(),
        name: currentSubject.trim(),
        difficulty: currentDifficulty
      }]);
      setCurrentSubject('');
      setCurrentDifficulty('medium');
    }
  };

  const removeSubject = (id: string) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleGenerateTimetable = () => {
    if (subjects.length === 0) return;
    const timetable = generateTimetable(subjects, studyDays);
    setGeneratedTimetable(timetable);
  };

  const handleReset = () => {
    setSubjects([]);
    setGeneratedTimetable([]);
    setCurrentSubject('');
    setStudyDays(5);
  };

  const handleDownloadPDF = async () => {
    if (!timetableRef.current) return;
    
    try {
      toast.loading('Generating PDF...');
      
      // Capture the timetable as canvas with higher quality
      const canvas = await html2canvas(timetableRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200,
        windowHeight: timetableRef.current.scrollHeight
      });
      
      // Calculate dimensions for PDF
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Create PDF with proper orientation
      const pdf = new jsPDF({
        orientation: imgHeight > pageHeight ? 'portrait' : 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // If content is longer than one page, add multiple pages
      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }
      
      pdf.save(`study-timetable-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.dismiss();
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate PDF');
      console.error('PDF generation error:', error);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 animate-fade-in px-2 sm:px-0">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="gradient-primary text-white p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl break-words">Study Timetable Generator</CardTitle>
              <CardDescription className="text-blue-50 text-xs sm:text-sm">
                Create your personalized weekly study schedule
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4 md:space-y-6">
          {/* Student Info */}
          <div className="p-2 sm:p-3 md:p-4 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Student Name</p>
            <p className="text-sm sm:text-base md:text-lg font-semibold text-foreground">{profile?.name || 'Loading...'}</p>
          </div>

          {/* Study Days Selection */}
          <div className="space-y-2">
            <Label htmlFor="studyDays" className="text-xs sm:text-sm md:text-base">Number of Study Days per Week</Label>
            <Select value={studyDays.toString()} onValueChange={(v) => setStudyDays(parseInt(v))}>
              <SelectTrigger id="studyDays" className="h-10 sm:h-10 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 7].map(num => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} days per week
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Subject */}
          <div className="space-y-2 sm:space-y-3">
            <Label className="text-xs sm:text-sm md:text-base">Add Subjects</Label>
            <div className="flex flex-col gap-2 sm:gap-3">
              <Input
                placeholder="Subject name (e.g., Network Theory)"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                className="h-10 text-sm"
              />
              <div className="flex gap-2">
                <Select value={currentDifficulty} onValueChange={(v) => setCurrentDifficulty(v as Difficulty)}>
                  <SelectTrigger className="flex-1 h-10 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (1x/week)</SelectItem>
                    <SelectItem value="medium">Medium (2x/week)</SelectItem>
                    <SelectItem value="hard">Hard (3x/week)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addSubject} className="gradient-primary h-10 px-3 sm:px-6">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Subjects List */}
          {subjects.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs sm:text-sm md:text-base">Your Subjects ({subjects.length})</Label>
              <div className="space-y-2">
                {subjects.map(subject => (
                  <div
                    key={subject.id}
                    className="flex items-start sm:items-center justify-between p-2 sm:p-3 bg-card border rounded-lg hover:shadow-md transition-smooth gap-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1 min-w-0">
                      <span className="font-medium text-foreground text-xs sm:text-sm md:text-base break-words">{subject.name}</span>
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        <Badge className={`${getDifficultyColor(subject.difficulty)} text-xs`}>
                          {subject.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          ({getDifficultyFrequency(subject.difficulty)}x/week)
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubject(subject.id)}
                      className="text-destructive hover:text-destructive flex-shrink-0 h-7 w-7 sm:h-8 sm:w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t">
            <Button
              onClick={handleGenerateTimetable}
              disabled={subjects.length === 0}
              className="gradient-primary flex-1 h-10 sm:h-11 text-sm"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Generate Timetable
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="h-10 sm:h-11 text-sm"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Timetable */}
      {generatedTimetable.length > 0 && (
        <Card className="border-2 border-success/20 shadow-lg animate-scale-in">
          <CardHeader className="gradient-secondary text-white p-3 sm:p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base sm:text-lg md:text-xl lg:text-2xl break-words">Your Weekly Study Routine</CardTitle>
                <CardDescription className="text-blue-100 text-xs sm:text-sm">
                  Studying {studyDays} days/week • {subjects.length} subjects
                </CardDescription>
              </div>
              <Button
                onClick={handleDownloadPDF}
                className="gradient-primary h-9 sm:h-9 flex-shrink-0 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                <span className="sm:hidden">Download PDF</span>
                <span className="hidden sm:inline">Download PDF</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6">
            {/* Timetable View for PDF */}
            <div ref={timetableRef} className="bg-white p-4 sm:p-6 rounded-lg">
              {/* Header */}
              <div className="text-center mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-primary">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-navy mb-2">
                  Weekly Study Timetable
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Student: {profile?.name} | Semester: {profile?.semester}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Generated on {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>

              {/* Routine Table */}
              <div className="overflow-x-auto -mx-3 sm:mx-0">
                <table className="w-full border-collapse min-w-[280px]">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="border-2 border-border p-2 sm:p-3 text-left text-white font-semibold text-xs sm:text-sm w-20 sm:w-32">
                        Day
                      </th>
                      <th className="border-2 border-border p-2 sm:p-3 text-left text-white font-semibold text-xs sm:text-sm">
                        Study Sessions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedTimetable.map((day, index) => (
                      <tr 
                        key={day.day}
                        className={index % 2 === 0 ? 'bg-muted/30' : 'bg-white'}
                      >
                        <td className="border-2 border-border p-2 sm:p-3 font-semibold text-foreground text-xs sm:text-sm">
                          {day.day}
                        </td>
                        <td className="border-2 border-border p-2 sm:p-3">
                          {day.subjects.length > 0 ? (
                            <div className="flex flex-col gap-1.5 sm:gap-2">
                              {day.subjects.map((subject, idx) => (
                                <div
                                  key={`${subject.id}-${idx}`}
                                  className="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded border-l-4"
                                  style={{
                                    borderColor: subject.difficulty === 'hard' ? '#ef4444' :
                                               subject.difficulty === 'medium' ? '#f59e0b' :
                                               '#22c55e',
                                    backgroundColor: subject.difficulty === 'hard' ? '#fef2f2' :
                                                   subject.difficulty === 'medium' ? '#fffbeb' :
                                                   '#f0fdf4'
                                  }}
                                >
                                  <span className="font-medium text-foreground flex-1 text-xs sm:text-sm break-words">
                                    {subject.name}
                                  </span>
                                  <span 
                                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-semibold whitespace-nowrap flex-shrink-0"
                                    style={{
                                      backgroundColor: subject.difficulty === 'hard' ? '#ef4444' :
                                                     subject.difficulty === 'medium' ? '#f59e0b' :
                                                     '#22c55e',
                                      color: 'white'
                                    }}
                                  >
                                    {subject.difficulty.toUpperCase()}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground italic text-xs sm:text-sm">No classes scheduled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Legend */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-muted/20 rounded-lg border-2 border-border">
                <p className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3 text-foreground">Difficulty Level Guide:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                  <div className="flex items-center gap-2 p-2 bg-white rounded border-l-4 border-success">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-success flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs sm:text-sm">Easy</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">1 session per week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border-l-4 border-primary">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs sm:text-sm">Medium</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">2 sessions per week</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-white rounded border-l-4 border-destructive">
                    <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-destructive flex-shrink-0"></div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-xs sm:text-sm">Hard</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground">3 sessions per week</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t text-center text-[10px] sm:text-xs text-muted-foreground">
                <p>Generated by ECE EDU PORTAL - Study Smart, Study Hard</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
