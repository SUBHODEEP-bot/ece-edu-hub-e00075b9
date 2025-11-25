import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, Brain, TrendingUp, Target, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Question {
  question: string;
  topic: string;
  importance: number;
}

interface TopicWeightage {
  topic: string;
  count: number;
  percentage: number;
}

interface PredictedQuestion {
  question: string;
  probability: number;
  reason: string;
  topic: string;
}

interface AnalysisResult {
  subjectName?: string;
  questions?: Question[];
  topicWeightage?: TopicWeightage[];
  difficulty?: string;
  predictedQuestions?: PredictedQuestion[];
  repeatedQuestions?: Question[];
}

export const PYQAnalyzerPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
        setFile(selectedFile);
        setAnalysis(null);
      } else {
        toast({
          title: 'Invalid File Type',
          description: 'Please upload a PDF or text file',
          variant: 'destructive',
        });
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeDocument = async () => {
    if (!file) return;

    setAnalyzing(true);
    setUploadProgress(10);
    
    try {
      let payload: any = {};

      if (file.type === 'text/plain') {
        // For text files, read directly
        const textContent = await file.text();
        setUploadProgress(30);
        payload = { 
          extractedText: textContent,
          isPdf: false
        };
      } else {
        // For PDFs, convert to base64
        const base64Data = await fileToBase64(file);
        setUploadProgress(30);
        payload = {
          pdfBase64: base64Data,
          isPdf: true
        };
      }

      setUploadProgress(50);

      // Send to backend for analysis
      const { data, error } = await supabase.functions.invoke('analyze-pyq', {
        body: payload,
      });

      if (error) throw error;

      setUploadProgress(80);

      if (data?.analysis) {
        setAnalysis(data.analysis);
        setUploadProgress(100);
        toast({
          title: 'Analysis Complete',
          description: 'PYQ analysis successful!',
        });
      } else {
        throw new Error('No analysis data received');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Failed to analyze document',
        variant: 'destructive',
      });
      setUploadProgress(0);
    } finally {
      setAnalyzing(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.7) return 'text-green-600';
    if (prob >= 0.4) return 'text-yellow-600';
    return 'text-orange-600';
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          Smart PYQ Analyzer
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
          Upload any PYQ and get AI-powered analysis with most important questions and topics
        </p>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">Upload PYQ Document</CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Upload a PDF or text file containing previous year questions
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 sm:p-8 text-center cursor-pointer hover:border-primary transition-colors"
            >
              <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-sm sm:text-base font-medium mb-1 sm:mb-2">
                {file ? file.name : 'Click to upload PYQ file'}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Supports PDF and TXT files
              </p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 sm:p-4 bg-muted rounded-lg">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium truncate flex-1">{file.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {(file.size / 1024).toFixed(1)} KB
                </Badge>
              </div>
            )}

            {analyzing && uploadProgress > 0 && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="h-2" />
                <p className="text-xs text-center text-muted-foreground">
                  {uploadProgress < 40 ? 'Processing file...' : uploadProgress < 70 ? 'Analyzing with AI...' : 'Finalizing...'}
                </p>
              </div>
            )}

            <Button
              onClick={analyzeDocument}
              disabled={!file || analyzing}
              className="w-full h-11 sm:h-10 text-sm sm:text-base"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze with Gemini AI
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4 sm:space-y-6">
          {/* Subject Name */}
          {analysis.subjectName && (
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Detected Subject</p>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">{analysis.subjectName}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Difficulty & Overview */}
          {analysis.difficulty && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  Overall Difficulty
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${getDifficultyColor(analysis.difficulty)}`} />
                  <span className="text-lg sm:text-xl font-bold capitalize">{analysis.difficulty}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Topic Weightage */}
          {analysis.topicWeightage && analysis.topicWeightage.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
                  Most Important Topics (Highest Weightage)
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Focus on these topics for maximum marks
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {analysis.topicWeightage.map((item, idx) => (
                  <div key={idx} className="space-y-1 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium capitalize">{item.topic.replace(/-/g, ' ')}</span>
                      <span className="text-muted-foreground">
                        {item.count} questions ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Important Repeated Questions - Show First */}
          {analysis.repeatedQuestions && analysis.repeatedQuestions.length > 0 && (
            <Card className="border-2 border-primary">
              <CardHeader className="p-4 sm:p-6 bg-primary/5">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-primary">
                  <Target className="w-5 h-5 sm:w-6 sm:h-6" />
                  ⭐ Top {analysis.repeatedQuestions.length} Most Important Questions
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  High-priority questions with high importance scores - Focus on these!
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                {analysis.repeatedQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 sm:p-4 border-2 border-primary/20 rounded-lg space-y-2 bg-primary/5">
                    <div className="flex items-start gap-2">
                      <span className="text-lg font-bold text-primary shrink-0">#{idx + 1}</span>
                      <p className="text-xs sm:text-sm font-medium flex-1">{q.question}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {q.topic.replace(/-/g, ' ')}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">Importance:</span>
                        <Progress value={q.importance * 100} className="w-16 sm:w-20 h-1.5" />
                        <span className="text-xs font-bold text-primary">{(q.importance * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Predicted Questions */}
          {analysis.predictedQuestions && analysis.predictedQuestions.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  Predicted Questions for Next Year
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  AI-predicted probable questions based on pattern analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-3 sm:space-y-4">
                {analysis.predictedQuestions.map((pq, idx) => (
                  <div key={idx} className="p-3 sm:p-4 border-l-4 border-primary bg-muted/30 rounded space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="text-xs sm:text-sm font-medium flex-1">{pq.question}</p>
                      <Badge className={`${getProbabilityColor(pq.probability)} text-xs whitespace-nowrap`}>
                        {(pq.probability * 100).toFixed(0)}% Probability
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {pq.topic.replace(/-/g, ' ')}
                      </Badge>
                      <p className="text-xs text-muted-foreground italic">{pq.reason}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};
