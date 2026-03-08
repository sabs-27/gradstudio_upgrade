const https = require('https');
https.get('https://learning-platform-api-dev.sabareeshrao.workers.dev/api/carousels', r => {
    let d = '';
    r.on('data', c => d += c);
    r.on('end', () => {
        try {
            const data = JSON.parse(d);
            let img = null;
            for (let c of data) {
                if (c.cards) {
                    for (let card of c.cards) {
                        if (card.image_url) {
                            img = card.image_url;
                            break;
                        }
                    }
                }
                if (img) break;
            }

            if (!img) {
                console.log("No images found in API response");
                return;
            }

            console.log('Testing image URL:', img);
            https.get('https://learning-platform-api-dev.sabareeshrao.workers.dev' + img, res => {
                console.log('Final Status Code:', res.statusCode);
            });
        } catch (e) {
            console.error(e);
        }
    });
});
