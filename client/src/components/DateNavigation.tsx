import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, getNextDay, getPreviousDay, isToday } from "@/lib/dates";

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (newDate: Date) => void;
}

export function DateNavigation({ currentDate, onDateChange }: DateNavigationProps) {
  const handlePreviousDay = () => {
    onDateChange(getPreviousDay(currentDate));
  };

  const handleNextDay = () => {
    onDateChange(getNextDay(currentDate));
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const formattedDate = formatDate(currentDate);
  const showTodayButton = !isToday(currentDate);

  return (
    <div className="flex justify-between items-center mb-6">
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handlePreviousDay}
        aria-label="Previous day"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold">{formattedDate}</h2>
        {showTodayButton && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToday}
            className="text-xs h-7 px-2"
          >
            Today
          </Button>
        )}
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={handleNextDay}
        aria-label="Next day"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}
