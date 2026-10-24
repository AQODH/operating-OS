import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {readPlatform, mutatePlatform} from '../../../lib/platform-admin.mjs';

function privateJSON(data: unknown, status = 200) {
  return Response.json(data, {status, headers: {'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'}});
}

export async function GET() {
  try {
    const user = await getChatGPTUser();
    if (!env.DB) throw Error('Database unavailable.');
    return privateJSON(await readPlatform(env.DB, user));
  } catch (error) {
    return privateJSON({error: (error as Error).message}, 403);
  }
}

export async function POST(request: Request) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin) throw Error('Invalid request origin.');
    const user = await getChatGPTUser();
    if (!env.DB) throw Error('Database unavailable.');
    return privateJSON(await mutatePlatform(env.DB, user, await request.json()));
  } catch (error) {
    return privateJSON({error: (error as Error).message}, 403);
  }
}
