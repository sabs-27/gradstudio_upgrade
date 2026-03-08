
import https from 'https';

// Ignore self-signed certs if testing locally or with split horizon
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_URL = 'https://api.gradstudio.org/api/admin/sync-content';

async function runSync() {
    let cursor = null;
    let hasMore = true;
    let totalCreated = { courses: 0, sections: 0, simulations: 0 };
    let page = 1;

    console.log('Starting Sync...');

    while (hasMore) {
        console.log(`Fetching page ${page}... (Cursor: ${cursor || 'start'})`);

        // Construct URL with cursor
        let url = API_URL;
        if (cursor) {
            url += `?cursor=${encodeURIComponent(cursor)}`;
        }

        try {
            const result = await postRequest(url);

            if (!result.success) {
                console.error('Sync failed:', result.error);
                break;
            }

            console.log(`Page ${page} report:`, result.report);

            // Update totals
            totalCreated.courses += result.report.coursesCreated;
            totalCreated.sections += result.report.sectionsCreated;
            totalCreated.simulations += result.report.simulationsCreated;

            // Check next page
            if (result.nextCursor) {
                cursor = result.nextCursor;
                page++;
            } else {
                hasMore = false;
                console.log('Sync complete! No more pages.');
            }

        } catch (e) {
            console.error('Request error:', e.message);
            break;
        }
    }

    console.log('=== SYNC SUMMARY ===');
    console.log('Courses Created:', totalCreated.courses);
    console.log('Sections Created:', totalCreated.sections);
    console.log('Simulations Created:', totalCreated.simulations);
}

function postRequest(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error('Invalid JSON response: ' + data.substring(0, 100)));
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

runSync();
