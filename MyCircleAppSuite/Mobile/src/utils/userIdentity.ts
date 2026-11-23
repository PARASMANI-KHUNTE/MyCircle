export const getCurrentUserId = (
    user: { _id?: unknown; id?: unknown } | null | undefined
): string | null => {
    const id = user?._id ?? user?.id;
    return id === null || id === undefined ? null : String(id);
};
