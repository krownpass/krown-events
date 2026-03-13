import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { useEventGallery } from "@/hooks/use-event-gallery";

interface EventGalleryProps {
    eventId?: string;
    maxImages?: number;
}

export function EventGallery({ eventId, maxImages = 10 }: EventGalleryProps) {
    const { images, isLoading, isUploading, uploadImage, deleteImage } =
        useEventGallery(eventId);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;

        if (images.length >= maxImages) {
            return;
        }

        const file = e.target.files[0];
        if (!file) return;

        if (!eventId) {
            alert("Please create the event first before adding gallery images.");
            return;
        }

        await uploadImage(file);
        // Reset the input so the same file can be re-selected
        e.target.value = "";
    };

    const handleDelete = async (imageId: string, imageUrl: string) => {
        await deleteImage(imageId, imageUrl);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <Label>Event Gallery</Label>
                    <p className="text-sm text-muted-foreground">
                        Upload up to {maxImages} images for the event gallery
                    </p>
                </div>
                <span className="text-sm font-medium">
                    {images.length}/{maxImages}
                </span>
            </div>

            {/* FULL-WIDTH UPLOAD AREA */}
            {images.length < maxImages && (
                <Label
                    htmlFor="gallery-upload"
                    className="flex flex-col items-center justify-center gap-3 p-10 w-full rounded-xl border-2 border-dashed border-muted-foreground/25 bg-card hover:bg-accent/50 cursor-pointer transition-colors relative overflow-hidden"
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                        <>
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground font-medium text-center">
                                Click to upload event image
                                <br />
                                <span className="text-xs font-normal opacity-75">PNG, JPG up to 5MB</span>
                            </span>
                        </>
                    )}
                    <Input
                        id="gallery-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleUpload}
                        disabled={isUploading}
                    />
                </Label>
            )}

            {/* IMAGE GRID */}
            {images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((img) => (
                        <div
                            key={img.image_id}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.image_url}
                                alt="Gallery preview"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => handleDelete(img.image_id, img.image_url)}
                                    className="p-2 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}