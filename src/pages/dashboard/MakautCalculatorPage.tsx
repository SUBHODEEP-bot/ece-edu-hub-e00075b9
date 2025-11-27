import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MakautCalculatorPage = () => {
  const { toast } = useToast();
  const [oddCreditPoints, setOddCreditPoints] = useState('');
  const [evenCreditPoints, setEvenCreditPoints] = useState('');
  const [oddTotalCredits, setOddTotalCredits] = useState('');
  const [evenTotalCredits, setEvenTotalCredits] = useState('');
  const [numSubjects, setNumSubjects] = useState('');
  const [result, setResult] = useState<{
    percentage: number;
    cgpa: number;
    totalPoints: number;
    totalCredits: number;
  } | null>(null);

  const handleCalculate = () => {
    const oddPoints = parseFloat(oddCreditPoints) || 0;
    const evenPoints = parseFloat(evenCreditPoints) || 0;
    const oddCredits = parseFloat(oddTotalCredits) || 0;
    const evenCredits = parseFloat(evenTotalCredits) || 0;
    const subjects = parseFloat(numSubjects) || 0;

    if (oddCredits === 0 && evenCredits === 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid credit values",
        variant: "destructive",
      });
      return;
    }

    const totalPoints = oddPoints + evenPoints;
    const totalCredits = oddCredits + evenCredits;
    const cgpa = totalPoints / totalCredits;
    const percentage = (cgpa - 0.5) * 10;

    setResult({
      percentage: Math.round(percentage * 100) / 100,
      cgpa: Math.round(cgpa * 100) / 100,
      totalPoints,
      totalCredits,
    });

    toast({
      title: "Calculation Complete",
      description: "Your MAKAUT results have been calculated!",
    });
  };

  const handleReset = () => {
    setOddCreditPoints('');
    setEvenCreditPoints('');
    setOddTotalCredits('');
    setEvenTotalCredits('');
    setNumSubjects('');
    setResult(null);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="gradient-primary text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8" />
            <div>
              <CardTitle className="text-xl md:text-2xl">Marks and Percentage Calculator (MAKAUT)</CardTitle>
              <CardDescription className="text-blue-50">
                Calculate your CGPA and percentage based on MAKAUT credit system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Input Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oddCreditPoints" className="text-base font-semibold">
                Odd Semester Total Credit Points:
              </Label>
              <Input
                id="oddCreditPoints"
                type="number"
                placeholder="Enter odd total credits semester points"
                value={oddCreditPoints}
                onChange={(e) => setOddCreditPoints(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evenCreditPoints" className="text-base font-semibold">
                Even Semester Total Credit Points:
              </Label>
              <Input
                id="evenCreditPoints"
                type="number"
                placeholder="Enter even total credits semester points"
                value={evenCreditPoints}
                onChange={(e) => setEvenCreditPoints(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oddTotalCredits" className="text-base font-semibold">
                Total Credits in Odd Semester:
              </Label>
              <Input
                id="oddTotalCredits"
                type="number"
                placeholder="Enter odd semester total credits"
                value={oddTotalCredits}
                onChange={(e) => setOddTotalCredits(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evenTotalCredits" className="text-base font-semibold">
                Total Credits in Even Semester:
              </Label>
              <Input
                id="evenTotalCredits"
                type="number"
                placeholder="Enter even semester total credits"
                value={evenTotalCredits}
                onChange={(e) => setEvenTotalCredits(e.target.value)}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numSubjects" className="text-base font-semibold">
                Number of Subjects:
              </Label>
              <Input
                id="numSubjects"
                type="number"
                placeholder="Enter number of subjects"
                value={numSubjects}
                onChange={(e) => setNumSubjects(e.target.value)}
                className="text-base border-2 border-foreground"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={handleCalculate}
              className="flex-1 min-w-[150px] h-12 text-base font-semibold"
              size="lg"
            >
              <Calculator className="w-5 h-5 mr-2" />
              Calculate
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 min-w-[150px] h-12 text-base font-semibold"
              size="lg"
            >
              Reset
            </Button>
          </div>

          {/* Results Display */}
          {result && (
            <Card className="bg-muted/50 border-2 border-primary/30 animate-slide-up">
              <CardHeader>
                <CardTitle className="text-xl">Calculation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-lg border">
                    <p className="text-sm text-muted-foreground">CGPA</p>
                    <p className="text-3xl font-bold text-primary">{result.cgpa}</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <p className="text-sm text-muted-foreground">Percentage</p>
                    <p className="text-3xl font-bold text-primary">{result.percentage}%</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <p className="text-sm text-muted-foreground">Total Credit Points</p>
                    <p className="text-2xl font-bold">{result.totalPoints}</p>
                  </div>
                  <div className="p-4 bg-background rounded-lg border">
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-2xl font-bold">{result.totalCredits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MakautCalculatorPage;
