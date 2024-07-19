"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamReader = void 0;
class StreamReader {
    /**
     * Creates a new reader for the given buffer
     * @param buffer buffer to read from
     */
    constructor(buffer) {
        this.offset = 0;
        this.buffer = buffer;
    }
    /**
     * Reads a number of bits from the buffer
     * @param length number of bits to read, must be less than or equal to 32
     * @returns number of value read
     * @throws if length is greater than 32 or there is not enough data to read
     */
    readBits(length) {
        if (length > 32)
            throw "Cannot read more than 32 bits at a time";
        if (this.offset + length > this.buffer.length * 8)
            throw "Not enough data to read";
        let value = 0;
        for (let i = this.offset; i < this.offset + length; i++) {
            value |= ((this.buffer[i >>> 3] >>> (~i & 7)) & 1) << i - this.offset;
        }
        this.offset += length;
        return value >>> 0;
    }
    /**
     * @param maxLength maximum length of the string
     * @returns string read from the buffer (utf-8)
     */
    readString(maxLength) {
        const max = Math.min(maxLength, this.readBits(16));
        let value = "";
        for (let i = 0; i < max; i++) {
            value += String.fromCharCode(this.readBits(8));
        }
        return value;
    }
    /**
     * @returns boolean read from the buffer
     */
    readBoolean() {
        return this.readBits(1) === 1;
    }
}
exports.StreamReader = StreamReader;
