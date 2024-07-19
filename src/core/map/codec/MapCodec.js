"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeMap = exports.encodeMap = void 0;
const MapEncoder_1 = require("./src/MapEncoder");
const LazyWriter_1 = require("./src/util/LazyWriter");
const StreamReader_1 = require("./src/util/StreamReader");
const MapDecoder_1 = require("./src/MapDecoder");
// Only bump this for breaking changes, decompression should always be backwards compatible
const CURRENT_VERSION = 0;
/**
 * Compresses map data
 * @param data map data to compress
 * @returns binary data
 */
function encodeMap(data) {
    const writer = new LazyWriter_1.LazyWriter();
    writer.writeBits(4, CURRENT_VERSION);
    writer.writeBits(16, data.width);
    writer.writeBits(16, data.height);
    MapEncoder_1.mapEncoder.writeCompressed(writer, data);
    writer.writeBits(8, 0); // reserved for future use
    return writer.compress();
}
exports.encodeMap = encodeMap;
/**
 * Decompresses map data
 * @param data binary data
 * @returns raw map data
 */
function decodeMap(data) {
    const reader = new StreamReader_1.StreamReader(data);
    const version = reader.readBits(4);
    if (version !== CURRENT_VERSION) {
        throw `Unsupported map version: ${version}`;
    }
    const width = reader.readBits(16);
    const height = reader.readBits(16);
    const tiles = MapDecoder_1.mapDecoder.readCompressed(reader, width, height);
    reader.readBits(8); // reserved for future use
    return { width, height, tiles };
}
exports.decodeMap = decodeMap;
