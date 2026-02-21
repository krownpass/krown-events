"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
    Camera, CheckCircle2, XCircle, Users,
    UserCheck, UserX, ScanLine, RefreshCw, Loader2,
    CheckSquare, Square, AlertCircle, Ticket, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const SCANNER_ID = "qr-checkin-scanner";

async function loadCheckInData(eventId: string) {
    const [s, p, c] = await Promise.all([
        fetch(`${API_URL}/events/${eventId}/check-in/stats`, { credentials: "include" }),
        fetch(`${API_URL}/events/${eventId}/check-in/pending?limit=200`, { credentials: "include" }),
        fetch(`${API_URL}/events/${eventId}/check-in/checked-in?limit=200`, { credentials: "include" }),
    ]);
    let stats: CheckInStats | null = null;
    let pendingList: PendingReg[] = [];
    let checkedInList: CheckedInReg[] = [];
    if (s.ok) stats = await s.json();
    if (p.ok) { const d = await p.json(); if (d.data) { pendingList = d.data; } }
    if (c.ok) { const d = await c.json(); if (d.data) { checkedInList = d.data; } }
    return { stats, pendingList, checkedInList };
}

/* ─── Types ───────────────────────────────────────── */
interface CheckInStats {
    total: number;
    checkedIn: number;
    pending: number;
    percentage: number;
}

interface PendingReg {
    registration_id: string;
    user_name: string;
    user_email?: string;
    user_mobile_no?: string;
    ticket_count: number;
    tier_name?: string;
}

interface CheckedInReg extends PendingReg {
    check_in_time?: string;
    admitted_count?: number;
}

interface BookingInfo {
    registration_id: string;
    user_name: string;
    user_mobile_no?: string;
    ticket_count: number;
    admitted_count: number;
    tier_name?: string;
    status: string;
}

type ScanState =
    | "idle"
    | "starting"
    | "ready"
    | "processing"
    | "booking_shown"
    | "result_ok"
    | "result_fail";

/* ─── Component ───────────────────────────────────── */
export function CheckInScannerTab({ eventId }: { eventId: string }) {
    const [scanState, setScanState] = useState<ScanState>("idle");
    const [stats, setStats] = useState<CheckInStats | null>(null);
    const [pendingList, setPendingList] = useState<PendingReg[]>([]);
    const [checkedInList, setCheckedInList] = useState<CheckedInReg[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isLoading, setIsLoading] = useState(false);
    const [booking, setBooking] = useState<BookingInfo | null>(null);
    const [admitting, setAdmitting] = useState(false);
    const [resultMsg, setResultMsg] = useState("");
    const [resultOk, setResultOk] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [debugLog, setDebugLog] = useState<{ id: string; text: string; ok?: boolean; err?: boolean }[]>([]);
    const [refreshTick, setRefreshTick] = useState(0);

    // Manual booking admit UI
    const [manualRegId, setManualRegId] = useState("");
    const [manualTickets, setManualTickets] = useState(1);
    const [manualBooking, setManualBooking] = useState<BookingInfo | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const processingRef = useRef(false);
    const scanStateRef = useRef<ScanState>("idle");
    const scanFramesRef = useRef({ count: 0, lastLog: 0 });
    const logSeqRef = useRef(0);

    useEffect(() => {
        scanStateRef.current = scanState;
    }, [scanState]);

    const log = useCallback((msg: string, ok?: boolean, err?: boolean) => {
        const ts = new Date().toLocaleTimeString();
        // Use crypto.randomUUID() or a counter-only key
        const id = `log-${++logSeqRef.current}`;  // remove Date.now() to avoid any collision
        setDebugLog((p) => [...p.slice(-19), { id, text: `[${ts}] ${msg}`, ok, err }]);
    }, []);

    /* ─── Fetch Data ───────────────────────────────── */
    const fetchAll = useCallback(() => {
        setRefreshTick((t) => t + 1);
    }, []);

    useEffect(() => {
        let cancelled = false;
        loadCheckInData(eventId).then((result) => {
            if (cancelled) return;
            setStats(result.stats);
            setPendingList(result.pendingList);
            setCheckedInList(result.checkedInList);
        }).catch((e) => console.error("[CheckIn] fetchAll:", e));
        return () => { cancelled = true; };
    }, [eventId, refreshTick]);

    /* ─── Scanner Cleanup ──────────────────────────── */
    const destroyScanner = useCallback(async () => {
        const scanner = scannerRef.current;
        if (!scanner) return;
        try { if (scanner.isScanning) await scanner.stop(); } catch { }
        try { scanner.clear(); } catch { }
        scannerRef.current = null;
    }, []);
    useEffect(() => () => { destroyScanner(); }, [destroyScanner]);

    /* ─── Resume camera ────────────────────────────── */
    const resumeForNextScan = useCallback(() => {
        processingRef.current = false;
        setBooking(null);
        setResultMsg("");
        setScanState("ready");
        try { if (scannerRef.current) { scannerRef.current.resume(); } } catch { }
    }, []);

    /* ─── Admit one ticket (shared by scan + manual) ─ */
    const admitOne = useCallback(async (registrationId: string, onUpdate?: (b: BookingInfo) => void) => {
        if (admitting) return;
        setAdmitting(true);
        log("Admitting 1 ticket...");
        try {
            const res = await fetch(`${API_URL}/events/${eventId}/check-in/admit-one`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ registration_id: registrationId }),
            });
            const data = await res.json();
            if (data.success) {
                const updated: BookingInfo = data.registration;
                if (onUpdate) { onUpdate(updated); }
                log(`✓ ${updated.admitted_count}/${updated.ticket_count} admitted`, true);
                toast.success(`Ticket ${updated.admitted_count}/${updated.ticket_count} admitted`);
                fetchAll();

                if (updated.admitted_count >= updated.ticket_count) {
                    setResultMsg(`All ${updated.ticket_count} ticket(s) admitted for ${updated.user_name}`);
                    setResultOk(true);
                    setTimeout(() => {
                        setScanState("result_ok");
                        setBooking(null);
                        setManualBooking(null);
                        setTimeout(resumeForNextScan, 2000);
                    }, 600);
                }
            } else {
                log(`✗ ${data.message}`, false, true);
                toast.error(data.message);
            }
        } catch {
            log("Network error", false, true);
            toast.error("Network error");
        }
        setAdmitting(false);
    }, [admitting, eventId, fetchAll, log, resumeForNextScan]);

    /* ─── QR Scan Handler ──────────────────────────── */
    const handleScan = useCallback(async (qrData: string) => {
        if (processingRef.current) return;
        processingRef.current = true;
        setScanState("processing");
        log("QR decoded — looking up booking...");
        try { if (scannerRef.current) { scannerRef.current.pause(true); } } catch { }

        try {
            const res = await fetch(`${API_URL}/events/${eventId}/check-in/qr-lookup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ qr_data: qrData, method: "QR" }),
            });
            const data = await res.json();

            if (!data.success) {
                log(`✗ ${data.message}`, false, true);
                setResultMsg(data.message);
                setResultOk(false);
                setScanState("result_fail");
                processingRef.current = false;
                return;
            }

            const reg: BookingInfo = data.registration;
            log(`✓ Found: ${reg.user_name} (${reg.admitted_count}/${reg.ticket_count})`, true);

            if (reg.admitted_count >= reg.ticket_count) {
                setResultMsg(`All ${reg.ticket_count} ticket(s) for ${reg.user_name} already admitted.`);
                setResultOk(false);
                setScanState("result_fail");
                processingRef.current = false;
                return;
            }

            setBooking(reg);
            setScanState("booking_shown");
        } catch {
            log("Server error during QR lookup", false, true);
            setResultMsg("Server error — try again");
            setResultOk(false);
            setScanState("result_fail");
            processingRef.current = false;
        }
    }, [eventId, log]);

    /* ─── Start Scanner ────────────────────────────── */
    const startScanner = useCallback(async () => {
        if (scanStateRef.current !== "idle") return;
        setCameraError(null);
        setBooking(null);
        setResultMsg("");
        processingRef.current = false;
        setScanState("starting");
        log("Starting camera...");

        await new Promise(r => setTimeout(r, 120));
        let el = document.getElementById(SCANNER_ID);
        if (!el) {
            for (let i = 0; i < 10; i++) {
                await new Promise(r => setTimeout(r, 100));
                el = document.getElementById(SCANNER_ID);
                if (el) break;
            }
        }
        if (!el) {
            setCameraError("Scanner element not found — try refreshing");
            setScanState("idle");
            return;
        }

        await destroyScanner();
        try {
            const scanner = new Html5Qrcode(SCANNER_ID);
            scannerRef.current = scanner;
            scanFramesRef.current.count = 0;
            scanFramesRef.current.lastLog = Date.now();

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 30,
                    qrbox: (w, h) => {
                        const s = Math.floor(Math.min(w, h) * 0.9);
                        return { width: s, height: s };
                    },
                    disableFlip: false,
                    aspectRatio: 1.0,
                },
                (decoded) => {
                    log("✅ QR DECODED", true);
                    handleScan(decoded);
                },
                () => {
                    const sf = scanFramesRef.current;
                    sf.count = sf.count + 1;
                    if (Date.now() - sf.lastLog > 2000) {
                        log(`Scanning... (${sf.count} frames, no QR yet)`);
                        sf.count = 0;
                        sf.lastLog = Date.now();
                    }
                }
            );
            log("Camera started ✓", true);
            setScanState("ready");
        } catch (err: any) {
            let msg = "Camera failed";
            if (err && err.message) { msg = err.message; }
            log("Camera error: " + msg, false, true);
            setCameraError(msg);
            setScanState("idle");
            await destroyScanner();
        }
    }, [destroyScanner, handleScan, log]);

    const stopScanner = useCallback(async () => {
        await destroyScanner();
        setScanState("idle");
        setBooking(null);
        processingRef.current = false;
    }, [destroyScanner]);

    /* ─── Manual Registration Lookup ──────────────── */
    const handleManualLookup = async () => {
        if (!manualRegId.trim()) return;
        setIsLoading(true);
        log(`Manual lookup: ${manualRegId.trim()}`);
        try {
            // First do a lookup to see booking details
            const res = await fetch(`${API_URL}/events/${eventId}/check-in/pending?limit=1000`, {
                credentials: "include",
            });
            // Just use admit-one directly which returns updated registration
            const admitRes = await fetch(`${API_URL}/events/${eventId}/check-in/admit-one`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ registration_id: manualRegId.trim() }),
            });
            const data = await admitRes.json();
            if (data.success) {
                const reg: BookingInfo = data.registration;
                setManualBooking(reg);
                log(`✓ ${reg.user_name} — ${reg.admitted_count}/${reg.ticket_count}`, true);
                toast.success(`Admitted 1 ticket for ${reg.user_name}`);
                fetchAll();
                setManualRegId("");
            } else {
                log(`✗ ${data.message}`, false, true);
                toast.error(data.message);
            }
        } catch {
            toast.error("Network error");
        }
        setIsLoading(false);
    };

    /* ─── Bulk / Admit All ─────────────────────────── */
    const handleBulkCheckIn = async () => {
        if (selectedIds.size === 0) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/events/${eventId}/check-in/bulk`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ registration_ids: Array.from(selectedIds), method: "BULK" }),
            });
            const result = await res.json();
            const summary = result.summary;
            let admitted = 0;
            let total = 0;
            if (summary) {
                admitted = summary.admitted;
                total = summary.total;
            }
            toast.success(`Admitted ${admitted} of ${total}`);
            setSelectedIds(new Set());
            fetchAll();
        } catch {
            toast.error("Bulk check-in failed");
        }
        setIsLoading(false);
    };

    const handleAdmitAll = async () => {
        if (!confirm(`Admit all ${stats?.pending ?? 0} pending attendees?`)) return;
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/events/${eventId}/check-in/admit-all`, {
                method: "POST", credentials: "include",
            });
            const result = await res.json();
            let admittedCount = 0;
            if (result.summary) { admittedCount = result.summary.admitted; }
            toast.success(`Admitted ${admittedCount}`);
            fetchAll();
        } catch {
            toast.error("Failed");
        }
        setIsLoading(false);
    };

    /* ─── Selection ────────────────────────────────── */
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const n = new Set(prev);
            n.has(id) ? n.delete(id) : n.add(id);
            return n;
        });
    };
    const toggleAll = () => setSelectedIds(
        selectedIds.size === pendingList.length && pendingList.length > 0
            ? new Set()
            : new Set(pendingList.map(r => r.registration_id))
    );

    /* ─── Helpers ──────────────────────────────────── */
    const scannerVisible = scanState !== "idle";
    const isProcessing = scanState === "processing" || scanState === "starting";
    const remaining = booking ? booking.ticket_count - booking.admitted_count : 0;
    const manualRemaining = manualBooking ? manualBooking.ticket_count - manualBooking.admitted_count : 0;

    /* ─── Render ───────────────────────────────────── */
    return (
        <div className="space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Bookings", value: stats?.total ?? 0, color: "" },
                    { label: "Checked In", value: stats?.checkedIn ?? 0, color: "text-green-500" },
                    { label: "Pending", value: stats?.pending ?? 0, color: "text-yellow-500" },
                    { label: "Progress", value: `${stats?.percentage ?? 0}%`, color: "", progress: stats?.percentage },
                ].map((s) => (
                    <Card key={s.label}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xs text-muted-foreground">{s.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
                            {s.progress !== undefined && <Progress value={s.progress} className="mt-2 h-2" />}
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── QR Scanner Card ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ScanLine className="h-5 w-5" /> QR Scanner
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">

                        {!scannerVisible ? (
                            <Button onClick={startScanner} className="w-full gap-2" size="lg">
                                <Camera className="h-5 w-5" /> Start Scanner
                            </Button>
                        ) : (
                            <>
                                {/* Camera viewport — hidden when booking card is shown */}
                                <div className="relative bg-black rounded-xl overflow-hidden" style={{ minHeight: 300 }}>
                                    <div
                                        id={SCANNER_ID}
                                        className="w-full"
                                        style={{
                                            minHeight: 300,
                                            display: scanState === "booking_shown" ? "none" : "block",
                                        }}
                                    />

                                    {/* Booking card — shown after QR match */}
                                    {scanState === "booking_shown" && booking && (
                                        <BookingCard
                                            booking={booking}
                                            admitting={admitting}
                                            onAdmit={() => admitOne(booking.registration_id, (b) => setBooking(b))}
                                            onCancel={resumeForNextScan}
                                        />
                                    )}

                                    {/* Overlays */}
                                    {isProcessing && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-white" />
                                            <p className="text-white text-sm font-medium">
                                                {scanState === "starting" ? "Starting camera…" : "Looking up booking…"}
                                            </p>
                                        </div>
                                    )}
                                    {scanState === "ready" && (
                                        <div className="absolute top-3 inset-x-0 flex justify-center pointer-events-none">
                                            <span className="bg-green-600/80 backdrop-blur text-white text-xs px-3 py-1.5 rounded-full font-medium">
                                                🟢 Ready — aim QR at camera
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Camera error */}
                                {cameraError && (
                                    <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                                        <div><p className="font-medium">Camera Error</p><p>{cameraError}</p></div>
                                    </div>
                                )}

                                {/* Result states */}
                                {scanState === "result_ok" && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-300 rounded-lg text-green-700 text-sm font-medium">
                                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                                        {resultMsg} — scanning next…
                                    </div>
                                )}
                                {scanState === "result_fail" && (
                                    <div className="space-y-2">
                                        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                            <XCircle className="h-5 w-5 shrink-0" />
                                            {resultMsg}
                                        </div>
                                        <Button variant="outline" className="w-full gap-2" onClick={resumeForNextScan}>
                                            <Camera className="h-4 w-4" /> Scan Next
                                        </Button>
                                    </div>
                                )}

                                <Button onClick={stopScanner} variant="outline" className="w-full">
                                    Stop Scanner
                                </Button>
                            </>
                        )}

                        {/* Debug log */}
                        {debugLog.length > 0 && (
                            <div className="bg-gray-950 rounded-lg p-2 text-xs font-mono max-h-36 overflow-auto space-y-px">
                                {debugLog.map((l) => (
                                    <div key={l.id} className={cn(
                                        "leading-relaxed",
                                        l.err ? "text-red-400" :
                                            l.ok ? "text-green-400" :
                                                "text-gray-400"
                                    )}>{l.text}</div>
                                ))}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-card px-2 text-muted-foreground">Manual entry</span>
                            </div>
                        </div>

                        {/* Manual lookup */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Registration ID"
                                value={manualRegId}
                                onChange={e => setManualRegId(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handleManualLookup()}
                            />
                            <Button
                                onClick={handleManualLookup}
                                disabled={isLoading || !manualRegId.trim()}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Admit 1"}
                            </Button>
                        </div>

                        {/* Manual booking card — shows after manual admit */}
                        {manualBooking && manualBooking.admitted_count < manualBooking.ticket_count && (
                            <BookingCard
                                booking={manualBooking}
                                admitting={admitting}
                                onAdmit={() => admitOne(manualBooking.registration_id, (b) => setManualBooking(b))}
                                onCancel={() => setManualBooking(null)}
                                label={`${manualRemaining} more ticket(s) remaining`}
                            />
                        )}
                        {manualBooking && manualBooking.admitted_count >= manualBooking.ticket_count && (
                            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-300 rounded-lg">
                                <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                    <CheckCircle2 className="h-4 w-4" />
                                    All {manualBooking.ticket_count} tickets admitted for {manualBooking.user_name}
                                </div>
                                <button onClick={() => setManualBooking(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* ── Quick Actions Card ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" /> Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button
                            onClick={handleAdmitAll}
                            disabled={isLoading || (stats?.pending ?? 0) === 0}
                            className="w-full gap-2"
                        >
                            <UserCheck className="h-4 w-4" />
                            Admit All Pending ({stats?.pending ?? 0})
                        </Button>
                        <Button
                            onClick={handleBulkCheckIn}
                            disabled={isLoading || selectedIds.size === 0}
                            variant="outline"
                            className="w-full gap-2"
                        >
                            <CheckSquare className="h-4 w-4" />
                            Admit Selected ({selectedIds.size})
                        </Button>
                        <Button onClick={fetchAll} variant="ghost" size="sm" className="w-full gap-2">
                            <RefreshCw className="h-4 w-4" /> Refresh Lists
                        </Button>

                        {/* Legend */}
                        <div className="pt-2 border-t space-y-1.5 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">How per-ticket check-in works:</p>
                            <p>1. Scan QR → booking card appears</p>
                            <p>2. Tap <strong>Admit 1 Ticket</strong> per person entering</p>
                            <p>3. Late arrivals scan same QR — shows remaining tickets</p>
                            <p>4. When all tickets used → auto-scans next</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Pending List ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <UserX className="h-5 w-5" /> Pending ({pendingList.length})
                        </span>
                        <Button variant="outline" size="sm" onClick={toggleAll}>
                            {selectedIds.size === pendingList.length && pendingList.length > 0
                                ? "Deselect All"
                                : "Select All"}
                        </Button>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-10 pl-4" />
                                <TableHead>Name</TableHead>
                                <TableHead>Tickets</TableHead>
                                <TableHead>Tier</TableHead>
                                <TableHead className="text-right pr-4">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pendingList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                        No pending registrations
                                    </TableCell>
                                </TableRow>
                            ) : pendingList.map(reg => (
                                <TableRow
                                    key={reg.registration_id}
                                    className={cn(selectedIds.has(reg.registration_id) && "bg-muted/40")}
                                >
                                    <TableCell className="pl-4">
                                        <button onClick={() => toggleSelection(reg.registration_id)}>
                                            {selectedIds.has(reg.registration_id)
                                                ? <CheckSquare className="h-4 w-4 text-primary" />
                                                : <Square className="h-4 w-4 text-muted-foreground" />}
                                        </button>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-medium">{reg.user_name}</p>
                                        <p className="text-xs text-muted-foreground">{reg.user_mobile_no || reg.user_email}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Ticket className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span>{reg.ticket_count}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {reg.tier_name
                                            ? <Badge variant="outline" className="text-xs">{reg.tier_name}</Badge>
                                            : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1 text-xs h-7"
                                            onClick={async () => {
                                                const admitRes = await fetch(`${API_URL}/events/${eventId}/check-in/admit-one`, {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    credentials: "include",
                                                    body: JSON.stringify({ registration_id: reg.registration_id }),
                                                });
                                                const data = await admitRes.json();
                                                if (data.success) {
                                                    const b: BookingInfo = data.registration;
                                                    setManualBooking(b);
                                                    toast.success(`Admitted 1/${b.ticket_count} for ${reg.user_name}`);
                                                    fetchAll();
                                                } else {
                                                    toast.error(data.message);
                                                }
                                            }}
                                        >
                                            <UserCheck className="h-3.5 w-3.5" /> Admit 1
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* ── Checked-In List ── */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-green-500" />
                        Checked In ({checkedInList.length})
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="pl-4">Name</TableHead>
                                <TableHead>Tickets</TableHead>
                                <TableHead>Admitted</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {checkedInList.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-10">
                                        No check-ins yet
                                    </TableCell>
                                </TableRow>
                            ) : checkedInList.map(reg => (
                                <TableRow key={reg.registration_id}>
                                    <TableCell className="pl-4">
                                        <p className="font-medium">{reg.user_name}</p>
                                        <p className="text-xs text-muted-foreground">{reg.user_mobile_no || reg.user_email}</p>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1">
                                            <Ticket className="h-3.5 w-3.5 text-green-500" />
                                            {reg.ticket_count}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {reg.admitted_count !== undefined
                                            ? <span className={cn(
                                                "text-sm font-medium",
                                                reg.admitted_count >= reg.ticket_count ? "text-green-600" : "text-yellow-600"
                                            )}>
                                                {reg.admitted_count}/{reg.ticket_count}
                                            </span>
                                            : "—"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {reg.check_in_time
                                                ? new Date(reg.check_in_time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                                                : "—"}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

/* ─── BookingCard sub-component ───────────────────── */
function BookingCard({
    booking,
    admitting,
    onAdmit,
    onCancel,
    label,
}: {
    booking: BookingInfo;
    admitting: boolean;
    onAdmit: () => void;
    onCancel: () => void;
    label?: string;
}) {
    const remaining = booking.ticket_count - booking.admitted_count;
    const allDone = remaining <= 0;

    return (
        <div className="rounded-xl border bg-card p-4 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <p className="font-bold text-lg leading-tight">{booking.user_name}</p>
                    {booking.user_mobile_no && (
                        <p className="text-sm text-muted-foreground">{booking.user_mobile_no}</p>
                    )}
                    {booking.tier_name && (
                        <Badge variant="outline" className="mt-1 text-xs">{booking.tier_name}</Badge>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-3xl font-black tabular-nums leading-none">
                        {booking.admitted_count}
                        <span className="text-muted-foreground font-normal text-xl">/{booking.ticket_count}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">tickets used</p>
                </div>
            </div>

            {/* Ticket slots */}
            <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${Math.min(booking.ticket_count, 5)}, 1fr)` }}
            >
                {Array.from({ length: booking.ticket_count }).map((_, i) => {
                    const admitted = i < booking.admitted_count;
                    return (
                        <div
                            key={i}
                            className={cn(
                                "rounded-lg border p-2 flex flex-col items-center gap-1 transition-all",
                                admitted
                                    ? "bg-green-50 border-green-300 dark:bg-green-950 dark:border-green-700"
                                    : "bg-muted border-muted-foreground/20"
                            )}
                        >
                            <Ticket className={cn("h-5 w-5", admitted ? "text-green-600" : "text-muted-foreground")} />
                            <span className={cn("text-xs font-medium", admitted ? "text-green-600" : "text-muted-foreground")}>
                                {admitted ? "In" : "Out"}
                            </span>
                        </div>
                    );
                })}
            </div>

            {label && <p className="text-xs text-muted-foreground text-center">{label}</p>}

            {/* Actions */}
            {!allDone ? (
                <div className="flex gap-2">
                    <Button
                        className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white"
                        onClick={onAdmit}
                        disabled={admitting}
                    >
                        {admitting
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <CheckCircle2 className="h-4 w-4" />}
                        Admit 1 Ticket
                        {remaining > 1 && (
                            <span className="opacity-70 text-xs">({remaining} remaining)</span>
                        )}
                    </Button>
                    <Button variant="outline" size="icon" onClick={onCancel}>✕</Button>
                </div>
            ) : (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-300 dark:border-green-700 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                    <span className="text-green-700 dark:text-green-400 text-sm font-medium">
                        All {booking.ticket_count} tickets admitted
                    </span>
                </div>
            )}
        </div>
    );
}
