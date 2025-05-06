import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { TableBody, TableCell } from "@/components/ui/table";
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UsageGraph } from "@/components/usage/UsageGraph";
import { api } from "@/lib/api";
import { callServerPromise } from "@/lib/call-server-promise";
import { getDuration } from "@/lib/get-relative-time";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CreditCard,
  ExternalLink,
  Grid2X2,
  Wallet,
} from "lucide-react";
import { type ReactNode, Suspense, memo, useMemo } from "react";
import { useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

export const Route = createFileRoute("/usage")({
  component: RouteComponent,
});

function RouteComponent() {
  const [viewMode, setViewMode] = useState<"graph" | "grid">("graph");
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["platform", "invoices"],
  });

  const { data: sub } = useQuery<Subscription>({
    queryKey: ["platform", "plan"],
  });

  // const { data: userSettings } = useQuery<{
  //   credit?: number;
  // }>({
  //   queryKey: ["platform", "user-settings"],
  // });

  const currnetGPUCredit = sub?.plans?.autumn_data?.entitlements?.find(
    (x) => x.feature_id === "gpu-credit",
  );

  const used = currnetGPUCredit?.used ?? 0;
  const balance = currnetGPUCredit?.balance ?? 0;
  const credit = (balance || 0) + (used || 0);

  // console.log(currnetGPUCredit);

  // Get current period from the last invoice timestamp in current plan
  const currentPeriod = useMemo(() => {
    if (!sub?.plans?.last_invoice_timestamp) return null;
    const start = new Date(sub.plans.last_invoice_timestamp * 1000);
    const end = new Date();
    return {
      id: "current",
      label: `Current Period (${start.toLocaleDateString()} - ${end.toLocaleDateString()})`,
      start,
      end,
      period_start: start.toLocaleDateString(),
      period_end: end.toLocaleDateString(),
      period_start_timestamp: sub.plans.last_invoice_timestamp,
      period_end_timestamp: Math.floor(end.getTime() / 1000),
    };
  }, [sub]);

  console.log(sub);

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(
    "current",
  );

  // Get selected invoice data
  const selectedInvoice = useMemo<Invoice | CurrentPeriod | null>(() => {
    if (!selectedPeriod) return currentPeriod;
    if (selectedPeriod === "current") return currentPeriod;
    if (!invoices?.length) return currentPeriod;
    return invoices.find((inv) => inv.id === selectedPeriod) || currentPeriod;
  }, [selectedPeriod, invoices, currentPeriod]);

  // Get usage data for current period
  const { data: usage } = useQuery<Usage>({
    queryKey: ["platform", "usage"],
    queryKeyHashFn: (queryKey) =>
      [
        ...queryKey,
        selectedInvoice?.period_start_timestamp,
        selectedInvoice?.period_end_timestamp,
      ].toString(),
    meta: {
      params: {
        start_time: selectedInvoice?.period_start_timestamp
          ? new Date(
              selectedInvoice.period_start_timestamp * 1000,
            ).toISOString()
          : undefined,
        end_time: selectedInvoice?.period_end_timestamp
          ? new Date(selectedInvoice.period_end_timestamp * 1000).toISOString()
          : undefined,
      },
    },
  });

  const handlePeriodChange = (direction: "prev" | "next") => {
    if (!selectedPeriod) return;
    if (!invoices?.length) return;

    console.log("Current period:", selectedPeriod);
    console.log("Direction:", direction);
    console.log("Invoices:", invoices);

    // When on current period, only allow going back to most recent invoice
    if (selectedPeriod === "current") {
      if (direction === "prev" && invoices.length > 0) {
        console.log(
          "Moving from current to most recent invoice:",
          invoices[0].id,
        );
        setSelectedPeriod(invoices[0].id);
      }
      return;
    }

    // Find current position in invoice list
    const currentIndex = invoices.findIndex((inv) => inv.id === selectedPeriod);
    console.log("Current index in invoices:", currentIndex);

    if (currentIndex === -1) return;

    // Handle navigation
    if (direction === "prev") {
      // Go to older invoice if available
      if (currentIndex < invoices.length - 1) {
        console.log("Moving to older invoice:", invoices[currentIndex + 1].id);
        setSelectedPeriod(invoices[currentIndex + 1].id);
      }
    } else {
      // Going next (to newer invoices)
      if (currentIndex === 0) {
        // At most recent invoice, go to current period
        console.log("Moving to current period");
        setSelectedPeriod("current");
      } else {
        // Go to newer invoice
        console.log("Moving to newer invoice:", invoices[currentIndex - 1].id);
        setSelectedPeriod(invoices[currentIndex - 1].id);
      }
    }
  };

  const is_displaying_invoice = isInvoice(selectedInvoice);
  // console.log(selectedInvoice);

  return (
    <div className="bg-white py-4 w-full">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* <Alert variant="warning" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Under Maintenance</AlertTitle>
          <AlertDescription>
            The usage page is currently under maintenance. Some features may be
            temporarily unavailable. We apologize for any inconvenience.
          </AlertDescription>
        </Alert> */}
        {/* <Suspense> */}
        <UnpaidInvoices />
        {/* </Suspense> */}
        {/* Top row with plan, credit and date selection */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left - Plan badges and Credit */}
          <div className="flex flex-wrap items-center gap-2">
            {sub?.plans?.plans?.map(
              (x: keyof typeof pricingPlanNameMapping, i: number) => {
                const charges = sub.plans?.charges?.[i];
                const amount = sub.plans?.amount?.[i];
                console.log(sub.plans?.charges, i);
                return (
                  <Badge
                    key={i}
                    variant="fuchsia"
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <Link
                      to="/pricing"
                      className="flex items-center gap-1 text-sm"
                    >
                      {pricingPlanNameMapping[x]} Plan
                      {charges !== undefined &&
                      amount !== undefined &&
                      charges !== amount ? (
                        <span className="ml-1">
                          (
                          <span className="text-muted-foreground line-through">
                            ${(amount ?? 0) / 100}
                          </span>{" "}
                          ${(charges ?? 0) / 100}/{" "}
                          {sub.plans?.plans[0].split("_")[1]})
                        </span>
                      ) : (
                        <span className="ml-1">
                          (${(amount ?? 0) / 100}/
                          {sub.plans?.plans[0].split("_")[1]})
                        </span>
                      )}
                      <ExternalLink size={12} className="ml-1" />
                    </Link>
                  </Badge>
                );
              },
            )}
            {/* <div className="mx-2 hidden h-4 w-[1px] bg-border sm:block" />
            <Badge
              variant="green"
              className="flex items-center gap-1.5 text-sm"
            >
              <Wallet className="h-3.5 w-3.5" />
              Credit: ${(userSettings?.credit ?? 0).toFixed(3)}
            </Badge> */}
          </div>

          {/* Right - Date selection */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handlePeriodChange("prev")}
              disabled={
                !selectedPeriod ||
                (selectedPeriod !== "current" &&
                  invoices &&
                  invoices.findIndex((inv) => inv.id === selectedPeriod) ===
                    invoices.length - 1)
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Select
              value={selectedPeriod ?? undefined}
              onValueChange={(value) => setSelectedPeriod(value)}
            >
              <SelectTrigger className="w-[200px] sm:w-[260px]">
                <SelectValue placeholder="Select billing period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current" className="font-medium">
                  Current Period
                  <span className="ml-2 text-muted-foreground">
                    ({currentPeriod?.period_start} - {currentPeriod?.period_end}
                    )
                  </span>
                </SelectItem>
                <div className="px-2 py-1.5 text-muted-foreground text-xs">
                  Past Periods
                </div>
                {invoices?.map((invoice) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.period_start} - {invoice.period_end}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handlePeriodChange("next")}
              disabled={selectedPeriod === "current"}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Total Summary Card */}
        <div className="mb-6 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Usage</div>
              <div className="font-semibold text-2xl">
                $
                {is_displaying_invoice
                  ? usage?.total_cost?.toFixed(4)
                  : ((used / 100)?.toFixed(4) ?? "0.00")}
              </div>
            </div>
            {!is_displaying_invoice && (
              <div>
                <div className="text-sm text-muted-foreground">
                  Credit Balance
                </div>
                <div className="font-semibold mt-1 text-2xl text-green-600">
                  ${(credit / 100).toFixed(4)}
                </div>
              </div>
            )}
            <div>
              <div className="text-muted-foreground text-sm">Final Usage</div>
              <div className="mt-1 text-2xl font-semibold">
                $
                {is_displaying_invoice
                  ? usage?.final_cost?.toFixed(4)
                  : (Math.max(0, -(credit - used)) / 100).toFixed(4)}
              </div>
            </div>
          </div>
        </div>
        {/* Graph/Table section */}
        <div className="relative mt-8">
          {/* View toggle centered on top */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 z-10">
            <div className="flex rounded-md border bg-background shadow-sm">
              <Button
                variant={viewMode === "graph" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("graph")}
              >
                <BarChart2 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid2X2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Graph/Table content */}
          <Suspense fallback={<Skeleton className="h-[400px]" />}>
            {viewMode === "graph" ? (
              <UsageBreakdownMemo
                startTimeOverride={selectedInvoice?.period_start_timestamp}
                endTimeOverride={selectedInvoice?.period_end_timestamp}
              />
            ) : (
              <UsageTable
                startTimeOverride={
                  selectedInvoice
                    ? new Date(selectedInvoice.period_start_timestamp * 1000)
                    : undefined
                }
                endTimeOverride={
                  selectedInvoice
                    ? new Date(selectedInvoice.period_end_timestamp * 1000)
                    : undefined
                }
              />
            )}
          </Suspense>

          {selectedInvoice && (
            <div className="mt-8">
              <InvoiceDetails invoice={selectedInvoice} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function UsageBreakdown({
  startTimeOverride,
  endTimeOverride,
}: {
  startTimeOverride?: number;
  endTimeOverride?: number;
}) {
  const { startDate, endDate } = useMemo(() => {
    if (startTimeOverride && endTimeOverride) {
      return {
        startDate: new Date(startTimeOverride * 1000).toISOString(),
        endDate: new Date(endTimeOverride * 1000).toISOString(),
      };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 180);
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }, [startTimeOverride, endTimeOverride]);

  const { data: usageInfo } = useSuspenseQuery<any>({
    queryKey: ["platform", "usage-details"],
    queryKeyHashFn: (queryKey) =>
      [...queryKey, startDate.split("T")[0], endDate.split("T")[0]].toString(),
    meta: {
      params: {
        start_time: startDate,
        end_time: endDate,
      },
    },
  });
  return <UsageGraph chartData={usageInfo} />;
}

const UsageBreakdownMemo = memo(UsageBreakdown);

function Credit() {
  const { data: userSettings, isLoading } = useSuspenseQuery<any>({
    queryKey: ["platform", "user-settings"],
  });

  const credit = userSettings?.credit ?? 0;

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap justify-between gap-2">
        <Badge>Usage Credit</Badge>
        <div className="flex gap-2">
          {credit > 0 && "$ "}
          {credit.toFixed(3)}
        </div>
      </div>
    </Card>
  );
}

export function DevelopmentOnly(props: { children: ReactNode }) {
  if (process.env.NODE_ENV === "development") return props.children;
  return <></>;
}

export function UsageTable(props: {
  startTimeOverride?: Date;
  endTimeOverride?: Date;
}) {
  const { data: usage } = useSuspenseQuery<any>({
    queryKey: ["platform", "usage"],
    queryKeyHashFn: (queryKey) =>
      [
        ...queryKey,
        props.startTimeOverride?.toISOString(),
        props.endTimeOverride?.toISOString(),
      ].toString(),
    meta: {
      params: {
        start_time: props.startTimeOverride?.toISOString(),
        end_time: props.endTimeOverride?.toISOString(),
      },
    },
  });

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex flex-col gap-2">
        {/* <DevelopmentOnly>
          <SimulateChargeButton />
        </DevelopmentOnly> */}
        <ScrollArea>
          <Table className="">
            <TableHeader className="bg-background top-0 sticky">
              <TableRow>
                <TableHead>Machine</TableHead>
                <TableHead>GPU</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usage.usage.length > 0 ? (
                <>
                  {usage.usage.map((x) => (
                    <TableRow key={x.machine_id}>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger>
                            {x.cost_item_title ? (
                              <Badge>{x.cost_item_title}</Badge>
                            ) : (
                              <Link
                                className="hover:underline"
                                href={"/machines/" + x.machine_id}
                              >
                                {x.machine_name}{" "}
                                {x.ws_gpu && <Badge>Workspace</Badge>}
                              </Link>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div> {x.machine_id}</div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{x.gpu || x.ws_gpu}</TableCell>
                      <TableCell>
                        {x.cost_item_title ? (
                          <></>
                        ) : (
                          getDuration(x.usage_in_sec)
                        )}
                      </TableCell>
                      <TableCell>$ {x.cost.toFixed(4)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold text-right">
                      Total Estimated Usage:
                    </TableCell>
                    <TableCell className="font-bold">
                      $ {usage.total_cost.toFixed(4)}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <div className="p-4">No usage</div>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </div>
    </Card>
  );
}

export const pricingPlanNameMapping = {
  ws_basic: "Workspace Basic",
  ws_pro: "Workspace Pro",
  pro: "API Pro (Early Adopter)",
  creator: "API Creator (Early Adopter)",
  business: "API Business",
  basic: "API Basic",
} as const;

export function InvoiceItem({
  invoice,
  children,
}: {
  invoice: Invoice;
  children: React.ReactNode;
}) {
  if (!isInvoice(invoice)) {
    return null;
  }

  const [isExpanded, setIsExpanded] = useState(false);

  const handleViewInvoice = () => {
    if (invoice.hosted_invoice_url) {
      window.open(invoice.hosted_invoice_url, "_blank");
    }
  };

  const getStatusBadge = () => {
    switch (invoice.status) {
      case "paid":
        return <Badge variant="success">Paid</Badge>;
      case "open":
        return <Badge variant="outline">Unpaid</Badge>;
      case "uncollectible":
        return <Badge variant="destructive">Failed</Badge>;
      case "void":
        return <Badge variant="secondary">Void</Badge>;
      default:
        return <Badge variant="secondary">{invoice.status}</Badge>;
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center w-full">
        <button
          type="button"
          className="flex items-center gap-2"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>
            {invoice.period_start} - {invoice.period_end}
          </span>
          <span className="transition-transform duration-300 ease-in-out transform">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </button>
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          {invoice.hosted_invoice_url && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleViewInvoice}
                >
                  <ExternalLink size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {invoice.status === "open"
                  ? "View & Pay Invoice"
                  : "View or Download Invoice"}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded
            ? "max-h-[1000px] opacity-100 mt-4"
            : "max-h-0 opacity-0 mt-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

// Type guard to check if an object is an Invoice
function isInvoice(obj: any): obj is Invoice {
  return obj && "line_items" in obj && "subtotal" in obj;
}

interface Invoice {
  id: string;
  period_start: string;
  period_end: string;
  subtotal: number;
  total: number;
  total_cost?: number;
  period_start_timestamp: number;
  period_end_timestamp: number;
  line_items: Array<{
    description: string;
    amount: number;
    quantity?: number;
  }>;
  hosted_invoice_url?: string;
  status?: string;
}

interface Subscription {
  sub: {
    last_invoice_timestamp: number;
  };
  plans?: {
    plans: Array<keyof typeof pricingPlanNameMapping>;
    charges?: number[];
    amount?: number[];
    last_invoice_timestamp: number;
  };
}

function InvoiceDetails({ invoice }: { invoice: Invoice | CurrentPeriod }) {
  if (!isInvoice(invoice)) {
    return null;
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="bg-muted/50 p-4 rounded-md border border-border/50">
        <h3 className="text-sm font-medium mb-3">Invoice Breakdown</h3>
        <ul className="space-y-1.5 text-muted-foreground">
          {invoice.line_items.map((item, index) => (
            <li
              key={item.description || index}
              className="flex justify-between"
            >
              <span>{item.description}</span>
              <span>
                ${item.amount.toFixed(2)}
                {item.quantity && item.quantity > 1
                  ? ` (x${item.quantity})`
                  : ""}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>${invoice.subtotal.toFixed(2)}</span>
          </div>
          {invoice.subtotal > invoice.total && (
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-${(invoice.subtotal - invoice.total).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-medium text-foreground">
            <span>Total Due</span>
            <span>${invoice.total.toFixed(2)}</span>
          </div>
        </div>
        {invoice.hosted_invoice_url && (
          <div className="flex justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(invoice.hosted_invoice_url, "_blank")}
              className="text-xs"
            >
              <ExternalLink className="mr-2 h-3 w-3" />
              View Invoice
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function UnpaidInvoices() {
  const { data: invoices } = useQuery<Invoice[]>({
    queryKey: ["platform", "invoices"],
  });

  const unpaidInvoices = useMemo(
    () =>
      invoices?.filter((invoice: Invoice) => invoice.status === "open") ?? [],
    [invoices],
  );

  if (unpaidInvoices.length === 0) return null;

  return (
    <Card className="mb-6 w-full max-w-[800px] p-4">
      <Alert variant="destructive" className="bg-destructive/5 border-none">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unpaid Invoices</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-2">
            {unpaidInvoices.map((invoice: Invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between text-sm"
              >
                <span>
                  {invoice.period_start} - {invoice.period_end}
                </span>
                <div className="flex items-center gap-2">
                  <span>${invoice.total.toFixed(2)}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() =>
                      window.open(invoice.hosted_invoice_url, "_blank")
                    }
                  >
                    Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </AlertDescription>
      </Alert>
    </Card>
  );
}

interface CurrentPeriod {
  id: string;
  label: string;
  start: Date;
  end: Date;
  period_start: string;
  period_end: string;
  period_start_timestamp: number;
  period_end_timestamp: number;
  total_cost?: number;
  total?: number;
}

interface Usage {
  total_cost: number;
  final_cost: number;
  usage: Array<{
    machine_id: string;
    machine_name: string;
    cost: number;
    gpu?: string;
    ws_gpu?: string;
    usage_in_sec: number;
    cost_item_title?: string;
  }>;
  credit?: number;
  free_tier_credit: number;
}
