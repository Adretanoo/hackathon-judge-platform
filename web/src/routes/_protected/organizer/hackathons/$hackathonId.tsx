import { createFileRoute } from '@tanstack/react-router';
import { OrganizerAdminPanel } from '@/features/hackathons/components/OrganizerAdminPanel';

export const Route = createFileRoute('/_protected/organizer/hackathons/$hackathonId')({
  component: HackathonDetailPage,
});

function HackathonDetailPage() {
  const { hackathonId } = Route.useParams();
  return <OrganizerAdminPanel hackathonId={hackathonId} />;
}

