export type UploadProgress = {
  loaded: number;
  total: number;
  fraction: number; // 0..1
};

export type UploadHandle = {
  promise: Promise<void>;
  abort: () => void;
};

export function uploadToR2(
  signedUrl: string,
  file: File,
  onProgress?: (p: UploadProgress) => void,
): UploadHandle {
  const xhr = new XMLHttpRequest();
  const promise = new Promise<void>((resolve, reject) => {
    xhr.open("PUT", signedUrl, true);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress({ loaded: e.loaded, total: e.total, fraction: e.loaded / e.total });
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: HTTP ${xhr.status}`));
    });
    xhr.addEventListener("error", () => reject(new Error("Network error during upload")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));

    xhr.send(file);
  });

  return { promise, abort: () => xhr.abort() };
}
