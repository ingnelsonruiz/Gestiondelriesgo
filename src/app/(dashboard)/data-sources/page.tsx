import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, DatabaseZap, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const mockDataSources = [
  { name: 'Google Analytics', type: 'Marketing', status: 'Connected', lastSync: '2 minutes ago' },
  { name: 'Salesforce CRM', type: 'Sales', status: 'Connected', lastSync: '1 hour ago' },
  { name: 'Stripe', type: 'Finance', status: 'Connected', lastSync: '30 minutes ago' },
  { name: 'Zendesk', type: 'Support', status: 'Error', lastSync: '1 day ago' },
  { name: 'HubSpot', type: 'Marketing', status: 'Disconnected', lastSync: 'N/A' },
];

export default function DataSourcesPage() {
  return (
    <>
      <PageHeader
        title="Data Sources"
        description="Connect and manage your data sources for reporting."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Data Source
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="pt-6">
          <ul className="space-y-4">
            {mockDataSources.map((source, index) => (
              <li key={index} className="flex items-center justify-between p-4 border rounded-lg shadow-sm">
                <div className="flex items-center gap-4">
                  <DatabaseZap className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <h3 className="font-semibold">{source.name}</h3>
                    <p className="text-sm text-muted-foreground">{source.type} &middot; Last sync: {source.lastSync}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant={
                      source.status === 'Connected' ? 'default' :
                      source.status === 'Error' ? 'destructive' : 'secondary'
                  } className={source.status === 'Connected' ? 'bg-accent text-accent-foreground' : ''}>
                    {source.status}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem>Refresh</DropdownMenuItem>
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Disconnect</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}
