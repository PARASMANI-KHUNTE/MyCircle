const fs = require('fs');
const path = require('path');

const compose = fs.readFileSync(path.join(__dirname, '..', 'docker-compose.yml'), 'utf8');

const environmentLinesFor = (service) => {
    const lines = compose.split(/\r?\n/);
    const start = lines.findIndex((line) => line === `  ${service}:`);
    if (start === -1) throw new Error(`Service "${service}" not found in docker-compose.yml`);

    const end = lines.findIndex((line, index) => index > start && /^  \S/.test(line));
    const block = lines.slice(start, end === -1 ? undefined : end);
    const envStart = block.findIndex((line) => line.trim() === 'environment:');
    if (envStart === -1) throw new Error(`Service "${service}" has no environment block`);

    const env = [];
    for (const line of block.slice(envStart + 1)) {
        if (!line.startsWith('      - ')) break;
        env.push(line.slice('      - '.length));
    }
    return env;
};

const FIREBASE_VARIABLES = [
    'FIREBASE_PROJECT_ID',
    'FIREBASE_CLIENT_EMAIL',
    'FIREBASE_PRIVATE_KEY',
];

describe.each(['server', 'worker'])('%s Firebase configuration', (service) => {
    const environment = environmentLinesFor(service);

    it.each(FIREBASE_VARIABLES)('passes %s through from the host environment', (variable) => {
        expect(environment).toContain(`${variable}=\${${variable}}`);
    });
});
