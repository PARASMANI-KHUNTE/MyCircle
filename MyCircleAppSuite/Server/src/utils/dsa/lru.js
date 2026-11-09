/**
 * High-performance O(1) LRU (Least Recently Used) Cache using a Doubly Linked List + HashMap.
 * Prevents memory leaks by maintaining a bounded working set.
 */
class DLinkedNode {
    constructor(key, value) {
        this.key = key;
        this.value = value;
        this.prev = null;
        this.next = null;
    }
}

class LRUCache {
    constructor(capacity = 500) {
        this.capacity = capacity;
        this.cache = new Map();
        this.head = new DLinkedNode(null, null);
        this.tail = new DLinkedNode(null, null);
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }

    _remove(node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    _addFirst(node) {
        node.next = this.head.next;
        node.prev = this.head;
        this.head.next.prev = node;
        this.head.next = node;
    }

    get(key) {
        if (!this.cache.has(key)) return null;
        const node = this.cache.get(key);
        this._remove(node);
        this._addFirst(node);
        return node.value;
    }

    put(key, value) {
        if (this.cache.has(key)) {
            const existing = this.cache.get(key);
            existing.value = value;
            this._remove(existing);
            this._addFirst(existing);
            return;
        }

        if (this.cache.size >= this.capacity) {
            const lru = this.tail.prev;
            this._remove(lru);
            this.cache.delete(lru.key);
        }

        const newNode = new DLinkedNode(key, value);
        this.cache.set(key, newNode);
        this._addFirst(newNode);
    }

    has(key) {
        return this.cache.has(key);
    }

    clear() {
        this.cache.clear();
        this.head.next = this.tail;
        this.tail.prev = this.head;
    }
}

module.exports = {
    LRUCache,
};
