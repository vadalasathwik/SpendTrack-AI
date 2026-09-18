import React from 'react';
import { Search } from 'lucide-react';
import { CircularIconButton } from './CircularIconButton.js';

interface SearchTriggerProps {
  onOpenSearch: () => void;
}

export const SearchTrigger: React.FC<SearchTriggerProps> = ({ onOpenSearch }) => {
  return (
    <CircularIconButton
      icon={Search}
      onClick={onOpenSearch}
      ariaLabel="Global Search (Cmd+K)"
    />
  );
};
