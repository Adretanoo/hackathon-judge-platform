import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { hackathonApi, HackathonStatus } from '@/shared/api/hackathon.service';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/shared/ui';
import { Plus, Calendar, Trophy, Globe, MapPin, Eye } from 'lucide-react';

export const Route = createFileRoute('/_protected/organizer/hackathons/')({
  component: HackathonsListPage,
});

function HackathonsListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['hackathons', 'my'],
    queryFn: () => hackathonApi.listMine(),
  });

  const getStatusBadge = (status: HackathonStatus) => {
    switch (status) {
      case HackathonStatus.DRAFT:
        return <Badge variant="secondary">Draft</Badge>;
      case HackathonStatus.REGISTRATION_OPEN:
        return <Badge variant="success">Registration Open</Badge>;
      case HackathonStatus.IN_PROGRESS:
        return <Badge variant="default">In Progress</Badge>;
      case HackathonStatus.JUDGING:
        return <Badge variant="warning">Judging</Badge>;
      case HackathonStatus.COMPLETED:
        return <Badge variant="outline" className="bg-muted">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Hackathons</h1>
          <p className="text-muted-foreground">Create, edit and manage your hackathon competitions.</p>
        </div>
        <Button asChild>
          <Link to="/organizer/hackathons/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Hackathon
          </Link>
        </Button>
      </div>

      <Card className="border-primary/5 shadow-xl">
        <CardHeader>
          <CardTitle>All Hackathons</CardTitle>
          <CardDescription>A list of all competitions you are organizing.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-48 flex items-center justify-center italic text-muted-foreground">
              Loading competitions...
            </div>
          ) : !data?.items?.length ? (
            <div className="h-48 flex flex-col items-center justify-center gap-4 border border-dashed rounded-xl">
              <Trophy className="h-12 w-12 text-muted-foreground opacity-20" />
              <p className="text-muted-foreground">No hackathons found.</p>
              <Button variant="outline" asChild>
                <Link to="/organizer/hackathons/create">Get Started</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Hackathon</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Mode/Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell>
                      <div className="font-semibold">{h.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">{h.subtitle}</div>
                    </TableCell>
                    <TableCell>{getStatusBadge(h.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {new Date(h.startDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        {h.isOnline ? (
                          <><Globe className="h-3 w-3" /> Online</>
                        ) : (
                          <><MapPin className="h-3 w-3" /> {h.location}</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link 
                          to="/organizer/hackathons/$hackathonId" 
                          params={{ hackathonId: h.id } as any}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Manage
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
