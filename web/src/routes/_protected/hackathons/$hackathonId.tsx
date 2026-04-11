import { createFileRoute } from '@tanstack/react-router';
import { ParticipantWorkspace } from '@/features/participant/components/ParticipantWorkspace';

export const Route = createFileRoute('/_protected/hackathons/$hackathonId' as any)({
  component: ParticipantWorkspacePage,
});

function ParticipantWorkspacePage() {
  const { hackathonId } = Route.useParams() as any;
  return <ParticipantWorkspace hackathonId={hackathonId} />;
}
