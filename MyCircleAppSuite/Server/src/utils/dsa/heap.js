/**
 * MinHeap implementation for Top-K rankings (O(N log K) time and O(K) space)
 * instead of sorting entire collections with O(N log N) memory-heavy quicksort.
 */
class MinHeap {
    constructor(comparator = (a, b) => a - b) {
        this.heap = [];
        this.compare = comparator;
    }

    size() {
        return this.heap.length;
    }

    peek() {
        return this.heap.length > 0 ? this.heap[0] : null;
    }

    push(val) {
        this.heap.push(val);
        this._siftUp(this.heap.length - 1);
    }

    pop() {
        if (this.heap.length === 0) return null;
        const top = this.heap[0];
        const bottom = this.heap.pop();
        if (this.heap.length > 0) {
            this.heap[0] = bottom;
            this._siftDown(0);
        }
        return top;
    }

    _siftUp(index) {
        let current = index;
        while (current > 0) {
            const parent = Math.floor((current - 1) / 2);
            if (this.compare(this.heap[current], this.heap[parent]) < 0) {
                [this.heap[current], this.heap[parent]] = [this.heap[parent], this.heap[current]];
                current = parent;
            } else {
                break;
            }
        }
    }

    _siftDown(index) {
        let current = index;
        const length = this.heap.length;

        while (true) {
            const left = 2 * current + 1;
            const right = 2 * current + 2;
            let smallest = current;

            if (left < length && this.compare(this.heap[left], this.heap[smallest]) < 0) {
                smallest = left;
            }

            if (right < length && this.compare(this.heap[right], this.heap[smallest]) < 0) {
                smallest = right;
            }

            if (smallest !== current) {
                [this.heap[current], this.heap[smallest]] = [this.heap[smallest], this.heap[current]];
                current = smallest;
            } else {
                break;
            }
        }
    }
}

/**
 * Finds top K items from an iterable in O(N log K) time.
 * @param {Array} items
 * @param {number} k
 * @param {Function} scoreFn
 */
const getTopK = (items, k, scoreFn) => {
    if (!items || items.length === 0 || k <= 0) return [];
    if (k >= items.length) {
        return [...items].sort((a, b) => scoreFn(b) - scoreFn(a));
    }

    // Min-heap storing items with lowest score at the top
    const heap = new MinHeap((a, b) => scoreFn(a) - scoreFn(b));

    for (const item of items) {
        if (heap.size() < k) {
            heap.push(item);
        } else if (scoreFn(item) > scoreFn(heap.peek())) {
            heap.pop();
            heap.push(item);
        }
    }

    const result = [];
    while (heap.size() > 0) {
        result.push(heap.pop());
    }
    return result.reverse(); // Return in descending score order
};

module.exports = {
    MinHeap,
    getTopK,
};
