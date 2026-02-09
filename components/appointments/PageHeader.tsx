import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateSummaryPopover } from "./DateSummaryPopover";
import { Appointment } from "./types";

interface PageHeaderProps {
  isDoctor: boolean;
  loadingUser: boolean;
  isRefreshing: boolean;
  showSelectedOnly: boolean;
  summaryDate: Date;
  summaryLabel: string;
  selectedBookedCount: number;
  selectedRemainingCount: number;
  selectedCompletedCount: number;
  completedSelectedAppointments: Appointment[];
  onRefresh: () => void;
  onSummaryDateChange: (date: Date) => void;
  onToggleShowSelected: () => void;
  onDownloadCompleted: () => void;
  children?: React.ReactNode;
}

export function PageHeader({
  isDoctor,
  loadingUser,
  isRefreshing,
  showSelectedOnly,
  summaryDate,
  summaryLabel,
  selectedBookedCount,
  selectedRemainingCount,
  selectedCompletedCount,
  completedSelectedAppointments,
  onRefresh,
  onSummaryDateChange,
  onToggleShowSelected,
  onDownloadCompleted,
  children,
}: PageHeaderProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6">
        <div>
          <CardTitle className="font-heading text-xl sm:text-2xl">
            {isDoctor ? "Patient Appointments" : "Appointments"}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isDoctor
              ? "Manage and update patient appointments."
              : "Review your upcoming and past appointments."}
          </CardDescription>
          {isDoctor && showSelectedOnly && (
            <Badge variant="outline" className="mt-2 w-fit">
              Showing selected date only
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh appointments"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
          {isDoctor && (
            <DateSummaryPopover
              summaryDate={summaryDate}
              summaryLabel={summaryLabel}
              selectedBookedCount={selectedBookedCount}
              selectedRemainingCount={selectedRemainingCount}
              selectedCompletedCount={selectedCompletedCount}
              completedSelectedAppointments={completedSelectedAppointments}
              showSelectedOnly={showSelectedOnly}
              onSummaryDateChange={onSummaryDateChange}
              onToggleShowSelected={onToggleShowSelected}
              onDownloadCompleted={onDownloadCompleted}
            />
          )}
          {!loadingUser && !isDoctor && (
            <Button
              asChild
              className="bg-black text-white hover:bg-gray-900 flex items-center justify-center flex-1 sm:flex-none text-sm"
              size="sm"
            >
              <Link href="/appointments/new">
                Book Appointment
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 pt-0">{children}</CardContent>
    </Card>
  );
}
