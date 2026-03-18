import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";

interface EventCoverUploadProps {
    eventId?: string;
    currentCoverUrl?: string;
    onUploadSuccess: (url: string) => void;
    // Add a prop to pass the raw file up if we don't have an eventId yet
    onFileSelect?: (file: File) => void; 
    onRemove?: () => void;
}

export function EventCoverUpload({ eventId, currentCoverUrl, onUploadSuccess, onFileSelect, onRemove }: EventCoverUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [localPreview, setLocalPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // If we don't have an eventId, we are creating a new event.
        // We'll prepare the file to be uploaded LATER along with the form submit
        if (!eventId) {
            const previewUrl = URL.createObjectURL(file);
            setLocalPreview(previewUrl);
            
            // Pass the file back up to the form so it can be handled on submit
            if (onFileSelect) {
                onFileSelect(file);
            }
            return;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("event_id", eventId);
            formData.append("file_name", `${eventId}-cover-${Date.now()}-${file.name}`);
            
            // Send the file to our new endpoint
            const response = await apiClient.post("/events/cover/upload", undefined, {
                body: formData,
            } as any);

            const data = response.data?.data ?? response.data;
            if (data?.url) {
                toast.success("Cover image uploaded successfully!");
                onUploadSuccess(data.url);
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to upload cover image");
        } finally {
            setIsUploading(false);
            if (e.target) {
                e.target.value = ""; 
            }
        }
    };

    const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        
        if (localPreview) {
            URL.revokeObjectURL(localPreview);
            setLocalPreview(null);
        }
        
        if (onRemove) {
            onRemove();
        }
        
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Cleanup local preview URLs
    useEffect(() => {
        return () => {
            if (localPreview) {
                URL.revokeObjectURL(localPreview);
            }
        };
    }, [localPreview]);

    const displayUrl = localPreview || currentCoverUrl;

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-1.5">
                <Label>Event Cover Image</Label>
                <div className="text-sm text-muted-foreground">
                    Upload a high-quality cover image for your event.
                </div>
            </div>

            {displayUrl ? (
                <div className="relative group w-full aspect-[21/9] sm:aspect-[21/6] rounded-xl overflow-hidden border border-border">
                    <img
                        src={displayUrl}
                        alt="Event Cover"
                        className="w-full h-full object-cover transition-all duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="flex items-center gap-2 bg-destructive text-destructive-foreground px-4 py-2 rounded-md font-medium text-sm hover:bg-destructive/90 transition-colors shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" />
                            Remove Cover
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-center w-full">
                    <div
                        onClick={handleClick}
                        className="flex flex-col items-center justify-center w-full min-h-[12rem] sm:min-h-[16rem] border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors border-muted-foreground/25 relative group"
                    >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {isUploading ? (
                                <Loader2 className="w-10 h-10 mb-3 text-muted-foreground animate-spin" />
                            ) : (
                                <Upload className="w-10 h-10 mb-3 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                            )}
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold text-primary">Click to upload</span>{" "}
                                or drag and drop
                            </p>
                            <p className="text-xs text-muted-foreground">
                                PNG, JPG or JPEG (MAX. 5MB)
                            </p>
                        </div>
                    </div>
                    <input
                        ref={fileInputRef}
                        id="cover-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                </div>
            )}
            
            {!eventId && !displayUrl && (
                <p className="text-xs text-muted-foreground">
                    Your image will be submitted when you save the event details.
                </p>
            )}
        </div>
    );
}
