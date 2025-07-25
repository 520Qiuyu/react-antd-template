import { useTeleport } from '@/hooks';
import type { TeleportTarget } from '@/hooks/useTeleport';
import React from 'react';

interface Props extends React.PropsWithChildren {
  to: TeleportTarget;
}

export default function Teleport(props: Props) {
  const { children, to } = props;

  useTeleport(children, to);

  return null;
}
