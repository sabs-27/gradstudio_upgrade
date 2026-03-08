
const url = "https://learning-platform-api.sabareeshrao.workers.dev/api/health";
fetch(url)
    .then(res => {
        console.log("Status:", res.status);
        return res.text();
    })
    .then(text => console.log("Body:", text))
    .catch(err => console.error("Error:", err));
