// Minimal PNG/JPEG dimension sniffer — reads just enough bytes to parse the
// header, no image-processing dependency needed. Exists specifically to
// reject decorative theme assets (thin divider strips, sprites) that pass
// every other quality heuristic but are obviously not a photo once you
// look at the actual shape — case 0 surfaced a real example: a 2000x65px
// racing-stripe divider graphic that out-ranked real track photos because
// nothing was checking real pixel dimensions.
export interface ImageDimensions {
  width: number;
  height: number;
}

function parsePng(buf: Buffer): ImageDimensions | null {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null; // \x89PNG
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function parseJpeg(buf: Buffer): ImageDimensions | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset < buf.length - 8) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    // SOF0-SOF15 markers (excluding DHT/JPG/DAC) carry height/width.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: buf.readUInt16BE(offset + 5), width: buf.readUInt16BE(offset + 7) };
    }
    const segmentLength = buf.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  return null;
}

export async function fetchImageDimensions(url: string): Promise<ImageDimensions | null> {
  try {
    // First 64KB covers the header for the vast majority of real photos —
    // PNG's IHDR is always the first chunk, JPEG SOF markers are almost
    // always within this range unless the file has an enormous EXIF blob.
    const res = await fetch(url, { headers: { Range: "bytes=0-65535" } });
    if (!res.ok && res.status !== 206) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return parsePng(buf) ?? parseJpeg(buf);
  } catch (err) {
    console.error("[image-dimensions] fetch failed for", url, err);
    return null;
  }
}
