const fs = require('fs');
const https = require('https');

const dotenvStr = fs.readFileSync('.env.local', 'utf-8');
const match = dotenvStr.match(/GROQ_API_KEY=(.*)/);
const apiKey = match[1].trim();

const options = {
    hostname: 'api.groq.com',
    port: 443,
    path: '/openai/v1/models',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer ' + apiKey
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => {
        data += chunk;
    });
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            if (parsed.data) {
                fs.writeFileSync('groq_out.json', JSON.stringify(parsed.data.map(m => m.id), null, 2));
            } else {
                fs.writeFileSync('groq_out.json', data);
            }
        } catch (e) {
            fs.writeFileSync('groq_out.json', data);
        }
    });
});

req.on('error', error => {
    fs.writeFileSync('groq_out.json', String(error));
});

req.end();
