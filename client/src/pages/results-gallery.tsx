import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LabProgress, Artifact } from "@/types/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function ResultsGallery() {
  const { toast } = useToast();
  const [screenshots, setScreenshots] = useState({
    capability: null as File | null,
    transform: null as File | null,
    observation: null as File | null,
  });
  const [linkedinPost, setLinkedinPost] = useState("");

  const { data: progress = [] } = useQuery<LabProgress[]>({
    queryKey: ["/api/lab/progress"],
  });

  const { data: artifacts = [] } = useQuery<Artifact[]>({
    queryKey: ["/api/artifacts"],
  });

  const getProgressSummary = () => {
    const day1Complete = progress.filter((p: LabProgress) => p.labDay === 1 && p.completed).length;
    const day2Complete = progress.filter((p: LabProgress) => p.labDay === 2 && p.completed).length;
    const day3Complete = progress.filter((p: LabProgress) => p.labDay === 3 && p.completed).length;
    
    const totalSteps = progress.length || 9; // Default to 9 total steps
    const completedSteps = progress.filter((p: LabProgress) => p.completed).length;
    
    return { day1Complete, day2Complete, day3Complete, totalSteps, completedSteps };
  };

  const { day1Complete, day2Complete, day3Complete, totalSteps, completedSteps } = getProgressSummary();

  const generateLinkedInPost = () => {
    const percentage = Math.round((completedSteps / totalSteps) * 100);
    
    const post = `🎉 Just completed ${percentage}% of the FHIR Healthcare Bootcamp! 

🔬 What I learned:
✅ Day 1: Loaded synthetic patient data using Synthea bundles into FHIR servers
✅ Day 2: Transformed healthcare data with SQL and computed risk scores  
✅ Day 3: Published insights back to FHIR as structured Observations

💡 Key takeaways:
- FHIR CodeableConcepts enable true healthcare interoperability
- Synthea provides realistic test data for development  
- SQL transformations bridge analytics and clinical workflows

Thanks to @DarrenDevitt for the expert guidance and resources that made this learning journey possible!

#FHIR #HealthcareIT #Interoperability #HealthTech #OpenSource #Synthea

---
Repository: [Add your repo link here]
Bootcamp: Interactive FHIR Learning Platform`;

    setLinkedinPost(post);
  };

  const handleScreenshotUpload = (type: keyof typeof screenshots, file: File | null) => {
    setScreenshots(prev => ({ ...prev, [type]: file }));
    if (file) {
      toast({
        title: "Screenshot Added",
        description: `${type} screenshot uploaded successfully`,
      });
    }
  };

  const handleDownloadArtifacts = async () => {
    try {
      const response = await fetch('/api/artifacts/download/bootcamp-artifacts.zip');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fhir-bootcamp-artifacts.zip';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download artifacts",
        variant: "destructive",
      });
    }
  };

  const artifactsByType = artifacts.reduce((acc: any, artifact: any) => {
    if (!acc[artifact.artifactType]) acc[artifact.artifactType] = [];
    acc[artifact.artifactType].push(artifact);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Results Gallery</h1>
        <p className="text-lg text-muted-foreground">Showcase your FHIR bootcamp achievements and download your artifacts</p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-chart-line text-primary"></i>
            <span>Your Learning Journey</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-green-600">{day1Complete}</span>
              </div>
              <h3 className="font-semibold text-foreground">Day 1</h3>
              <p className="text-sm text-muted-foreground">Ingest & Land</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-amber-600">{day2Complete}</span>
              </div>
              <h3 className="font-semibold text-foreground">Day 2</h3>
              <p className="text-sm text-muted-foreground">Transform & Analyze</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-purple-600">{day3Complete}</span>
              </div>
              <h3 className="font-semibold text-foreground">Day 3</h3>
              <p className="text-sm text-muted-foreground">Operationalize</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <span className="text-2xl font-bold text-blue-600">{completedSteps}</span>
              </div>
              <h3 className="font-semibold text-foreground">Total Steps</h3>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>
          
          <div className="w-full bg-secondary rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-green-500 via-amber-500 to-purple-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            ></div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            {Math.round((completedSteps / totalSteps) * 100)}% Complete • {completedSteps} of {totalSteps} steps finished
          </p>
        </CardContent>
      </Card>

      {/* Screenshot Gallery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-camera text-primary"></i>
            <span>Portfolio Screenshots</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Upload screenshots of your key achievements to showcase your FHIR skills
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CapabilityStatement Screenshot */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                <i className="fas fa-server text-green-500"></i>
                <span>FHIR Server Connection</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-3">CapabilityStatement ping successful</p>
              <div className="mb-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleScreenshotUpload('capability', e.target.files?.[0] || null)}
                  data-testid="input-capability-screenshot"
                />
              </div>
              {screenshots.capability && (
                <div className="bg-green-50 border border-green-200 rounded p-2 text-sm text-green-700">
                  ✓ {screenshots.capability.name}
                </div>
              )}
            </div>

            {/* Transform Results Screenshot */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                <i className="fas fa-table text-amber-500"></i>
                <span>Transform Results</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-3">SQL transform table preview</p>
              <div className="mb-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleScreenshotUpload('transform', e.target.files?.[0] || null)}
                  data-testid="input-transform-screenshot"
                />
              </div>
              {screenshots.transform && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2 text-sm text-amber-700">
                  ✓ {screenshots.transform.name}
                </div>
              )}
            </div>

            {/* Published Observation Screenshot */}
            <div className="border border-border rounded-lg p-4">
              <h3 className="font-medium text-foreground mb-2 flex items-center space-x-2">
                <i className="fas fa-file-medical text-purple-500"></i>
                <span>Published Observation</span>
              </h3>
              <p className="text-sm text-muted-foreground mb-3">FHIR Observation on server</p>
              <div className="mb-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleScreenshotUpload('observation', e.target.files?.[0] || null)}
                  data-testid="input-observation-screenshot"
                />
              </div>
              {screenshots.observation && (
                <div className="bg-purple-50 border border-purple-200 rounded p-2 text-sm text-purple-700">
                  ✓ {screenshots.observation.name}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn Post Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fab fa-linkedin text-primary"></i>
            <span>Share Your Achievement</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Generate a LinkedIn post to showcase your FHIR bootcamp completion
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={generateLinkedInPost}
            className="w-full mb-4"
            data-testid="button-generate-linkedin"
          >
            <i className="fas fa-magic mr-2"></i>
            Generate LinkedIn Post
          </Button>
          
          {linkedinPost && (
            <div>
              <Label htmlFor="linkedin-post">LinkedIn Post Content</Label>
              <Textarea
                id="linkedin-post"
                value={linkedinPost}
                onChange={(e) => setLinkedinPost(e.target.value)}
                className="min-h-[300px] font-mono text-sm"
                data-testid="textarea-linkedin-post"
              />
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(linkedinPost);
                  toast({ title: "Copied!", description: "LinkedIn post copied to clipboard" });
                }}
                variant="outline"
                className="mt-3"
                data-testid="button-copy-linkedin"
              >
                <i className="fas fa-copy mr-2"></i>
                Copy to Clipboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Artifacts Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <i className="fas fa-download text-primary"></i>
            <span>Download Your Artifacts</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Download all your lab artifacts including CSV exports, transform results, and FHIR observations
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.entries(artifactsByType).map(([type, items]: [string, any[]]) => (
              <div key={type} className="bg-muted rounded-lg p-4">
                <h4 className="font-medium text-foreground mb-2 capitalize">
                  {type.replace('_', ' ')}
                </h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {items.length} file{items.length !== 1 ? 's' : ''}
                </p>
                <div className="text-xs text-muted-foreground">
                  {items.map((item: any, index: number) => (
                    <div key={index}>{item.fileName}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={handleDownloadArtifacts}
            className="w-full"
            size="lg"
            data-testid="button-download-artifacts"
          >
            <i className="fas fa-download mr-2"></i>
            Download All Artifacts (.zip)
          </Button>
        </CardContent>
      </Card>

      {/* Completion Certificate */}
      {completedSteps === totalSteps && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <i className="fas fa-certificate text-6xl text-green-600 mb-4"></i>
              <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Congratulations!</h2>
              <p className="text-green-700">You have successfully completed the FHIR Healthcare Bootcamp</p>
            </div>
            
            <div className="bg-white border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-bold text-green-800 text-lg mb-4">Certificate of Completion</h3>
              <p className="text-sm text-green-700 mb-2">This certifies that</p>
              <p className="font-bold text-green-800 text-lg mb-2">[Your Name]</p>
              <p className="text-sm text-green-700 mb-4">has successfully completed the</p>
              <p className="font-bold text-green-800 mb-4">FHIR Healthcare Interoperability Bootcamp</p>
              <p className="text-xs text-green-600">Completed on {new Date().toLocaleDateString()}</p>
            </div>
            
            <Button className="mt-6 bg-green-600 hover:bg-green-700" data-testid="button-download-certificate">
              <i className="fas fa-download mr-2"></i>
              Download Certificate
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
