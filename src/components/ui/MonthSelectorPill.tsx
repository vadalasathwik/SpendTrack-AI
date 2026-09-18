import React from 'react';
import { MonthSelector } from './MonthSelector.js';
import { DateRange } from '../../types.js';

interface MonthSelectorPillProps {
  dateRange: DateRange;
  onChangeDateRange?: (newRange: DateRange) => void;
}

export const MonthSelectorPill: React.FC<MonthSelectorPillProps> = ({
  dateRange,
  onChangeDateRange,
}) => {
  return (
    <div className="flex items-center justify-start w-full">
      <MonthSelector dateRange={dateRange} onChangeDateRange={onChangeDateRange} />
    </div>
  );
};
