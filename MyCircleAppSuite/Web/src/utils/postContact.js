// Contact numbers are returned at the top level of GET /posts/:id for
// authorized viewers. The user populate deliberately omits them.
const contactPhone = (post) => post?.contactPhone || post?.user?.contactPhone || null;
const contactWhatsapp = (post) => post?.contactWhatsapp || post?.user?.contactWhatsapp || null;

export const getCallNumber = (post) => contactPhone(post) || contactWhatsapp(post);
export const getTextNumber = (post) => contactWhatsapp(post) || contactPhone(post);
