import { decode, encode } from '@msgpack/msgpack';

export const parseMsgPack = async (input: Blob | File): Promise<unknown> => {
  // File extends Blob, so arrayBuffer() is available on both
  const arrayBuffer = await input.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  try {
    return decode(uint8Array);
  } catch (error) {
    console.error("Failed to decode MessagePack:", error);
    throw new Error("Invalid MessagePack file format.");
  }
};

export const encodeMsgPack = (json: unknown): Uint8Array => {
  try {
    return encode(json);
  } catch (error) {
    console.error("Failed to encode to MessagePack:", error);
    throw new Error("Failed to encode JSON to MessagePack.");
  }
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
