import { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Award, Download, Lock, Unlock, FileText, Database, BookOpen, Trophy } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Reward {
  id: string;
  title: string;
  description: string;
  type: 'template' | 'dataset' | 'lab' | 'badge';
  pointCost: number;
  icon: React.ReactNode;
  downloadUrl?: string;
}

const AVAILABLE_REWARDS: Reward[] = [
  {
    id: 'fhir-template-bundle',
    title: 'FHIR Bundle Template Collection',
    description: 'Pre-built FHIR bundle templates for common healthcare scenarios including patient admissions, lab results, and medication orders.',
    type: 'template',
    pointCost: 50,
    icon: <FileText className="h-6 w-6" />,
    downloadUrl: '/assets/fhir-bundle-templates.zip'
  },
  {
    id: 'synthetic-patient-dataset',
    title: 'Premium Synthetic Patient Dataset',
    description: 'Advanced synthetic patient dataset with 1000+ patients including complex medical histories, rare conditions, and longitudinal care records.',
    type: 'dataset', 
    pointCost: 75,
    icon: <Database className="h-6 w-6" />,
    downloadUrl: '/assets/premium-patient-dataset.zip'
  },
  {
    id: 'advanced-analytics-lab',
    title: 'Advanced FHIR Analytics Lab',
    description: 'Bonus lab covering advanced FHIR analytics including population health metrics, predictive modeling, and outcome analysis.',
    type: 'lab',
    pointCost: 100,
    icon: <BookOpen className="h-6 w-6" />,
    downloadUrl: '/assets/advanced-analytics-lab.pdf'
  },
  {
    id: 'hl7-integration-guide',
    title: 'HL7 v2 to FHIR Migration Guide',
    description: 'Comprehensive guide with tools and templates for migrating from HL7 v2 systems to modern FHIR-based architectures.',
    type: 'template',
    pointCost: 60,
    icon: <FileText className="h-6 w-6" />,
    downloadUrl: '/assets/hl7-migration-guide.zip'
  },
  {
    id: 'interoperability-specialist',
    title: 'Interoperability Specialist Badge',
    description: 'Digital badge recognizing mastery of healthcare interoperability concepts and FHIR implementation best practices.',
    type: 'badge',
    pointCost: 150,
    icon: <Trophy className="h-6 w-6" />
  },
  {
    id: 'real-world-dataset',
    title: 'Anonymized Real-World Dataset',
    description: 'Carefully anonymized real-world healthcare dataset for advanced research and analysis projects.',
    type: 'dataset',
    pointCost: 120,
    icon: <Database className="h-6 w-6" />,
    downloadUrl: '/assets/real-world-dataset.zip'
  }
];

export default function Rewards() {
  const { user, profile } = useSessionStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [redeemedRewards, setRedeemedRewards] = useState<string[]>([]);

  const redeemMutation = useMutation({
    mutationFn: async (rewardCode: string) => {
      return await apiRequest('POST', '/api/points/redeem', { rewardCode });
    },
    onSuccess: (data, rewardCode) => {
      setRedeemedRewards(prev => [...prev, rewardCode]);
      toast({
        title: "Reward Redeemed!",
        description: `You've successfully redeemed this reward for ${data.pointsDeducted} points.`,
        variant: "default",
      });
      
      // Refresh user profile to update points
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem reward. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>
              Please sign in to view and redeem rewards with your FHIR points.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleRedeem = (reward: Reward) => {
    if (profile.fhir_points < reward.pointCost) {
      toast({
        title: "Insufficient Points",
        description: `You need ${reward.pointCost} points to redeem this reward. You currently have ${profile.fhir_points} points.`,
        variant: "destructive",
      });
      return;
    }

    redeemMutation.mutate(reward.id);
  };

  const canAfford = (pointCost: number) => profile.fhir_points >= pointCost;
  const isRedeemed = (rewardId: string) => redeemedRewards.includes(rewardId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Trophy className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-4xl font-bold text-foreground">Rewards Store</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-4">
            Redeem your FHIR points for valuable resources and exclusive content
          </p>
          <div className="flex items-center justify-center">
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Award className="h-4 w-4 mr-2" />
              {profile.fhir_points} Points Available
            </Badge>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AVAILABLE_REWARDS.map((reward) => {
            const affordable = canAfford(reward.pointCost);
            const redeemed = isRedeemed(reward.id);

            return (
              <Card key={reward.id} className={`transition-all duration-200 ${
                affordable && !redeemed 
                  ? 'border-primary/50 shadow-md hover:shadow-lg' 
                  : 'border-muted'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        affordable && !redeemed 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {reward.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{reward.title}</CardTitle>
                        <Badge variant={
                          reward.type === 'badge' ? 'secondary' :
                          reward.type === 'dataset' ? 'outline' : 'default'
                        } className="mt-1">
                          {reward.type.charAt(0).toUpperCase() + reward.type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm font-medium">
                        <Award className="h-3 w-3 mr-1" />
                        {reward.pointCost} pts
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 min-h-[3rem]">
                    {reward.description}
                  </CardDescription>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {redeemed ? (
                        <Badge variant="secondary" className="text-green-600 bg-green-50">
                          <Download className="h-3 w-3 mr-1" />
                          Redeemed
                        </Badge>
                      ) : affordable ? (
                        <Badge variant="outline" className="text-green-600">
                          <Unlock className="h-3 w-3 mr-1" />
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          <Lock className="h-3 w-3 mr-1" />
                          Locked
                        </Badge>
                      )}
                    </div>
                    
                    <Button 
                      onClick={() => handleRedeem(reward)}
                      disabled={!affordable || redeemed || redeemMutation.isPending}
                      variant={redeemed ? "secondary" : affordable ? "default" : "secondary"}
                      size="sm"
                      data-testid={`button-redeem-${reward.id}`}
                    >
                      {redeemMutation.isPending ? "Redeeming..." :
                       redeemed ? "Redeemed" :
                       affordable ? "Redeem" : 
                       `Need ${reward.pointCost - profile.fhir_points} more pts`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Points Earning Guide */}
        <Card className="mt-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              How to Earn More Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Pass Quiz</h3>
                <p className="text-sm text-muted-foreground">+25 points each</p>
                <p className="text-xs text-muted-foreground mt-1">First attempt only</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">BYOD Badge</h3>
                <p className="text-sm text-muted-foreground">+50 points</p>
                <p className="text-xs text-muted-foreground mt-1">Complete BYOD exercise</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Publish Observation</h3>
                <p className="text-sm text-muted-foreground">+10 points each</p>
                <p className="text-xs text-muted-foreground mt-1">Create FHIR observations</p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold">Special Events</h3>
                <p className="text-sm text-muted-foreground">Variable points</p>
                <p className="text-xs text-muted-foreground mt-1">Bootcamp challenges</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}