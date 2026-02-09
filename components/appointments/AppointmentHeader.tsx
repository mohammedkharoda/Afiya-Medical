import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "./utils";

interface AppointmentHeaderProps {
  appointmentDate: string;
  appointmentTime: string;
  status: string;
}

export function AppointmentHeader({
  appointmentDate,
  appointmentTime,
  status,
}: AppointmentHeaderProps) {
  return (
    <div className="flex items-start sm:items-center justify-between gap-2">
      <div className="flex items-start sm:items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm sm:text-base text-foreground">
            {formatDate(appointmentDate)}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">
            <Clock className="mr-1 inline h-3 w-3 sm:h-4 sm:w-4" />
            {appointmentTime}
          </p>
        </div>
      </div>
      <Badge className={`${getStatusColor(status)} text-xs shrink-0`}>
        {status}
      </Badge>
    </div>
  );
}
