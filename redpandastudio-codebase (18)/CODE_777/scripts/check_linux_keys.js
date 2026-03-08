
import https from 'https';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const API_URL = 'https://api.gradstudio.org/debug/r2';

https.get(API_URL, (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        try {
            const json = JSON.parse(data);
            const linuxKeys = json.keys.filter(k => k.toLowerCase().includes('linux'));
            console.log('Total Linux keys:', linuxKeys.length);
            console.log('First 20 Linux keys:');
            console.log(JSON.stringify(linuxKeys.slice(0, 20), null, 2));

            // Check structure of first few
            linuxKeys.slice(0, 5).forEach(k => {
                const parts = k.split('/');
                console.log(`Key: ${k} -> Parts: ${parts.length}, Course: ${parts[1]}, Slug: ${parts[2]}`);
            });

        } catch (e) {
            console.error('Error parsing JSON:', e.message);
        }
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
