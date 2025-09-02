import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Calendar, Share2, Download, Settings, ExternalLink } from "lucide-react";
import type { AppConfig } from "@shared/schema";

interface MiniAppDisplayProps {
  appId: string;
  appName: string;
  appType: string;
  config: AppConfig;
  data?: any[];
  className?: string;
}

// Mock data generator for demo purposes
const generateMockData = (metric: string, points: number = 30) => {
  const data = [];
  const now = new Date();
  
  for (let i = points - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    let value;
    switch (metric.toLowerCase()) {
      case 'heartrate':
        value = Math.floor(Math.random() * 40) + 60; // 60-100 bpm
        break;
      case 'steps':
        value = Math.floor(Math.random() * 5000) + 3000; // 3000-8000 steps
        break;
      case 'weight':
      case 'bodyweight':
        value = Math.random() * 10 + 70; // 70-80 kg
        break;
      case 'bloodpressuresystolic':
        value = Math.floor(Math.random() * 30) + 110; // 110-140 mmHg
        break;
      default:
        value = Math.random() * 100;
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      [metric]: value,
      value
    });
  }
  
  return data;
};

export function MiniAppDisplay({ appId, appName, appType, config, data, className }: MiniAppDisplayProps) {
  const renderChart = (chart: any, index: number) => {
    const chartData = data || generateMockData(chart.metric);
    const chartHeight = config.layout === 'single' ? 400 : 200;

    switch (chart.type) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey={chart.metric} 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey={chart.metric} 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData.slice(-7)}> {/* Last 7 days for bars */}
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={chart.metric} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      default:
        return (
          <div className="h-48 flex items-center justify-center text-muted-foreground">
            Chart type not supported
          </div>
        );
    }
  };

  const renderDashboard = () => {
    if (config.layout === 'tabs') {
      return (
        <div className="space-y-4">
          {config.charts.map((chart, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {chart.title || chart.metric}
                  </CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {chart.timeRange || '30d'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderChart(chart, index)}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (config.layout === 'single') {
      return (
        <div className="space-y-6">
          {config.charts.map((chart, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-xl">
                  {chart.title || chart.metric}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderChart(chart, index)}
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    // Grid layout (default)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.charts.map((chart, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {chart.title || chart.metric}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderChart(chart, index)}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">{appName}</h1>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">{appType}</Badge>
          <Badge variant="outline">{config.theme}</Badge>
          <Badge variant="outline">{config.layout}</Badge>
        </div>
      </div>
      <div className="flex gap-2">
        {config.features?.includes('share') && (
          <Button size="sm" variant="outline" data-testid="button-share-app">
            <Share2 className="w-4 h-4 mr-1" />
            Share
          </Button>
        )}
        {config.features?.includes('export') && (
          <Button size="sm" variant="outline" data-testid="button-export-app">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        )}
        <Button size="sm" variant="outline" data-testid="button-app-settings">
          <Settings className="w-4 h-4 mr-1" />
          Settings
        </Button>
        <Button size="sm" data-testid="button-open-full-app">
          <ExternalLink className="w-4 h-4 mr-1" />
          Open Full App
        </Button>
      </div>
    </div>
  );

  const renderFeatures = () => {
    if (!config.features || config.features.length === 0) return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Features:</span>
            <div className="flex flex-wrap gap-2">
              {config.features.map((feature) => (
                <Badge key={feature} variant="outline" className="text-xs">
                  {feature}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInsights = () => {
    if (!config.features?.includes('insights')) return null;

    const insights = [
      "Your heart rate has been trending upward over the past week",
      "You've exceeded your daily step goal 5 out of 7 days",
      "Consider scheduling more rest days based on your activity patterns"
    ];

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">AI Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`${config.theme === 'dark' ? 'dark' : ''} ${className}`}>
      <div className="p-6 min-h-screen bg-background">
        {renderHeader()}
        {renderFeatures()}
        {renderInsights()}
        {renderDashboard()}
        
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Mini-app generated from your personal health data</p>
          <p className="flex items-center justify-center gap-1 mt-1">
            <Calendar className="w-3 h-3" />
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}