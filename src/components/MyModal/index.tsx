import { Modal, type ModalProps } from 'antd';
import { type FC } from 'react';

const MyModal: FC<Props> = (props) => {
  const { okButtonProps, cancelButtonProps, ...restProps } = props;
  return (
    <Modal
      // forceRender
      destroyOnHidden
      centered
      width={700}
      title='title'
      okButtonProps={{
        type: 'primary',
        shape: 'round',
        ...okButtonProps,
      }}
      cancelButtonProps={{
        shape: 'round',
        ...cancelButtonProps,
      }}
      {...restProps}
    />
  );
};

export default MyModal;

interface Props extends ModalProps {}
