import { Button, Tooltip, type ButtonProps, type TooltipProps } from 'antd';
import { useEffect, useState } from 'react';

interface Props extends ButtonProps {
  onClick?: (...args: any[]) => Promise<any> | any | void;
  toolTip?: string;
  toolTipProps?: TooltipProps;
}

export default function MyButton(props: Props) {
  const { loading, onClick, toolTip, toolTipProps, ...rest } = props;

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

  return (
    <Tooltip {...toolTipProps} title={toolTip}>
      <Button {...rest} onClick={handleClick} loading={_loading} />
    </Tooltip>
  );
}
