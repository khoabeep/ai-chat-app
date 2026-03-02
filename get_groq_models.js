const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envConfig = dotenv.parse(fs.readFileSync('.env.local'));
const apiKey = envConfig.GROQ_API_KEY;

if (!apiKey) {
    console.error('No API key found!');
    process.exit(1);
}

fetch('https://api.groq.com/openai/v1/models', {
    headers: {
        'Authorization': 'Bearer ' + apiKey
    }
})
    .then(res => res.json())
    .then(data => {
        if (data.data) {
            const models = data.data.map(m => m.id);
            fs.writeFileSync('groq_active_models.json', JSON.stringify(models, null, 2));
            console.log('Saved models successfully.');
        } else {
            console.error('Error fetching models:', data);
        }
    })
    .catch(console.error);
