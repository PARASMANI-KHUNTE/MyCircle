const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
// We need a token. Let's assume the user can provide one or we can find it?
// Actually, I can't easily get a token without user interaction.

async function test() {
    try {
        console.log('Sending test request to /api/test...');
        const res = await axios.get(`${API_URL}/test`);
        console.log('Response:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

test();
