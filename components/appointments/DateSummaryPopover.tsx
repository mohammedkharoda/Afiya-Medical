import { CalendarDays, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Appointment } from "./types";

interface DateSummaryPopoverProps {
  summaryDate: Date;
  summaryLabel: string;
  selectedBookedCount: number;
  selectedRemainingCount: number;
  selectedCompletedCount: number;
  completedSelectedAppointments: Appointment[];
  showSelectedOnly: boolean;
  onSummaryDateChange: (date: Date) => void;
  onToggleShowSelected: () => void;
  onDownloadCompleted: () => void;
}

export function DateSummaryPopover({
  summaryDate,
  summaryLabel,
  selectedBookedCount,
  selectedRemainingCount,
  selectedCompletedCount,
  completedSelectedAppointments,
  showSelectedOnly,
  onSummaryDateChange,
  onToggleShowSelected,
  onDownloadCompleted,
}: DateSummaryPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="shrink-0"
          title="Date appointment summary"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Date summary</p>
            <Badge variant="outline" className="text-[11px]">
              {summaryLabel}
            </Badge>
          </div>
          <DatePicker
            mode="single"
            selected={summaryDate}
            onSelect={(date) => date && onSummaryDateChange(date)}
            initialFocus
          />
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Booked</span>
              <span className="font-semibold">{selectedBookedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Need to see</span>
              <span className="font-semibold">{selectedRemainingCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-semibold">{selectedCompletedCount}</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onToggleShowSelected}
            >
              {showSelectedOnly
                ? "Show all appointments"
                : "Show selected date"}
            </Button>
            <Button
              size="sm"
              onClick={onDownloadCompleted}
              disabled={!completedSelectedAppointments.length}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Excel (CSV)
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
