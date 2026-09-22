import imageCompression from "browser-image-compression";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class AvatarFileError extends Error {}

export async function prepareAvatarFile(file: File): Promise<File> {
  let working = file;

  const isHeic =
    working.type === "image/heic" ||
    working.type === "image/heif" ||
    /\.heic$/i.test(working.name);

  if (isHeic) {
    const heic2any = (await import("heic2any")).default;
    const blob = await heic2any({
      blob: working,
      toType: "image/jpeg",
      quality: 0.9,
    });
    const converted = Array.isArray(blob) ? blob[0] : blob;
    working = new File(
      [converted],
      working.name.replace(/\.(heic|heif)$/i, ".jpg"),
      { type: "image/jpeg" }
    );
  }

  if (!ALLOWED_TYPES.includes(working.type)) {
    throw new AvatarFileError("Podporované formáty jsou JPG, PNG a WEBP.");
  }

  const compressed = await imageCompression(working, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
    fileType: working.type === "image/png" ? "image/png" : "image/jpeg",
  });

  if (compressed.size > MAX_SIZE_MB * 1024 * 1024) {
    throw new AvatarFileError("Soubor je i po kompresi příliš velký.");
  }

  return compressed;
}

export function avatarExtension(file: File): string {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}