const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { checkContentSafety } = require('./src/config/gemini');

async function testGemini() {
    try {
        console.log('Testing Gemini Safety Check...');
        const result = await checkContentSafety('This is a test post for selling a bicycle.');
        console.log('Gemini Result:', result);
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testGemini();
