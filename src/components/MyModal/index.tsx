import type { ModalProps } from 'antd';
import { Modal } from 'antd';
import type { FC } from 'react';
import styles from './index.module.less';

const MyModal: FC<Props> = (props) => {
  const { okButtonProps, cancelButtonProps, ...restProps } = props;
  return (
    <Modal
      forceRender
      destroyOnHidden
      centered
      width={700}
      title='title'
      okButtonProps={{
        type: 'primary',
        ...okButtonProps,
      }}
      cancelButtonProps={{
        ...cancelButtonProps,
      }}
      className={styles['my-modal']}
      {...restProps}
    />
  );
};

export default MyModal;

interface Props extends ModalProps {
  // className?: string;
}
