import { json } from '@sveltejs/kit';
import fs from 'fs';

const memoriesPath = 'memories.json';
const memoriesReviewPath = 'memories-to-review.json';

export async function POST({ request, cookies }) {
    const body = await request.json() as { authKey: string, type: string, URL: string };

    if (cookies.get("auth") !== import.meta.env.VITE_ADMIN_TOKEN) {
        return json({ error: 'Unauthorized' }, { status: 401 });
    }

    let memoriesToReview: any[] = [];
    if (fs.existsSync(memoriesReviewPath)) {
        const data = fs.readFileSync(memoriesReviewPath, 'utf-8');
        memoriesToReview = JSON.parse(data);
    }

    let memories: any[] = [];
    if (fs.existsSync(memoriesPath)) {
        const data = fs.readFileSync(memoriesPath, 'utf-8');
        memories = JSON.parse(data);
    } else {
        fs.writeFileSync(memoriesPath, JSON.stringify(memories));
    }

    const memory = memoriesToReview.find(m => m.URL == body.URL);
    console.log(body.type, body.URL, memoriesToReview)
    if (memory) {
        if (body.type == 'approve') {
            memories.push(memory);
            memoriesToReview = memoriesToReview.filter(m => m.URL != body.URL);
            fs.writeFileSync(memoriesPath, JSON.stringify(memories));
        } else if (body.type == 'reject') {
            console.log("rejecting", body.URL)
            console.log("before", memoriesToReview);
            memoriesToReview = memoriesToReview.filter(m => m.URL != body.URL);
            console.log("after ", memoriesToReview);
        }
    }

    fs.writeFileSync(memoriesReviewPath, JSON.stringify(memoriesToReview));

    return json({ success: true });
}