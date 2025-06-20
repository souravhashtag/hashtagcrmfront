// utils/getIconComponent.ts
import * as Icons from 'lucide-react';

export const getIconComponent = (iconName: string): React.FC<any> => {
  const Icon = Icons[iconName as keyof typeof Icons];

  if (!Icon) {
    console.warn(`Unknown icon "${iconName}" - using HelpCircle as fallback`);
  }

  return (Icon || Icons.HelpCircle) as React.FC<any>;
};
