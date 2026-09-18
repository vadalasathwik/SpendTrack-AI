import React from 'react';
import { Menu } from 'lucide-react';
import { CircularIconButton } from './CircularIconButton.js';

interface MenuTriggerProps {
  onOpenMenu: () => void;
  badgeCount?: number;
}

export const MenuTrigger: React.FC<MenuTriggerProps> = ({ onOpenMenu, badgeCount }) => {
  return (
    <CircularIconButton
      icon={Menu}
      onClick={onOpenMenu}
      ariaLabel="Menu Drawer"
      badgeCount={badgeCount}
    />
  );
};
