const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config({ path: '.env.local' });

async function check() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No API key found in .env.local');
        return;
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await res.json();
    if (data.models) {
        data.models.forEach(m => {
            console.log(m.name, m.supportedGenerationMethods);
        });
    } else {
        console.error(data);
    }
}

check();
