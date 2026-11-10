const chatCompatRoutes = require('../src/routes/chatCompatRoutes');
const chatController = require('../src/controllers/chatController');

// The web ChatWindow payment-complete flow posts to
// /api/chats/:conversationId/messages — this guards the compatibility mount.
describe('Chat compatibility routes', () => {
    it('exposes POST /:conversationId/messages', () => {
        const layer = chatCompatRoutes.stack.find(
            (candidate) =>
                candidate.route &&
                candidate.route.path === '/:conversationId/messages' &&
                candidate.route.methods &&
                candidate.route.methods.post
        );

        expect(layer).toBeTruthy();
    });

    it('wires the endpoint to sendMessageInConversation after auth and validation', () => {
        const route = chatCompatRoutes.stack.find(
            (candidate) => candidate.route?.path === '/:conversationId/messages'
        ).route;

        expect(route.stack.length).toBe(3);
        expect(route.stack[route.stack.length - 1].handle).toBe(
            chatController.sendMessageInConversation
        );
    });

    it('exposes sendMessageInConversation on the chat controller', () => {
        expect(typeof chatController.sendMessageInConversation).toBe('function');
    });
});
