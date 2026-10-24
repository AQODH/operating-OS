import { requireChatGPTUser } from './chatgpt-auth';
import Workspace from './tier-one-workspace';
export const dynamic = 'force-dynamic';
export default async function Page() { const user = await requireChatGPTUser('/'); return <Workspace displayName={user.displayName}/>; }

