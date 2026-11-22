const fs = require('fs');
const path = require('path');

const docsRoot = path.resolve(__dirname, '..', '..', '..', 'docs');
const readme = fs.readFileSync(path.join(docsRoot, 'README.md'), 'utf8');

const listMarkdownDocuments = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownDocuments(fullPath);
    if (!entry.name.endsWith('.md') || entry.name === 'README.md') return [];
    return [path.relative(docsRoot, fullPath).replace(/\\/g, '/')];
});

describe('documentation index', () => {
    it('links every markdown document from docs/README.md', () => {
        const unlisted = listMarkdownDocuments(docsRoot).filter((file) => !readme.includes(file));
        expect(unlisted).toEqual([]);
    });
});
