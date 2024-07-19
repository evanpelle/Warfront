"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LazyWriter = void 0;
class LazyWriter {
    constructor() {
        this.length = 0;
        this.data = [];
        this.offset = 0;
        this.buffer = null;
    }
    /**
     * Warning: JavaScript bitwise operations are limited to 32 bits
     * Note: We use Little-endian bit order
     */
    actuallyWriteBits(length, value) {
        for (let i = this.offset; i < this.offset + length; i++) {
            this.buffer[i >>> 3] |= ((value >>> i - this.offset) & 1) << (~i & 7);
        }
        this.offset += length;
    }
    /**
     * Queues a number of bits to be written to the buffer
     * @param length number of bits to write, must be less than or equal to 32
     * @param value value to write, only the lowest length bits will be written
     * @throws if length is greater than 32
     */
    writeBits(length, value) {
        if (length > 32)
            throw "Cannot write more than 32 bits at a time";
        this.data.push(() => {
            this.actuallyWriteBits(length, value);
        });
        this.length += length;
    }
    /**
     * Queues a truncated string to be written to the buffer
     * @param maxLength length to truncate the string to
     * @param value string to write (utf-8), any characters beyond maxLength will be ignored
     */
    writeString(maxLength, value) {
        const max = Math.min(maxLength, value.length);
        this.data.push(() => {
            this.actuallyWriteBits(16, max);
            for (let i = 0; i < max; i++) {
                this.actuallyWriteBits(8, value.charCodeAt(i));
            }
        });
        this.length += 16 + 8 * max;
    }
    /**
     * Queues a boolean to be written to the buffer
     * @param value boolean to write
     */
    writeBoolean(value) {
        this.data.push(() => {
            this.actuallyWriteBits(1, value ? 1 : 0);
        });
        this.length += 1;
    }
    /**
     * @returns buffer containing queued data
     */
    compress() {
        this.offset = 0;
        this.buffer = new Uint8Array(Math.ceil(this.length / 8));
        for (const bit of this.data) {
            bit();
        }
        return this.buffer;
    }
}
exports.LazyWriter = LazyWriter;
