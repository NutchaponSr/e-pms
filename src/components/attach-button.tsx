import { 
  BsEyeFill, 
  BsFileText, 
  BsTrash3 
} from "react-icons/bs";
import { toast } from "sonner";
import { useRef, useState } from "react";

import { useEdgeStore } from "@/lib/edegstore";

import { Spinner } from "@/components/ui/spinner";

interface Props {
  value?: string | null;
  canPerform: boolean;
  onChange: (url: string | null) => void;
  onRemove: () => void;
}

export const AttachButton = ({
  value,
  canPerform,
  onChange,
  onRemove,
}: Props) => {
  const { edgestore } = useEdgeStore();

  const [isUploading, setIsUploading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const { url } = await edgestore.publicFiles.upload({ 
        file,
        options: {
          replaceTargetUrl: value || undefined
        } 
      });

      onChange(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleClear = async () => {
    if (!value) return;
    
    setIsUploading(true);
    
    try {
      await edgestore.publicFiles.delete({
        url: value,
      });

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
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center gap-2">        
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
          className="transition border border-border rounded bg-background hover:bg-primary/6 flex items-center py-1 px-2 w-full min-h-8 group/image relative data-[disabled=true]:opacity-80"
        >
          <div 
            className="flex-1 flex items-center data-[disabled=true]:pointer-events-none"
            data-disabled={isUploading || !canPerform}
          >
            {isUploading ? (
              <>
                <Spinner className="size-4 me-1.5 text-tertiary!" />
                <div className="whitespace-nowrap overflow-hidden text-ellipsis text-sm text-primary">
                  Uploading...
                </div>
              </>
            ) : (
              <>
                <BsFileText className="size-4 me-1.5 text-secondary" />
                <div data-active={!!value} className="whitespace-nowrap overflow-hidden text-ellipsis text-sm text-primary data-[active=true]:text-marine">
                  {value ? "Replace" : "Upload"}
                </div>
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