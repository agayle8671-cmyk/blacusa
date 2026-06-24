import { useState, useRef } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminClient, formatApiError } from "@/lib/auth";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export const ImageUploadField = ({ value, onChange, testid = "image" }) => {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await adminClient.post("/admin/upload", fd);
      const fullUrl = `${BACKEND_URL}${data.url}`;
      onChange(fullUrl);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div data-testid={`${testid}-upload-field`}>
      <div className="flex items-stretch gap-2">
        <input
          className="w-full border border-border bg-card px-4 py-3 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste an image URL or upload →"
          data-testid={`${testid}-url-input`}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          data-testid={`${testid}-upload-button`}
          className="flex shrink-0 items-center gap-2 border border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {busy ? "Uploading…" : "Upload"}
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onFile} />
      </div>
      {value && (
        <div className="relative mt-3 inline-block">
          <img src={value} alt="preview" className="h-28 w-auto border border-border object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            data-testid={`${testid}-clear`}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center bg-accent text-accent-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
