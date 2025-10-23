import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const mockReports = [
    { id: 'REP-001', name: 'Q2 Financial Summary', status: 'Published', date: '2023-06-30' },
    { id: 'REP-002', name: 'Monthly Marketing Performance', status: 'Draft', date: '2023-07-01' },
    { id: 'REP-003', name: 'Sales Pipeline Analysis', status: 'Published', date: '2023-06-28' },
    { id: 'REP-004', name: 'Customer Feedback Report', status: 'In Review', date: '2023-07-02' },
    { id: 'REP-005', name: 'Annual Growth Projection', status: 'Published', date: '2023-06-25' },
    { id: 'REP-006', name: 'IT Department Quarterly Review', status: 'Draft', date: '2023-07-03' },
    { id: 'REP-007', name: 'Social Media Engagement - June', status: 'Published', date: '2023-07-01' },
];

export default function ReportsPage() {
  return (
    <>
      <PageHeader
        title="Reports"
        description="Manage and generate your reports."
      >
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Generate Report
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.name}</TableCell>
                  <TableCell>
                  <Badge variant={
                        report.status === 'Published' ? 'default' :
                        report.status === 'Draft' ? 'secondary' : 'outline'
                    } className={report.status === 'Published' ? 'bg-accent text-accent-foreground' : ''}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem>View</DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem>Duplicate</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
