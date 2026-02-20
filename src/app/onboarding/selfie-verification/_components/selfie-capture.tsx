"use client";

import { startTransition, useActionState, useEffect, useReducer, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, RefreshCw, Loader2, ArrowRight } from "lucide-react";

import type { ActionState } from "@/types/api";
import { submitSelfieAction } from "@/actions/kyc-liveness";
import { useOnboardingStore } from "@/stores/onboarding-store";

import { Button } from "@/components/ui/button";

type CapturePhase =
  | "idle"
  | "capturing_first"
  | "first_captured"
  | "capturing_second"
  | "second_captured"
  | "submitting";

type State = {
  phase: CapturePhase;
  firstImage: string | null;
  secondImage: string | null;
};

type Action =
  | { type: "START_FIRST_CAPTURE" }
  | { type: "FIRST_CAPTURED"; imageData: string }
  | { type: "START_SECOND_CAPTURE" }
  | { type: "SECOND_CAPTURED"; imageData: string }
  | { type: "RETAKE_FIRST" }
  | { type: "RETAKE_SECOND" }
  | { type: "RESET" }
  | { type: "SUBMITTING" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "START_FIRST_CAPTURE":
      return { ...state, phase: "capturing_first" };
    case "FIRST_CAPTURED":
      return { ...state, phase: "first_captured", firstImage: action.imageData };
    case "START_SECOND_CAPTURE":
      return { ...state, phase: "capturing_second" };
    case "SECOND_CAPTURED":
      return {
        ...state,
        phase: "second_captured",
        secondImage: action.imageData,
      };
    case "RETAKE_FIRST":
      return { phase: "idle", firstImage: null, secondImage: null };
    case "RETAKE_SECOND":
      return { ...state, phase: "first_captured", secondImage: null };
    case "RESET":
      return { phase: "idle", firstImage: null, secondImage: null };
    case "SUBMITTING":
      return { ...state, phase: "submitting" };
  }
}

interface LivenessResult {
  status: string;
  face_match_score?: number;
  face_match_result?: string;
  message?: string;
}

export function SelfieCapture() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const markStepCompleted = useOnboardingStore((s) => s.markStepCompleted);
  const organizerType = useOnboardingStore((s) => s.organizerType);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [state, dispatch] = useReducer(reducer, {
    phase: "idle",
    firstImage: null,
    secondImage: null,
  });

  const [actionState, submitAction, isPending] = useActionState<
    ActionState<LivenessResult>,
    FormData
  >(submitSelfieAction, { success: false });

  const startCamera = async (captureType: "first" | "second") => {
    dispatch({
      type:
        captureType === "first" ? "START_FIRST_CAPTURE" : "START_SECOND_CAPTURE",
    });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      dispatch({ type: "RESET" });
    }
  };

  const stopCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/jpeg", 0.8);
    stopCamera();

    if (state.phase === "capturing_first") {
      dispatch({ type: "FIRST_CAPTURED", imageData });
    } else {
      dispatch({ type: "SECOND_CAPTURED", imageData });
    }
  };

  const handleSubmit = () => {
    if (!state.firstImage || !state.secondImage) return;
    dispatch({ type: "SUBMITTING" });
    const formData = new FormData();
    formData.append("first_image", state.firstImage);
    formData.append("second_image", state.secondImage);
    startTransition(() => {
      submitAction(formData);
    });
  };

  useEffect(() => {
    if (actionState.success) {
      markStepCompleted("selfie-verification");
      queryClient.invalidateQueries({ queryKey: ["kyc"] });
      const nextPath =
        organizerType === "company"
          ? "/onboarding/company-details"
          : "/onboarding/bank-account";
      router.push(nextPath);
    }
  }, [actionState.success, markStepCompleted, queryClient, organizerType, router]);

  const isCapturing =
    state.phase === "capturing_first" || state.phase === "capturing_second";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Face Verification
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Take two selfies to verify your identity. We&apos;ll match both
          photos to confirm they are the same person.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        <div
          className={`flex items-center gap-1 ${
            state.firstImage ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              state.firstImage
                ? "bg-green-100 text-green-700"
                : state.phase === "idle" || state.phase === "capturing_first"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {state.firstImage ? "\u2713" : "1"}
          </div>
          <span>First Selfie</span>
        </div>
        <div className="w-8 h-px bg-border" />
        <div
          className={`flex items-center gap-1 ${
            state.secondImage ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
              state.secondImage
                ? "bg-green-100 text-green-700"
                : state.phase === "capturing_second" ||
                    state.phase === "second_captured"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {state.secondImage ? "\u2713" : "2"}
          </div>
          <span>Second Selfie</span>
        </div>
      </div>

      {actionState.error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
          <p className="text-sm text-destructive">{actionState.error}</p>
        </div>
      )}

      {/* Camera / Preview area */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="aspect-[4/3] bg-secondary flex items-center justify-center relative">
          {state.phase === "idle" && (
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full border-2 border-dashed border-muted-foreground mx-auto flex items-center justify-center">
                <Camera className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Position your face in the center
              </p>
            </div>
          )}

          {isCapturing && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {state.phase === "first_captured" && state.firstImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.firstImage}
              alt="First selfie"
              className="w-full h-full object-cover"
            />
          )}

          {(state.phase === "second_captured" ||
            state.phase === "submitting") &&
            state.firstImage &&
            state.secondImage && (
              <div className="absolute inset-0 flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.firstImage}
                  alt="First selfie"
                  className="w-1/2 h-full object-cover border-r border-border"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={state.secondImage}
                  alt="Second selfie"
                  className="w-1/2 h-full object-cover"
                />
              </div>
            )}

          {actionState.success && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
                <p className="text-sm font-medium text-success">
                  Face Match Verified
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <div className="space-y-2 text-xs text-muted-foreground">
        <p>1. Look directly at the camera for both selfies</p>
        <p>2. Ensure good, consistent lighting</p>
        <p>3. Remove glasses or hats</p>
        <p>4. Only your face should be visible in each photo</p>
      </div>

      {/* Action Buttons */}

      {state.phase === "idle" && (
        <Button
          onClick={() => startCamera("first")}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
        >
          <Camera className="w-4 h-4 mr-2" />
          Take First Selfie
        </Button>
      )}

      {isCapturing && (
        <Button
          onClick={capturePhoto}
          className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-medium"
        >
          Capture Photo
        </Button>
      )}

      {state.phase === "first_captured" && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "RETAKE_FIRST" })}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake
          </Button>
          <Button
            onClick={() => startCamera("second")}
            className="flex-1 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
          >
            Take Second Selfie
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {state.phase === "second_captured" && (
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "RETAKE_SECOND" })}
            className="flex-1"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retake
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 bg-gradient-to-r from-primary to-primary/90 text-primary-foreground"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              "Verify Face Match"
            )}
          </Button>
        </div>
      )}

      {state.phase === "submitting" && (
        <Button disabled className="w-full h-12">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Verifying your identity...
        </Button>
      )}
    </div>
  );
}
