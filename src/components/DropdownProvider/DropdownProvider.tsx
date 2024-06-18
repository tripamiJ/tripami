import { FC, ReactNode } from 'react';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface Props {
  trigger: ReactNode;
  content: ReactNode;
  side?: 'top' | 'bottom' | 'right' | 'left';
}

export const DropdownProvider: FC<Props> = ({ trigger, content, side }) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Content style={{ zIndex: '5' }} side={side ? side : 'bottom'}>
        {/* This is the content of the dropdown */}
        <DropdownMenu.Group>
          <DropdownMenu.Item
            onSelect={() => {}}
            style={{ position: 'relative', marginLeft: '20px' }}
          >
            {content}
          </DropdownMenu.Item>
        </DropdownMenu.Group>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
