const https = require('https');

https.get('https://learning-platform-api-dev.sabareeshrao.workers.dev/api/carousels', (resp) => {
    let data = '';

    resp.on('data', (chunk) => {
        data += chunk;
    });

    resp.on('end', () => {
        const carousels = JSON.parse(data);
        carousels.forEach(c => {
            console.log(`Carousel ${c.id}: ${c.name}`);
            c.cards.forEach(card => {
                console.log(`  - Card ${card.id}: ${card.image_url}`);
            });
        });
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
