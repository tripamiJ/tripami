import React from 'react';
import Modal from 'react-modal';
import { CSSTransition } from 'react-transition-group';

import './customModal.css';

interface Props {
  children: React.ReactNode;
  isOpen: boolean;
  onCloseModal: () => void;
  images?: {
    url: string;
    type: string;
  }[];
}

const CustomModal: React.FC<Props> = ({ children, isOpen, onCloseModal }) => {
  return (
    <CSSTransition in={isOpen} timeout={300} classNames='dialog'>
      <Modal
        closeTimeoutMS={500}
        isOpen={isOpen}
        style={{
          content: {
            // padding: 0,
            // margin: "auto",
            // maxWidth: '600px',
            // maxHeight: "80%",
            // overflow: "auto",
          },
        }}
        contentLabel='Example Modal'
        onRequestClose={onCloseModal}
        shouldCloseOnOverlayClick
        shouldCloseOnEsc
        className={'modal'}
      >
        {children}
      </Modal>
    </CSSTransition>
  );
};

export default CustomModal;
