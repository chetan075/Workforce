// Server wrapper page: force dynamic rendering and render the client component
export const dynamic = 'force-dynamic';

import ProjectMessagingClient from './ProjectMessagingClient';

export default function Page() {
  return <ProjectMessagingClient />;
}