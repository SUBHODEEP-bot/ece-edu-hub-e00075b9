import { useState } from 'react';
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

  const handleDownloadPDF = () => {
    // Create a printable version
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="gradient-primary text-white p-4 sm:p-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <Calendar className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-lg sm:text-xl md:text-2xl break-words">Study Timetable Generator</CardTitle>
              <CardDescription className="text-blue-50 text-xs sm:text-sm">
                Create your personalized weekly study schedule
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Student Info */}
          <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
            <p className="text-xs sm:text-sm text-muted-foreground">Student Name</p>
            <p className="text-base sm:text-lg font-semibold text-foreground">{profile?.name || 'Loading...'}</p>
          </div>

          {/* Study Days Selection */}
          <div className="space-y-2">
            <Label htmlFor="studyDays" className="text-sm sm:text-base">Number of Study Days per Week</Label>
            <Select value={studyDays.toString()} onValueChange={(v) => setStudyDays(parseInt(v))}>
              <SelectTrigger id="studyDays" className="h-11 sm:h-10">
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
          <div className="space-y-3 sm:space-y-4">
            <Label className="text-sm sm:text-base">Add Subjects</Label>
            <div className="flex flex-col gap-3">
              <Input
                placeholder="Subject name (e.g., Network Theory)"
                value={currentSubject}
                onChange={(e) => setCurrentSubject(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                className="h-11 sm:h-10 text-base sm:text-sm"
              />
              <div className="flex gap-2 sm:gap-3">
                <Select value={currentDifficulty} onValueChange={(v) => setCurrentDifficulty(v as Difficulty)}>
                  <SelectTrigger className="flex-1 h-11 sm:h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy (1x/week)</SelectItem>
                    <SelectItem value="medium">Medium (2x/week)</SelectItem>
                    <SelectItem value="hard">Hard (3x/week)</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={addSubject} className="gradient-primary h-11 sm:h-10 px-4 sm:px-6">
                  <Plus className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Add</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Subjects List */}
          {subjects.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm sm:text-base">Your Subjects ({subjects.length})</Label>
              <div className="space-y-2">
                {subjects.map(subject => (
                  <div
                    key={subject.id}
                    className="flex items-start sm:items-center justify-between p-3 bg-card border rounded-lg hover:shadow-md transition-smooth gap-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium text-foreground text-sm sm:text-base break-words">{subject.name}</span>
                      <div className="flex items-center gap-2 flex-wrap">
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
                      className="text-destructive hover:text-destructive flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              onClick={handleGenerateTimetable}
              disabled={subjects.length === 0}
              className="gradient-primary flex-1 h-12 sm:h-11 text-base sm:text-sm"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Generate Timetable
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="h-12 sm:h-11 text-base sm:text-sm"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generated Timetable */}
      {generatedTimetable.length > 0 && (
        <Card className="border-2 border-success/20 shadow-lg animate-scale-in print:shadow-none">
          <CardHeader className="gradient-secondary text-white print:bg-none print:text-black p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl md:text-2xl break-words">Your Weekly Study Timetable</CardTitle>
                <CardDescription className="text-blue-100 print:text-gray-600 text-xs sm:text-sm">
                  Studying {studyDays} days/week • {subjects.length} subjects
                </CardDescription>
              </div>
              <Button
                onClick={handleDownloadPDF}
                variant="outline"
                size="sm"
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 print:hidden h-10 sm:h-9 flex-shrink-0"
              >
                <Download className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Print/PDF</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {generatedTimetable.map((day, index) => (
                <Card
                  key={day.day}
                  className="border-2 hover:shadow-lg transition-smooth animate-scale-in print:break-inside-avoid"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-3 bg-muted/30 p-3 sm:p-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                      {day.day}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3 sm:pt-4 p-3 sm:p-4 space-y-2 sm:space-y-3">
                    {day.subjects.length > 0 ? (
                      day.subjects.map((subject, idx) => (
                        <div
                          key={`${subject.id}-${idx}`}
                          className="p-2.5 sm:p-3 bg-card border-l-4 rounded-r-lg transition-smooth hover:shadow-md"
                          style={{
                            borderColor: subject.difficulty === 'hard' ? 'hsl(var(--destructive))' :
                                       subject.difficulty === 'medium' ? 'hsl(var(--primary))' :
                                       'hsl(var(--success))'
                          }}
                        >
                          <p className="font-semibold text-foreground text-sm sm:text-base break-words">{subject.name}</p>
                          <Badge className={`mt-2 ${getDifficultyColor(subject.difficulty)} text-xs`} variant="secondary">
                            {subject.difficulty}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs sm:text-sm text-muted-foreground italic">No classes scheduled</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-muted/30 rounded-lg print:mt-6">
              <p className="text-xs sm:text-sm font-semibold mb-3 text-foreground">Difficulty Legend:</p>
              <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Badge className="bg-success text-success-foreground text-xs">Easy</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">1x per week</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-primary text-primary-foreground text-xs">Medium</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">2x per week</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-destructive text-destructive-foreground text-xs">Hard</Badge>
                  <span className="text-xs sm:text-sm text-muted-foreground">3x per week</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
