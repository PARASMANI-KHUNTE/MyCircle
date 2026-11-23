export interface CompletionResponse {
    request?: { _id: string } & Record<string, unknown>;
    deletedRequestIds?: Array<string | { toString(): string }>;
    completedRequestId?: string;
    removed?: boolean;
    [key: string]: unknown;
}

export interface CompletionLists {
    receivedRequests: any[];
    sentRequests: any[];
}

/**
 * Applies a mark-complete response without discarding the completed request.
 * Only ids explicitly reported as deleted by the server are removed.
 */
export function applyCompletionResult(
    receivedRequests: any[],
    sentRequests: any[],
    data?: CompletionResponse | null
): CompletionLists {
    if (!data) {
        return { receivedRequests, sentRequests };
    }

    const deletedIds = new Set(
        Array.isArray(data.deletedRequestIds)
            ? data.deletedRequestIds.map((id) => String(id))
            : []
    );
    const completed = data.request?._id ? data.request : null;

    const apply = (requests: any[]) => requests
        .filter((request) => !deletedIds.has(String(request._id)))
        .map((request) => (
            completed && String(request._id) === String(completed._id)
                ? { ...request, ...completed }
                : request
        ));

    return {
        receivedRequests: apply(receivedRequests),
        sentRequests: apply(sentRequests),
    };
}
