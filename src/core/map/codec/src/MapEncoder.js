"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapEncoder = void 0;
const ZoneCalculator_1 = require("./util/ZoneCalculator");
class MapEncoder {
    constructor() {
        this.width = 0;
    }
    /**
     * Writes compressed map data to a writer
     * @param writer writer to use
     * @param data map data to compress
     */
    writeCompressed(writer, data) {
        writer.writeBits(8, 0); //reserved for future use
        this.width = data.width;
        const zones = ZoneCalculator_1.ZoneCalculator.buildZones(data);
        const typeMap = [];
        let nextTypeId = 0;
        for (const zone of zones) {
            if (typeMap[zone.id] === undefined) {
                typeMap[zone.id] = nextTypeId++;
            }
        }
        const typeLength = Math.ceil(Math.log2(Object.keys(typeMap).length));
        const lines = this.calculateLines(writer, zones, typeLength);
        writer.writeBits(1, 0); //reserved for future use
        this.writeTypeMap(writer, typeMap);
        this.writeLines(writer, lines, typeLength, typeMap);
    }
    /**
     * Writes the type map, note that type ids are limited to 16 bits
     * @param writer writer to use
     * @param typeMap map of zone type ids to game type ids
     * @private
     */
    writeTypeMap(writer, typeMap) {
        const typeMapLength = Object.keys(typeMap).length;
        writer.writeBits(16, typeMapLength);
        for (let i = 0; i < typeMapLength; i++) {
            writer.writeBits(3, 0); //reserved for future use
            writer.writeBits(16, typeMap.indexOf(i));
            //TODO: rgb + extra data
        }
    }
    /**
     * Writes compressed lines
     * @param writer writer to use
     * @param lines map lines to write
     * @param typeLength length of type ids
     * @param typeMap map of zone type ids to game type ids
     * @private
     */
    writeLines(writer, lines, typeLength, typeMap) {
        writer.writeBits(32, lines.length);
        let currentChunk = 0;
        for (const line of lines) {
            currentChunk = this.checkChunk(writer, currentChunk, line.line[0]);
            writer.writeBits(1, 0); //reserved for future use
            writer.writeBits(8, line.line.length - 1);
            writer.writeBits(typeLength, typeMap[line.id]);
            writer.writeBits(10, (line.line[0] % this.width) % 32 + Math.floor(line.line[0] / this.width) % 32 * 32);
            for (let i = 1; i < line.line.length; i++) {
                const diff = line.line[i] - line.line[i - 1];
                writer.writeBits(2, diff === 1 ? 0 : diff === -1 ? 1 : diff === this.width ? 2 : 3);
            }
        }
    }
    /**
     * Checks if the current chunk needs to be changed
     * @param writer writer to use
     * @param currentChunk current chunk
     * @param position position to check
     * @returns new chunk
     * @private
     */
    checkChunk(writer, currentChunk, position) {
        const chunkX = Math.floor((position % this.width) / 32);
        const chunkY = Math.floor(Math.floor(position / this.width) / 32);
        const chunk = chunkY * Math.ceil(this.width / 32) + chunkX;
        let i = 0;
        while (chunk !== currentChunk) {
            writer.writeBits(1, 1);
            currentChunk++;
            i++;
        }
        writer.writeBits(1, 0);
        return currentChunk;
    }
    /**
     * Chunks lines into 32x32 blocks
     * @param lines lines to chunk
     * @private
     */
    chunkLines(lines) {
        const chunkWidth = Math.ceil(this.width / 32);
        const chunkMap = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const chunkX = Math.floor((line.line[0] % this.width) / 32);
            const chunkY = Math.floor(Math.floor(line.line[0] / this.width) / 32);
            chunkMap[i] = chunkY * chunkWidth + chunkX;
        }
        lines.sort((a, b) => chunkMap[lines.indexOf(a)] - chunkMap[lines.indexOf(b)]);
    }
    /**
     * Calculates lines along the border of each zone
     * @param writer writer to use
     * @param zones zones to calculate lines for
     * @param typeLength length of type ids
     * @returns resulting lines
     * @private
     */
    calculateLines(writer, zones, typeLength) {
        const linesL2R = [];
        const linesT2B = [];
        for (const zone of zones) {
            linesL2R.push(...this.calculateNeededLines(zone.leftBorder, zone.leftBorderMap, zone.tileMap).map(line => ({ id: zone.id, line })));
            linesT2B.push(...this.calculateNeededLines(zone.topBorder, zone.topBorderMap, zone.tileMap).map(line => ({ id: zone.id, line })));
        }
        this.chunkLines(linesL2R);
        this.chunkLines(linesT2B);
        const costL2R = this.calculateCost(linesL2R, typeLength);
        const costT2B = this.calculateCost(linesT2B, typeLength);
        writer.writeBoolean(costL2R > costT2B);
        return costL2R > costT2B ? linesT2B : linesL2R;
    }
    /**
     * Calculates the cost of a set of lines
     * @param lines lines to calculate cost for
     * @param typeLength length of type ids
     * @returns cost of the lines
     * @private
     */
    calculateCost(lines, typeLength) {
        let cost = 0;
        let currentChunk = 0;
        for (const line of lines) {
            const chunk = Math.floor((line.line[0] % this.width) / 32) + Math.floor(Math.floor(line.line[0] / this.width) / 32) * Math.ceil(this.width / 32);
            cost += (line.line.length - 1) * 2 + 20 + typeLength + (chunk - currentChunk);
            currentChunk = chunk;
        }
        return cost;
    }
    /**
     * Finds lines along the border of a zone allowing for lossless compression
     *
     * To allow reconstruction of the map, only certain points on the borders are needed.
     * Since the overhead of storing positions is pretty high, we can compress the border into lines.
     * This greedy algorithm tries to find the shortest possible lines that connect all border points.
     * For gaps greater than 8 tiles, multiple lines are used.
     *
     * @param points border points
     * @param pointMap map of border points
     * @param tileMap map of tiles
     * @returns resulting lines
     * @private
     */
    calculateNeededLines(points, pointMap, tileMap) {
        const segments = [];
        const segmentMap = [];
        const connectionCount = new Uint8Array(points.length);
        const connectionMap = this.calculateConnections(points, pointMap, tileMap);
        for (let depth = 0; depth < connectionMap.length; depth++) {
            for (const connection of connectionMap[depth]) {
                if (connectionCount[connection.from] >= 2 || connectionCount[connection.to] >= 2) {
                    continue;
                }
                if (!MapEncoder.processConnection(!connectionCount[connection.from], !connectionCount[connection.to], connection, segments, points, segmentMap)) {
                    continue;
                }
                connectionCount[connection.from]++;
                connectionCount[connection.to]++;
            }
        }
        MapEncoder.cropLines(segments);
        MapEncoder.addSingles(points, connectionCount, segments);
        return segments.filter(segment => segment);
    }
    /**
     * Processes a connection between two border points
     * @param fromIsNew whether the starting point is new
     * @param toIsNew whether the ending point is new
     * @param connection connection to process
     * @param segments lines to add to
     * @param border border points
     * @param segmentMap map of border points to segments
     * @returns whether the segments were connected
     * @private
     */
    static processConnection(fromIsNew, toIsNew, connection, segments, border, segmentMap) {
        const valueFrom = border[connection.from];
        const valueTo = border[connection.to];
        if (fromIsNew && toIsNew) {
            segments.push([valueFrom, ...connection.path, valueTo]);
            segmentMap[connection.from] = segmentMap[connection.to] = segments.length - 1;
            return true;
        }
        if (fromIsNew) {
            MapEncoder.concatSegment(segments[segmentMap[connection.to]], connection.path, valueTo, valueFrom);
            segmentMap[connection.from] = segmentMap[connection.to];
            return true;
        }
        if (toIsNew) {
            MapEncoder.concatSegment(segments[segmentMap[connection.from]], connection.path.reverse(), valueFrom, valueTo);
            segmentMap[connection.to] = segmentMap[connection.from];
            return true;
        }
        if (segmentMap[connection.from] !== segmentMap[connection.to]) {
            const start = MapEncoder.connectSegments(segments[segmentMap[connection.from]], segments[segmentMap[connection.to]], valueFrom, valueTo, connection.path);
            delete segments[segmentMap[connection.from]];
            segmentMap[border.indexOf(start)] = segmentMap[connection.to];
            return true;
        }
        return false;
    }
    /**
     * Concatenates a path to a segment
     * @param segment segment to concatenate to
     * @param path path to concatenate
     * @param ending ending point of the segment
     * @param toAdd point to add to the segment
     * @private
     */
    static concatSegment(segment, path, ending, toAdd) {
        if (segment[0] === ending) {
            segment.unshift(toAdd, ...path);
        }
        else {
            segment.push(...path.reverse(), toAdd);
        }
    }
    /**
     * Connects two segments into one
     * @param segmentA first segment
     * @param segmentB second segment
     * @param startA starting point of the first segment
     * @param startB starting point of the second segment
     * @param path path to connect the segments
     * @returns new starting value of the combined segment
     * @private
     */
    static connectSegments(segmentA, segmentB, startA, startB, path) {
        if (segmentB[0] === startB) {
            if (segmentA[0] === startA) {
                segmentB.unshift(...segmentA.reverse(), ...path);
            }
            else {
                segmentB.unshift(...segmentA, ...path);
            }
        }
        else {
            if (segmentA[0] === startA) {
                segmentB.push(...path.reverse(), ...segmentA);
            }
            else {
                segmentB.push(...path.reverse(), ...segmentA.reverse());
            }
        }
        return segmentA[0] === startA ? segmentA[segmentA.length - 1] : segmentA[0];
    }
    /**
     * Adds lines for single points
     * @param border border points
     * @param connectionCount connection count for each point
     * @param lines lines to add to
     * @private
     */
    static addSingles(border, connectionCount, lines) {
        for (let i = 0; i < border.length; i++) {
            if (connectionCount[i] === 0) {
                lines.push([border[i]]);
            }
        }
    }
    /**
     * Crops lines that are too long, splitting them into multiple lines
     * @param lines lines to crop
     * @private
     */
    static cropLines(lines) {
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line && line.length > 256) {
                lines[i] = line.slice(0, 256);
                lines.push(line.slice(256));
            }
        }
    }
    /**
     * Calculates all potential connections between border points, at most 8 pixels apart
     * @param points border points
     * @param pointMap map of border points
     * @param tileMap map of tiles
     * @returns array of connections, indexed by path length
     * @private
     */
    calculateConnections(points, pointMap, tileMap) {
        const connectionMap = new Array(8).fill(null).map(() => []);
        for (let i = 0; i < points.length; i++) {
            const paths = this.calculatePaths(points[i], pointMap, tileMap);
            for (const [point, path] of paths) {
                const index = points.indexOf(point);
                if (index >= i)
                    continue; //only add each connection once
                connectionMap[path.length].push({ from: i, to: index, path });
            }
        }
        return connectionMap;
    }
    /**
     * Calculates all paths from a point to all other points
     *
     * This is a simple breadth-first search, paths are limited to 8 tiles
     *
     * @param start starting point
     * @param pointMap map of border points
     * @param tileMap map of tiles
     * @returns map of reachable points and their paths
     * @private
     */
    calculatePaths(start, pointMap, tileMap) {
        let open = [start];
        let paths = [[]];
        const visited = [];
        visited[start] = true;
        const result = new Map();
        while (open.length > 0) {
            const point = open.shift();
            const path = paths.shift();
            if (pointMap[point]) {
                result.set(point, path.slice(0, -1));
            }
            if (path.length < 8) {
                for (const nextPoint of [point - 1, point + 1, point - this.width, point + this.width]) {
                    if (!visited[nextPoint] && tileMap[nextPoint]) {
                        open.push(nextPoint);
                        paths.push([...path, nextPoint]);
                        visited[nextPoint] = true;
                    }
                }
            }
        }
        return result;
    }
}
exports.mapEncoder = new MapEncoder();
