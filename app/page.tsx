import {requireChatGPTUser} from './chatgpt-auth';
import {env} from 'cloudflare:workers';
import {getPlatformRole} from '../lib/platform-roles.mjs';
import Workspace from './tier-one-workspace';
import PlatformWorkspace from './platform-workspace';

export const dynamic = 'force-dynamic';
export default async function Page() {
  const user = await requireChatGPTUser('/');
  const platformRole = env.DB ? await getPlatformRole(env.DB, user) : null;
  return platformRole === 'platform_admin'
    ? <PlatformWorkspace displayName={user.displayName}/>
    : <Workspace displayName={user.displayName}/>;
}
