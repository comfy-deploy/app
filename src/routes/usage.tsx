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
  ExternalLink,
  Grid2X2,
  CreditCard,
  Wallet,
} from "lucide-react";
import { type ReactNode, Suspense, memo, useMemo } from "react";
import { useState } from "react";

export const Route = createFileRoute("/usage")({
  component: RouteComponent,
});

function RouteComponent() {
  const [viewMode, setViewMode] = useState<"graph" | "grid">("graph");
  const { data: invoices } = useSuspenseQuery<any>({
    queryKey: ["platform", "invoices"],
  });

  // Get current period from the first invoice
  const currentPeriod = useMemo(() => {
    if (!invoices || invoices.length === 0) return null;
    const latest = invoices[0];
    return {
      id: latest.id,
      label: `Current Period (${latest.period_start} - ${latest.period_end})`,
      start: new Date(latest.period_start_timestamp),
      end: new Date(latest.period_end_timestamp),
    };
  }, [invoices]);

  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(
    currentPeriod?.id ?? null,
  );

  // Get selected invoice data
  const selectedInvoice = useMemo(() => {
    if (!selectedPeriod || !invoices) return null;
    return invoices.find((inv: any) => inv.id === selectedPeriod);
  }, [selectedPeriod, invoices]);

  const handlePeriodChange = (direction: "prev" | "next") => {
    if (!invoices || !selectedPeriod) return;
    const currentIndex = invoices.findIndex((inv) => inv.id === selectedPeriod);
    if (currentIndex === -1) return;

    if (direction === "prev" && currentIndex < invoices.length - 1) {
      setSelectedPeriod(invoices[currentIndex + 1].id);
    } else if (direction === "next" && currentIndex > 0) {
      setSelectedPeriod(invoices[currentIndex - 1].id);
    }
  };

  const { data: sub } = useSuspenseQuery<any>({
    queryKey: ["platform", "plan"],
  });

  const { data: userSettings } = useSuspenseQuery<any>({
    queryKey: ["platform", "user-settings"],
  });

  return (
    <div className="bg-white py-4">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Suspense
          fallback={<Skeleton className="h-[28px] w-full max-w-[800px]" />}
        >
          <UnpaidInvoices />
        </Suspense>

        {/* Top row with plan, credit and date selection */}
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Left - Plan badges and Credit */}
          <div className="flex flex-wrap items-center gap-2">
            {sub?.plans?.plans.map((x, i) => (
              <Badge
                key={i}
                variant="fuchsia"
                className="flex items-center gap-1.5 text-sm"
              >
                <CreditCard className="h-3.5 w-3.5" />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await callServerPromise(
                      api({
                        url: `platform/stripe/dashboard?redirect_url=${encodeURIComponent(
                          window.location.href,
                        )}`,
                      }),
                      {
                        loadingText: "Redirecting to Stripe...",
                      },
                    );
                    window.open(res.url, "_blank");
                  }}
                  className="flex items-center gap-1 text-sm"
                >
                  {pricingPlanNameMapping[x]} Plan
                  {sub.plans.charges?.[i] !== undefined &&
                  sub.plans.amount?.[i] !== undefined &&
                  sub.plans.charges[i] !== sub.plans.amount[i] ? (
                    <span className="ml-1">
                      (
                      <span className="text-muted-foreground line-through">
                        ${(sub.plans.amount[i] ?? 0) / 100}
                      </span>{" "}
                      ${(sub.plans.charges[i] ?? 0) / 100}/mo)
                    </span>
                  ) : (
                    <span className="ml-1">
                      (${(sub.plans.amount[i] ?? 0) / 100}/mo)
                    </span>
                  )}
                  <ExternalLink size={12} className="ml-1" />
                </button>
              </Badge>
            ))}
            <div className="mx-2 hidden h-4 w-[1px] bg-border sm:block" />
            <Badge
              variant="green"
              className="flex items-center gap-1.5 text-sm"
            >
              <Wallet className="h-3.5 w-3.5" />
              Usage Credit: ${(userSettings?.credit ?? 0).toFixed(3)}
            </Badge>
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
                invoices?.findIndex((inv) => inv.id === selectedPeriod) ===
                  invoices?.length - 1
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
                {invoices?.map((invoice: any) => (
                  <SelectItem key={invoice.id} value={invoice.id}>
                    {invoice.period_start} - {invoice.period_end}
                    {invoice.id === currentPeriod?.id && " (Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => handlePeriodChange("next")}
              disabled={
                !selectedPeriod ||
                invoices?.findIndex((inv) => inv.id === selectedPeriod) === 0
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
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
                    ? new Date(selectedInvoice.period_start_timestamp)
                    : undefined
                }
                endTimeOverride={
                  selectedInvoice
                    ? new Date(selectedInvoice.period_end_timestamp)
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
        startDate: new Date(startTimeOverride * 1000)
          .toISOString()
          .split("T")[0],
        endDate: new Date(endTimeOverride * 1000).toISOString().split("T")[0],
      };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 180);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [startTimeOverride, endTimeOverride]);

  const { data: usageInfo } = useSuspenseQuery<any>({
    queryKey: ["platform", "usage-details"],
    queryKeyHashFn: (queryKey) => [...queryKey, startDate, endDate].toString(),
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

function GPUTotalChargeCard() {
  const { data: usage } = useSuspenseQuery<any>({
    queryKey: ["platform", "usage"],
  });

  return (
    <Card className="flex flex-col p-4 gap-2">
      <div className="text-sm">
        Showing period {new Date(usage.period.start).toLocaleDateString()} -{" "}
        {new Date(usage.period.end).toLocaleDateString()}
      </div>
      <ScrollArea>
        <Table>
          <TableHeader className="bg-background top-0 sticky">
            <TableRow>
              <TableHead>Machine</TableHead>
              <TableHead>GPU</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
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
                      <div>{x.machine_id}</div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>{x.gpu || x.ws_gpu}</TableCell>
                <TableCell>
                  {x.cost_item_title ? <></> : getDuration(x.usage_in_sec)}
                </TableCell>
                <TableCell>$ {x.cost.toFixed(4)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3} className="font-bold">
                Total GPU Compute:
              </TableCell>
              <TableCell className="font-bold">
                $ {usage.total_cost.toFixed(4)}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} className="font-bold">
                Plan Credit:
              </TableCell>
              <TableCell className="font-bold">
                - $ {usage.free_tier_credit / 100}
              </TableCell>
            </TableRow>
            {usage.credit > 0 && !Number.isNaN(usage.credit) && (
              <TableRow>
                <TableCell colSpan={3} className="font-bold">
                  Usage Credit:
                </TableCell>
                <TableCell className="font-bold">
                  - $ {usage.credit?.toFixed(3)}
                </TableCell>
              </TableRow>
            )}
            <TableRow>
              <TableCell colSpan={3} className="font-bold">
                Final Total:
              </TableCell>
              <TableCell className="font-bold">
                $ {usage.final_cost.toFixed(4)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ScrollArea>
    </Card>
  );
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
                      Total Usage:
                    </TableCell>
                    <TableCell className="font-bold">
                      $ {usage.total_cost.toFixed(4)}
                    </TableCell>
                  </TableRow>
                </>
              ) : (
                <div className="p-4">No usage in the last 30 days</div>
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

function PlanTotal() {
  const { data: sub } = useSuspenseQuery<any>({
    queryKey: ["platform", "plan"],
  });

  return (
    <>
      {sub ? (
        sub?.plans?.plans.map((x, i) => (
          <Card key={i} className="flex flex-col gap-2 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <Badge className="w-fit px-3 capitalize hover:underline">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await callServerPromise(
                      api({
                        url: `platform/stripe/dashboard?redirect_url=${encodeURIComponent(
                          window.location.href,
                        )}`,
                      }),
                      {
                        loadingText: "Redirecting to Stripe...",
                      },
                    );
                    window.open(res.url, "_blank");
                  }}
                  className="flex items-center gap-2"
                >
                  {pricingPlanNameMapping[x]} Plan
                  {sub.plans.charges?.[i] !== undefined &&
                  sub.plans.amount?.[i] !== undefined &&
                  sub.plans.charges[i] !== sub.plans.amount[i] ? (
                    <span className="ml-1">
                      (
                      <span className="text-muted-foreground line-through">
                        ${(sub.plans.amount[i] ?? 0) / 100}
                      </span>{" "}
                      ${(sub.plans.charges[i] ?? 0) / 100}/mo)
                    </span>
                  ) : (
                    <span className="ml-1">
                      (${(sub.plans.amount[i] ?? 0) / 100}/mo)
                    </span>
                  )}
                  <ExternalLink size={16} />
                </button>
              </Badge>
              <div className="flex gap-2">
                {sub.plans.charges?.[i] !== undefined &&
                sub.plans.amount?.[i] !== undefined &&
                sub.plans.charges[i] !== sub.plans.amount[i] ? (
                  <>
                    <span className="text-muted-foreground line-through">
                      ${(sub.plans.amount[i] ?? 0) / 100}
                    </span>
                    <span>${(sub.plans.charges[i] ?? 0) / 100}</span>
                  </>
                ) : (
                  `$${(sub.plans.amount[i] ?? 0) / 100}`
                )}
                {" / month"}
              </div>
            </div>
          </Card>
        ))
      ) : (
        <Card className="flex flex-col gap-2 p-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Badge className="w-fit px-3 capitalize">Free Plan</Badge>
            <div className="flex gap-2">$0 / month</div>
          </div>
        </Card>
      )}
    </>
  );
}

export function InvoiceTable() {
  const { data: invoices } = useSuspenseQuery<any>({
    queryKey: ["platform", "invoices"],
  });

  return (
    <div className="space-y-4 w-full">
      {invoices.map((invoice) => (
        <InvoiceItem key={invoice.id} invoice={invoice}>
          {/* <div className=""> */}
          <UsageTable
            startTimeOverride={new Date(invoice.period_start_timestamp)}
            endTimeOverride={new Date(invoice.period_end_timestamp)}
          />
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Invoice Breakdown:</h3>
            <ul className="list-disc list-inside">
              {invoice.line_items.map((item, index) => (
                <li key={index}>
                  {item.description}: ${item.amount.toFixed(2)}
                  {item.quantity && item.quantity > 1
                    ? ` (x${item.quantity})`
                    : ""}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${invoice.subtotal.toFixed(2)}</span>
            </div>
            {invoice.subtotal > invoice.total && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span>-${(invoice.subtotal - invoice.total).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold">
              <span>Total Due:</span>
              <span>${invoice.total.toFixed(2)}</span>
            </div>
          </div>
          {/* <div className="mt-4 text-right">
              <span className="font-semibold">Subscription Plan: </span>
              {planName}
            </div> */}
          {/* </div> */}
        </InvoiceItem>
      ))}
    </div>
  );
}

export function InvoiceItem({
  invoice,
  children,
}: { invoice: any; children: React.ReactNode }) {
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

function InvoiceDetails({ invoice }: { invoice: any }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="bg-muted/50 p-4 rounded-md border border-border/50">
        <h3 className="text-sm font-medium mb-3">Invoice Breakdown</h3>
        <ul className="space-y-1.5 text-muted-foreground">
          {invoice.line_items.map((item: any, index: number) => (
            <li key={item.description} className="flex justify-between">
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
  const { data: invoices } = useSuspenseQuery<any>({
    queryKey: ["platform", "invoices"],
  });

  const unpaidInvoices =
    invoices?.filter((invoice) => invoice.status === "open") ?? [];

  if (unpaidInvoices.length === 0) return null;

  return (
    <Card className="w-full max-w-[800px] p-4">
      <Alert variant="destructive" className="bg-destructive/5 border-none">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unpaid Invoices</AlertTitle>
        <AlertDescription>
          <div className="mt-2 space-y-2">
            {unpaidInvoices.map((invoice) => (
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
