import { 
  BsEyeFill, 
  BsFileText, 
  BsTrash3 
} from "react-icons/bs";
import { toast } from "sonner";
import { useRef, useState } from "react";

import { extractFileNameFromUrl, getFileUrl } from "@/lib/attach-utils";

import { Spinner } from "@/components/ui/spinner";

interface Props {
  value?: string | null;
  canPerform: boolean;
  onChange: (url: string | null) => void;
  onRemove: () => void;
  onUpload?: (url: string) => void;
}

export const AttachButton = ({
  value,
  canPerform,
  onChange,
  onRemove,
  onUpload,
}: Props) => {
  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE_BYTES = 15 * 1024 * 1024; // 15MB
    if (file.size > MAX_SIZE_BYTES) {
      toast.error("File size must not exceed 15MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (value) {
        formData.append("replaceUrl", getFileUrl(value));
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Upload failed");
      }

      const { url } = (await res.json()) as { url: string };
      onChange(url);
      onUpload?.(url);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to upload file.");
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const fileName = value ? extractFileNameFromUrl(value) : null;

  const handleClear = async () => {
    if (!value) return;
    
    setIsUploading(true);
    
    try {
      const res = await fetch(getFileUrl(value), { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Delete failed");
      }

      onRemove();
      onChange(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex w-full min-w-0 items-center gap-2">        
        <div 
          role="button" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();

            if (canPerform && !isUploading) {
              inputRef.current?.click();
            }
          }} 
          data-disabled={isUploading || !canPerform}
          className="transition border border-border rounded bg-background hover:bg-primary/6 flex w-full min-w-0 items-center overflow-hidden py-1 px-2 min-h-8 group/image relative data-[disabled=true]:opacity-80"
        >
          <div 
            className={`flex min-w-0 flex-1 items-center overflow-hidden data-[disabled=true]:pointer-events-none ${value ? "pe-12" : ""}`}
            data-disabled={isUploading || !canPerform}
          >
            {isUploading ? (
              <>
                <Spinner className="size-4 me-1.5 shrink-0 text-tertiary!" />
                <div className="min-w-0 flex-1 truncate text-sm text-primary">
                  กำลังโหลด...
                </div>
              </>
            ) : (
              <>
                <BsFileText className="size-4 me-1.5 shrink-0 text-secondary" />
                <p
                  data-active={!!value}
                  title={fileName ?? undefined}
                  className="min-w-0 flex-1 truncate text-sm text-primary data-[active=true]:text-marine"
                >
                  {fileName ?? "อัพโหลด (.pdf ไม่เกิน 15MB)"}
                </p>
              </>
            )}
          </div>

          {value && (
            <div className="absolute right-1 border border-border rounded bg-background p-0.5 transition-opacit opacity-0 group-hover/image:opacity-100">
              <div className="flex items-center">
                <div 
                  role="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    window.open(value, "_blank");
                  }}  
                  className="flex items-center justify-center transition size-5 whitespace-nowrap text-xs font-medium text-secondary hover:bg-primary/6 rounded relative"
                >
                  <BsEyeFill className="size-3 shrink-0 text-primary" />
                </div>
                {canPerform && (
                  <div 
                    role="button" 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();

                      handleClear();
                    }}
                    className="flex items-center justify-center transition size-5 whitespace-nowrap text-xs font-medium text-secondary hover:bg-primary/6 rounded relative"
                  >
                    <BsTrash3 className="size-3 shrink-0 text-destructive stroke-[0.25]" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
