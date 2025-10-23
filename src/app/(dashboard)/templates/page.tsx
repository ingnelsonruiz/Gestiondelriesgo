import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, FileText } from 'lucide-react';

const mockTemplates = [
  { name: 'Financial Summary', description: 'A comprehensive overview of financial performance.', createdBy: 'Admin' },
  { name: 'Marketing KPI', description: 'Tracks key marketing metrics and campaign results.', createdBy: 'Admin' },
  { name: 'Sales Pipeline', description: 'Visualizes the sales funnel and team performance.', createdBy: 'You' },
  { name: 'Project Status', description: 'Weekly update on project milestones and risks.', createdBy: 'Admin' },
  { name: 'Customer Service Tickets', description: 'Analyzes support ticket volume and resolution times.', createdBy: 'You' },
  { name: 'Blank Template', description: 'Start from scratch with a clean slate.', createdBy: 'System' },
];

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        description="Create and manage your report templates."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </PageHeader>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {mockTemplates.map((template, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <CardTitle className="font-headline text-lg">{template.name}</CardTitle>
                  <CardDescription>Created by {template.createdBy}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{template.description}</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                Use Template
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </>
  );
}
