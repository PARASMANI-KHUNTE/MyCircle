describe('Firebase Configuration & Resilience', () => {
    it('should export admin and db without crashing', () => {
        const { admin, db } = require('../src/config/firebase');
        expect(admin).toBeDefined();
        expect(typeof admin.firestore).toBe('function');
        expect(admin.firestore.Timestamp).toBeDefined();
        expect(admin.firestore.FieldValue).toBeDefined();
    });

    it('should provide working Timestamp and FieldValue fallback helpers', () => {
        const { admin } = require('../src/config/firebase');
        const now = new Date();
        const ts = admin.firestore.Timestamp.fromDate(now);
        expect(ts).toBeDefined();
        expect(ts.toDate()).toEqual(now);

        const serverTs = admin.firestore.FieldValue.serverTimestamp();
        expect(serverTs).toBeDefined();
    });
});
