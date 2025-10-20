"use client";

import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { format, isValid, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Clock } from "lucide-react";
import { http } from "@/libs/http";

type PatientInfo = {
    patient_id: string;
    first_name: string;
    last_name: string;
    gender: string;
    phone_number: string;
};

type OrderItem = {
    medicine_id: string;
    medicine_name: string;
    quantity: number;
};

type OrderResponse = {
    order_id: string;
    patient_id: string;
    patient_info?: PatientInfo | null;
    doctor_id?: string | null;
    total_amount: number;
    note?: string | null;
    submitted_at?: string | null;
    reviewed_at?: string | null;
    status: string;
    delivery_status?: string | null;
    delivery_at?: string | null;
    created_at: string;
    updated_at: string;
    order_items: OrderItem[];
};

type OrdersResponse = {
    orders: OrderResponse[];
    total: number;
};

type StatusFilter = "all" | "approved" | "rejected";

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
];

const parseDate = (value: string | null | undefined) => {
    if (!value) {
        return null;
    }

    try {
        const normalised = value.includes("T") ? value : value.replace(" ", "T");
        const parsed = parseISO(normalised);
        return isValid(parsed) ? parsed : null;
    } catch {
        return null;
    }
};

const formatDateTime = (value: string | null | undefined) => {
    const parsed = parseDate(value);
    return parsed ? format(parsed, "MMM d, yyyy 'at' HH:mm") : "-";
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: "THB",
        maximumFractionDigits: 2,
    }).format(Number.isFinite(value) ? value : 0);

const getPatientName = (order: OrderResponse) => {
    const first = order.patient_info?.first_name?.trim() ?? "";
    const last = order.patient_info?.last_name?.trim() ?? "";
    const full = `${first} ${last}`.trim();

    if (full) {
        return full;
    }

    if (order.patient_id) {
        return order.patient_id;
    }

    return "Unknown patient";
};

const getPatientGender = (order: OrderResponse) => {
    const gender = order.patient_info?.gender?.trim();
    if (!gender) {
        return "-";
    }
    const lower = gender.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

const getPatientInitials = (name: string) =>
    name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "PT";

export function PrescriptionHistory() {
    const [searchTerm, setSearchTerm] = useState("");
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    useEffect(() => {
        const controller = new AbortController();

        const fetchHistory = async () => {
            setLoading(true);
            setError(null);

            try {
                const { data } = await http.get<OrdersResponse>(
                    "/order/v1/orders/doctor/history",
                    {
                        signal: controller.signal,
                    }
                );

                const incoming = Array.isArray(data?.orders) ? data.orders : [];
                setOrders(incoming);
            } catch (err) {
                if (axios.isCancel(err)) {
                    return;
                }

                setError("We could not load prescription history. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();

        return () => controller.abort();
    }, []);

    const filteredOrders = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();

        return orders.filter((order) => {
            const normalisedStatus = (order.status ?? "").toLowerCase();
            if (statusFilter !== "all" && normalisedStatus !== statusFilter) {
                return false;
            }

            if (!term) {
                return true;
            }

            const name = getPatientName(order).toLowerCase();
            const orderId = order.order_id?.toLowerCase() ?? "";
            const patientId = order.patient_id?.toLowerCase() ?? "";

            return (
                name.includes(term) || orderId.includes(term) || patientId.includes(term)
            );
        });
    }, [orders, searchTerm, statusFilter]);

    return (
        <div className="space-y-6 p-8">
            <div>
                <h1 className="mb-2 text-3xl font-bold text-foreground">
                    Prescription History
                </h1>
                <p className="text-sm text-muted-foreground">
                    Review previously submitted prescriptions and their processing status.
                </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder="Search by patient or order ID..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        className="pl-10"
                        aria-label="Search prescription history"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {STATUS_OPTIONS.map((option) => {
                        const active = statusFilter === option.value;
                        return (
                            <Button
                                key={option.value}
                                variant={active ? "default" : "outline"}
                                size="sm"
                                onClick={() => setStatusFilter(option.value)}
                                className={active ? "shadow-sm" : ""}
                            >
                                {option.label}
                            </Button>
                        );
                    })}
                </div>
            </div>

            <div className="text-sm text-foreground/60">
                Total prescriptions: {orders.length.toLocaleString()}
            </div>

            {loading ? (
                <div className="rounded-lg border border-dashed border-muted-foreground/40 p-8 text-center text-sm text-muted-foreground">
                    Loading prescription history...
                </div>
            ) : error ? (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                    {error}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="rounded-lg border border-muted-foreground/40 p-8 text-center text-sm text-muted-foreground">
                    No prescriptions found
                    {searchTerm
                        ? " for the current search."
                        : statusFilter !== "all"
                        ? " for this status."
                        : "."}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const patientName = getPatientName(order);
                        const patientGender = getPatientGender(order);
                        const submittedAt = formatDateTime(order.submitted_at);
                        const reviewedAt = formatDateTime(order.reviewed_at);
                        const deliveryAt = formatDateTime(order.delivery_at);
                        const avatarSeed =
                            order.patient_info?.patient_id ||
                            order.patient_id ||
                            order.order_id;
                        const avatarUrl = avatarSeed
                            ? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                                  avatarSeed
                              )}&backgroundType=gradientLinear`
                            : undefined;
                        const orderItems = Array.isArray(order.order_items)
                            ? order.order_items
                            : [];

                        return (
                            <Card
                                key={order.order_id}
                                className="overflow-hidden border-0 shadow-sm"
                            >
                                <div className="bg-primary p-4 text-primary-foreground">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <Avatar className="h-12 w-12">
                                            {avatarUrl && (
                                                <AvatarImage
                                                    src={avatarUrl}
                                                    alt={patientName}
                                                />
                                            )}
                                            <AvatarFallback>
                                                {getPatientInitials(patientName)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-lg font-semibold">
                                                {patientName}
                                            </p>
                                            <p className="text-xs text-primary-foreground/80">
                                                Patient ID: {order.patient_id || "-"}
                                            </p>
                                            <p className="text-xs text-primary-foreground/70">
                                                Gender: {patientGender}
                                            </p>
                                        </div>
                                        <div className="ml-auto text-right text-xs sm:text-sm">
                                            <p>
                                                Status:{" "}
                                                <span className="font-semibold capitalize text-primary-foreground">
                                                    {order.status}
                                                </span>
                                            </p>
                                            {order.delivery_status && (
                                                <p className="text-primary-foreground/80">
                                                    Delivery status:{" "}
                                                    {order.delivery_status}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="space-y-4 p-6">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="rounded-lg border border-muted-foreground/20 bg-muted/40 p-4 text-sm">
                                            <p className="font-semibold text-foreground">
                                                Submitted
                                            </p>
                                            <p className="text-muted-foreground">
                                                {submittedAt}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-muted-foreground/20 bg-muted/40 p-4 text-sm">
                                            <p className="font-semibold text-foreground">
                                                Reviewed
                                            </p>
                                            <p className="text-muted-foreground">
                                                {reviewedAt}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-muted-foreground/20 bg-muted/40 p-4 text-sm">
                                            <p className="font-semibold text-foreground">
                                                Delivery
                                            </p>
                                            <p className="text-muted-foreground">
                                                {order.delivery_status
                                                    ? deliveryAt
                                                    : "Pending"}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border border-muted-foreground/20 bg-muted/40 p-4 text-sm">
                                            <p className="font-semibold text-foreground">
                                                Total amount
                                            </p>
                                            <p className="text-muted-foreground">
                                                {formatCurrency(order.total_amount)}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="mb-3 text-sm font-semibold text-foreground">
                                            Medications
                                        </p>
                                        <div className="space-y-3">
                                            {orderItems.map((item) => (
                                                <div
                                                    key={`${order.order_id}-${item.medicine_id}`}
                                                    className="flex items-center justify-between rounded-lg border border-muted-foreground/20 p-3 text-sm"
                                                >
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {item.medicine_name}
                                                        </p>
                                                        <p className="text-muted-foreground">
                                                            Medicine ID:{" "}
                                                            {item.medicine_id}
                                                        </p>
                                                    </div>
                                                    <p className="font-semibold text-foreground">
                                                        x{item.quantity.toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                            {orderItems.length === 0 && (
                                                <div className="rounded-lg border border-dashed border-muted-foreground/40 p-4 text-center text-sm text-muted-foreground">
                                                    No medications recorded for this
                                                    order.
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(order.note || order.delivery_status) && (
                                        <div className="rounded-lg border border-muted-foreground/20 bg-muted/40 p-4 text-sm">
                                            {order.note && (
                                                <p className="mb-2">
                                                    <span className="font-semibold text-foreground">
                                                        Doctor note:
                                                    </span>{" "}
                                                    <span className="text-muted-foreground">
                                                        {order.note}
                                                    </span>
                                                </p>
                                            )}
                                            {order.delivery_status && (
                                                <p>
                                                    <span className="font-semibold text-foreground">
                                                        Delivery status:
                                                    </span>{" "}
                                                    <span className="text-muted-foreground">
                                                        {order.delivery_status}
                                                    </span>
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {order.delivery_at && (
                                        <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                            <Clock className="mt-0.5 h-5 w-5 text-primary" />
                                            <div>
                                                <p className="font-semibold text-foreground">
                                                    Delivery scheduled
                                                </p>
                                                <p>{deliveryAt}</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
