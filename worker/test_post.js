const https = require('https');

const data = JSON.stringify({
    id: 'test_subcourse_123',
    title: 'Test Subcourse',
    category: 'azure',
    parent_course_id: 'azure',
    type: 'subcategory',
    icon_class: 'fas fa-book',
    display_order: 1
});

const options = {
    hostname: 'learning-platform-api-dev.sabareeshrao.workers.dev',
    path: '/api/admin/courses',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
        'Authorization': 'Bearer test' // Since we enforce admin, it might reject with "invalid token", but we expect 201 or 403, NOT 500
    }
};

const req = https.request(options, (res) => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => console.log('Response:', res.statusCode, d));
});

req.on('error', e => console.error(e));
req.write(data);
req.end();
