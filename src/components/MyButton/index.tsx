import { useUser } from '@/hooks/useUser';
import { Button, Tooltip, type ButtonProps, type TooltipProps } from 'antd';
import { useEffect, useState } from 'react';

interface Props extends ButtonProps {
  onClick?: (...args: any[]) => Promise<any> | any | void;
  toolTip?: string;
  toolTipProps?: TooltipProps;
  permissionCode?: string;
}

export default function MyButton(props: Props) {
  const { loading, onClick, toolTip, toolTipProps, permissionCode, ...rest } = props;
  const { hasPermission } = useUser();

  const [_loading, setLoading] = useState(loading);
  const handleClick = async (...args) => {
    try {
      setLoading(true);
      await onClick?.(...args);
    } catch (error) {
      console.log('error', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(loading);
  }, [loading]);

  if (permissionCode && !hasPermission(permissionCode)) {
    return null;
  }

  return (
    <Tooltip {...toolTipProps} title={toolTip}>
      <Button {...rest} onClick={handleClick} loading={_loading} />
    </Tooltip>
  );
}
