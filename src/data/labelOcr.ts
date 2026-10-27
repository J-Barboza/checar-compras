import TextRecognition from '@react-native-ml-kit/text-recognition';
import { File } from 'expo-file-system';
import { pickPrice, type OcrLine } from '../domain/priceOcr';

/** Reads the shelf price from a label photo on the device, then deletes the photo. */
export async function readPriceFromPhoto(uri: string): Promise<number | null> {
  try {
    const result = await TextRecognition.recognize(uri);
    const lines: OcrLine[] = result.blocks.flatMap((b) => b.lines.map((l) => ({ text: l.text, top: l.frame?.top ?? 0, left: l.frame?.left ?? 0, width: l.frame?.width ?? 0, height: l.frame?.height ?? 0 })));
    return pickPrice(lines);
  } catch {
    return null;
  } finally {
    try {
      new File(uri).delete();
    } catch {}
  }
}
