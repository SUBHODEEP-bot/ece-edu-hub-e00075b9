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
    ygpa: number;
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
    const ygpa = totalPoints / totalCredits;
    const percentage = (ygpa - 0.5) * 10;

    setResult({
      percentage: Math.round(percentage * 100) / 100,
      ygpa: Math.round(ygpa * 100) / 100,
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
    <div className="space-y-4 md:space-y-6 animate-slide-up">
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="gradient-primary text-white rounded-t-lg p-4 md:p-6">
          <div className="flex items-center gap-2 md:gap-3">
            <Calculator className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
            <div>
              <CardTitle className="text-base sm:text-lg md:text-2xl leading-tight">Marks and Percentage Calculator (MAKAUT)</CardTitle>
              <CardDescription className="text-blue-50 text-xs sm:text-sm mt-1">
                Calculate your YGPA and percentage based on MAKAUT credit system
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* Input Fields */}
          <div className="space-y-3 md:space-y-4">
            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="oddCreditPoints" className="text-sm md:text-base font-semibold">
                Odd Semester Total Credit Points:
              </Label>
              <Input
                id="oddCreditPoints"
                type="number"
                placeholder="Enter odd total credits semester points"
                value={oddCreditPoints}
                onChange={(e) => setOddCreditPoints(e.target.value)}
                className="text-sm md:text-base h-10 md:h-11"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="evenCreditPoints" className="text-sm md:text-base font-semibold">
                Even Semester Total Credit Points:
              </Label>
              <Input
                id="evenCreditPoints"
                type="number"
                placeholder="Enter even total credits semester points"
                value={evenCreditPoints}
                onChange={(e) => setEvenCreditPoints(e.target.value)}
                className="text-sm md:text-base h-10 md:h-11"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="oddTotalCredits" className="text-sm md:text-base font-semibold">
                Total Credits in Odd Semester:
              </Label>
              <Input
                id="oddTotalCredits"
                type="number"
                placeholder="Enter odd semester total credits"
                value={oddTotalCredits}
                onChange={(e) => setOddTotalCredits(e.target.value)}
                className="text-sm md:text-base h-10 md:h-11"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="evenTotalCredits" className="text-sm md:text-base font-semibold">
                Total Credits in Even Semester:
              </Label>
              <Input
                id="evenTotalCredits"
                type="number"
                placeholder="Enter even semester total credits"
                value={evenTotalCredits}
                onChange={(e) => setEvenTotalCredits(e.target.value)}
                className="text-sm md:text-base h-10 md:h-11"
              />
            </div>

            <div className="space-y-1.5 md:space-y-2">
              <Label htmlFor="numSubjects" className="text-sm md:text-base font-semibold">
                Number of Subjects:
              </Label>
              <Input
                id="numSubjects"
                type="number"
                placeholder="Enter number of subjects"
                value={numSubjects}
                onChange={(e) => setNumSubjects(e.target.value)}
                className="text-sm md:text-base h-10 md:h-11 border-2 border-foreground"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 md:gap-3 flex-col sm:flex-row">
            <Button
              onClick={handleCalculate}
              className="flex-1 h-11 md:h-12 text-sm md:text-base font-semibold"
              size="lg"
            >
              <Calculator className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Calculate
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="flex-1 h-11 md:h-12 text-sm md:text-base font-semibold"
              size="lg"
            >
              Reset
            </Button>
          </div>

          {/* Results Display */}
          {result && (
            <Card className="bg-muted/50 border-2 border-primary/30 animate-slide-up">
              <CardHeader className="p-4 md:p-6">
                <CardTitle className="text-base md:text-xl">Calculation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 md:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-background rounded-lg border">
                    <p className="text-xs md:text-sm text-muted-foreground">YGPA</p>
                    <p className="text-2xl md:text-3xl font-bold text-primary">{result.ygpa}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-background rounded-lg border">
                    <p className="text-xs md:text-sm text-muted-foreground">Percentage</p>
                    <p className="text-2xl md:text-3xl font-bold text-primary">{result.percentage}%</p>
                  </div>
                  <div className="p-3 md:p-4 bg-background rounded-lg border">
                    <p className="text-xs md:text-sm text-muted-foreground">Total Credit Points</p>
                    <p className="text-xl md:text-2xl font-bold">{result.totalPoints}</p>
                  </div>
                  <div className="p-3 md:p-4 bg-background rounded-lg border">
                    <p className="text-xs md:text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-xl md:text-2xl font-bold">{result.totalCredits}</p>
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
