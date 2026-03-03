import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

export interface EventImage {
    image_id: string;
    event_id: string;
    image_url: string;
    created_at: string;
}

export function useEventGallery(eventId?: string) {
    const [images, setImages] = useState<EventImage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // ─── Fetch images ─────────────────────────────────────────
    const fetchImages = useCallback(async () => {
        if (!eventId) return;
        setIsLoading(true);
        try {
            const response = await apiClient.get(`/events/${eventId}/images`);
            const data = response.data?.data ?? response.data;
            setImages(data.images ?? []);
        } catch (error: any) {
            console.error("[useEventGallery] fetch error:", error);
        } finally {
            setIsLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchImages();
    }, [fetchImages]);

    // ─── Upload image ─────────────────────────────────────────
    const uploadImage = async (file: File) => {
        if (!eventId) {
            toast.error("Event must be created before uploading gallery images.");
            return null;
        }

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("event_id", eventId);
            formData.append("file_name", `${eventId}-${Date.now()}-${file.name}`);
            formData.append("bucket", "krown-events");

            const response = await apiClient.post("/events/images/upload", undefined, {
                body: formData,
            } as any);

            toast.success("Image uploaded!");
            // Refetch to get the new image with its image_id
            await fetchImages();
            return response.data;
        } catch (error: any) {
            toast.error(error.message || "Failed to upload image");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    // ─── Delete image ─────────────────────────────────────────
    const deleteImage = async (imageId: string, imageUrl: string) => {
        if (!eventId) return false;

        try {
            // Extract the storage path from the public URL
            // URL format: .../storage/v1/object/public/<bucket>/<path>
            const bucketName = "krown-events";
            let storagePath = "";
            const marker = `/storage/v1/object/public/${bucketName}/`;
            const idx = imageUrl.indexOf(marker);
            if (idx !== -1) {
                storagePath = imageUrl.substring(idx + marker.length);
            }

            await apiClient.delete(`/events/images/${imageId}`, {
                data: {
                    event_id: eventId,
                    bucket: bucketName,
                    path: storagePath,
                },
            });

            setImages((prev) => prev.filter((img) => img.image_id !== imageId));
            toast.success("Image deleted!");
            return true;
        } catch (error: any) {
            toast.error(error.message || "Failed to delete image");
            return false;
        }
    };

    return { images, isLoading, isUploading, uploadImage, deleteImage, fetchImages };
}

// Keep legacy export name for backwards compatibility
export const useEventGalleryUpload = useEventGallery;
