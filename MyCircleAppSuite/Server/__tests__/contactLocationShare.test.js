const ContactRequest = require('../src/models/ContactRequest');

describe('ContactRequest locationShare schema', () => {
  it('has locationShare fields', () => {
    expect(ContactRequest.schema.path('locationShare.status')).toBeDefined();
    expect(ContactRequest.schema.path('locationShare.status').enumValues).toContain('none');
    expect(ContactRequest.schema.path('locationShare.status').enumValues).toContain('granted');
    expect(ContactRequest.schema.path('locationShare.status').enumValues).toContain('revoked');
    expect(ContactRequest.schema.path('locationShare.grantedBy')).toBeDefined();
    expect(ContactRequest.schema.path('locationShare.grantedAt')).toBeDefined();
    expect(ContactRequest.schema.path('locationShare.expiresAt')).toBeDefined();
    expect(ContactRequest.schema.path('locationShare.revokedAt')).toBeDefined();
    expect(ContactRequest.schema.path('locationShare.sharedLocation.lat')).toBeDefined();
    expect(ContactRequest.schema.path('locationShare.sharedLocation.lng')).toBeDefined();
    expect(ContactRequest.schema.path('locationShare.sharedLocation.note')).toBeDefined();
  });
});
