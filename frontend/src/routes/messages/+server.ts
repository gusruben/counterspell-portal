import { json } from '@sveltejs/kit';

export async function GET() {
    const res = await fetch(`http://${import.meta.env.VITE_HOST_API_SERVER}:${import.meta.env.VITE_HOST_API_PORT}/messages`);
    return json(await res.json())
}