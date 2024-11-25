import { json } from '@sveltejs/kit';
import fs from 'fs';
import { env } from '$env/dynamic/private';

const memoriesPath = 'memories.json';
const memoriesReviewPath = 'memories-to-review.json';

export async function GET({ cookies, url }) {

    if (url.searchParams.get('review') != null) {
        if (cookies.get("auth") != env.VITE_ADMIN_TOKEN) { return json({ error: 'Unauthorized' }, { status: 401 }); }

        let memoriesToReview: any[] = [];
        if (fs.existsSync(memoriesReviewPath)) {
            const data = fs.readFileSync(memoriesReviewPath, 'utf-8');
            memoriesToReview = JSON.parse(data);
        } else {
            fs.writeFileSync(memoriesPath, JSON.stringify(memoriesToReview));
        }
        return json(memoriesToReview)
    }

    let memories: any[] = [];
    if (fs.existsSync(memoriesPath)) {
        const data = fs.readFileSync(memoriesPath, 'utf-8');
        memories = JSON.parse(data);
    } else {
        fs.writeFileSync(memoriesPath, JSON.stringify(memories));
    }
    return json(memories);
}

export async function POST({ request }) {
    const body = await request.json();

    if (body.authKey !== env.VITE_AUTH_TOKEN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    delete body.authKey;

    let memories: any[] = [];
    if (fs.existsSync(memoriesReviewPath)) {
        const data = fs.readFileSync(memoriesReviewPath, 'utf-8');
        memories = JSON.parse(data);
    } else {
        fs.writeFileSync(memoriesReviewPath, JSON.stringify(memories));
    }

    memories.push(body);
    fs.writeFileSync(memoriesReviewPath, JSON.stringify(memories));

    return json({ success: true });
}