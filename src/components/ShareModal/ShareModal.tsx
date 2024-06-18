import React, { useState } from 'react';
import Modal from 'react-modal';
import { WhatsappShareButton, TelegramShareButton, EmailShareButton } from 'react-share';
import { WhatsappIcon, TelegramIcon, EmailIcon } from 'react-share';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Done from '~/assets/icons/done.svg';
import styles from './shareModal.module.css'; // Make sure to adjust the path as per your project structure

interface ModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  linkTo: string;
}

const ShareModal: React.FC<ModalProps> = ({ isOpen, onRequestClose, linkTo }) => {
  const [isCopied, setIsCopied] = useState(false);

  return (
    <Modal
      closeTimeoutMS={500}
      isOpen={isOpen}
      style={{
        content: {
          padding: 0,
          height: 300,
          margin: 'auto',
        },
      }}
      contentLabel="Example Modal"
      onRequestClose={() => {
        setIsCopied(false);
        onRequestClose();
      }}
      shouldCloseOnOverlayClick
      shouldCloseOnEsc
    >
      <div className={styles.shareModalContainer}>
        <h3 className={styles.title}>Share with your friends</h3>
        <div className={styles.shareButtonsContainer}>
          <WhatsappShareButton
            url={linkTo}
            title={'Check out this trip'}
            separator=":: "
            className="Demo__some-network__share-button"
          >
            <WhatsappIcon className={styles.socialIcon} round />
          </WhatsappShareButton>
          <TelegramShareButton
            url={linkTo}
            title={'Check out this trip'}
            className="Demo__some-network__share-button"
          >
            <TelegramIcon className={styles.socialIcon} round />
          </TelegramShareButton>
          <EmailShareButton
            url={linkTo}
            subject={'Check out this trip'}
            body="body"
            className="Demo__some-network__share-button"
          >
            <EmailIcon className={styles.socialIcon} round />
          </EmailShareButton>
        </div>

        <CopyToClipboard text={linkTo}>
          <div
            className={`${styles.linkContainer} ${isCopied ? styles.copiedActive : ''}`}
            onClick={() => setIsCopied(true)}
          >
            <p className={styles.shareLink}>{linkTo}</p>
          </div>
        </CopyToClipboard>

        {isCopied && (
          <div className={styles.doneContainer}>
            <p className={styles.copied}>Copied</p>
            <img src={Done} alt="done" />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ShareModal;
