import { Capacitor } from "@capacitor/core";
import { Share } from "@capacitor/share";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Media } from "@capacitor-community/media";

export type ShareTicketInput = {
  title: string;
  text: string;
  url: string;
};

export type ShareResult = { shared: boolean };

export async function shareTicket(input: ShareTicketInput): Promise<ShareResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share(input);
      return { shared: true };
    } catch {
      // User cancelled the native share sheet — not an error.
      return { shared: false };
    }
  }

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(input);
      return { shared: true };
    } catch {
      return { shared: false };
    }
  }

  return { shared: false };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Android's WebView has no working `<a download>`/blob download flow and no
// window.print() support, so "download" and "print" both need to go through
// the native share sheet instead (where the user can pick Save/Print/an app),
// same as Share. Writes to the app's cache dir, which needs no storage
// permission.
export async function saveOrShareFile(
  blob: Blob,
  filename: string,
  dialogTitle: string
): Promise<ShareResult> {
  if (!Capacitor.isNativePlatform()) return { shared: false };

  try {
    const base64 = await blobToBase64(blob);
    const written = await Filesystem.writeFile({
      path: filename,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({ files: [written.uri], dialogTitle });
    return { shared: true };
  } catch {
    return { shared: false };
  }
}

const GALLERY_ALBUM_NAME = "Ecobus";

async function getOrCreateAlbum(name: string): Promise<string | undefined> {
  const { albums } = await Media.getAlbums();
  const existing = albums.find((album) => album.name === name);
  if (existing) return existing.identifier;

  await Media.createAlbum({ name });
  const { albums: refreshed } = await Media.getAlbums();
  return refreshed.find((album) => album.name === name)?.identifier;
}

// Saves straight to the device's photo gallery via MediaStore (Android
// requires no runtime permission for this — apps can always write their own
// images there under scoped storage). Falls back to the share sheet if
// anything goes wrong, so Download always does something rather than fail
// silently.
export async function saveImageToGallery(blob: Blob, filename: string): Promise<ShareResult> {
  if (!Capacitor.isNativePlatform()) return { shared: false };

  try {
    const base64 = await blobToBase64(blob);
    const albumIdentifier = await getOrCreateAlbum(GALLERY_ALBUM_NAME);

    await Media.savePhoto({
      path: `data:image/png;base64,${base64}`,
      albumIdentifier,
      fileName: filename.replace(/\.png$/i, ""),
    });
    return { shared: true };
  } catch {
    return saveOrShareFile(blob, filename, "Save your Ecobus ticket");
  }
}
