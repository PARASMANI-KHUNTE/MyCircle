const Post = require('../src/models/Post');

describe('Post model creation fields', () => {
    it('persists the category details selected during post creation', () => {
        expect(Post.schema.path('subType')).toBeDefined();
        expect(Post.schema.path('jobType')).toBeDefined();
        expect(Post.schema.path('itemCategory')).toBeDefined();
        expect(Post.schema.path('locationSource')).toBeDefined();
    });
});
