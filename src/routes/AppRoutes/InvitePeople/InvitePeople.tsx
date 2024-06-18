import { useCallback, useContext, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';

import axios from 'axios';
import { Footer } from '~/components/Footer';
import { InviteLetter } from '~/components/InviteLetter/InviteLetter';
import { PageTitle } from '~/components/PageTitle';
import Header from '~/components/profile/Header';
import { AuthContext } from '~/providers/authContext';

import styles from './invitePeople.module.css';

const defaultTitle = 'No More Travel Advice From Strangers!';
const defaultDescription =
  "We've created a platform to get travel advice from your friend's circle";

const InvitePeople = () => {
  const { firestoreUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const notify = (text: string) => toast.info(text);
  const notifyError = (text: string) => toast.error(text);

  const handleSendInvitation = useCallback(async () => {
    const userEmail = firestoreUser?.email;

    if (!email || !name) {
      notifyError('You need to fill all the fields');
      return;
    }

    if (!userEmail) {
      notifyError('You need to be logged in to invite someone');
      return;
    }

    try {
      const response = await axios.post(
        'https://api.elasticemail.com/v4/emails',
        {
          Recipients: [{ Email: email }],
          Content: {
            Body: [{ ContentType: 'HTML', Charset: 'string' }],
            From: 'visosensey@gmail.com',
            Subject: 'string',
            TemplateName: 'TripAmi',
            Merge: {
              linkTo: 'https://tripamicities.netlify.app',
              title: title.length > 0 ? title : defaultTitle,
              description: description.length > 0 ? description : defaultDescription,
            },
          },
        },
        {
          headers: {
            'X-ElasticEmail-ApiKey':
              'BE74E3AE0AD551541906080E491A880B630B0DB2E63B63573F4AEE255C011D805F60BBC6D8EFBCC03AA7440DC3DADE3D',
          },
        }
      );
      notify('Invitation successfully sent');
      setName('');
      setEmail('');
    } catch (err) {
      console.log('[ERROR sending email] => ', err);
      notifyError('Something went wrong, please try again');
    }
  }, [firestoreUser?.email, email, name]);

  const handleChangeTitle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length > 40) {
      return;
    } else {
      setTitle(e.target.value);
    }
  };

  const handleChangeDescription = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length > 100) {
      return;
    } else {
      setDescription(e.target.value);
    }
  };

  return (
    <div className={styles.wrapper}>
      <Header />
      <div className={styles.main}>
        <PageTitle title={'Add new people'} />
        <p className={styles.limit}>
          Remember that you only have {firestoreUser?.friends_request_limit} invitations!
        </p>
        <div className={styles.inputContainer}>
          <input
            className={styles.input}
            placeholder={'Name'}
            type={'text'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className={styles.input}
            placeholder={'Email'}
            type={'email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type='text'
            className={styles.input}
            placeholder={`Optional: title`}
            value={title}
            onChange={handleChangeTitle}
          />
          <input
            type='text'
            className={styles.input}
            placeholder={`Optional: description`}
            value={description}
            onChange={handleChangeDescription}
          />
          <button onClick={handleSendInvitation} className={styles.sendButton}>
            Invite
          </button>
        </div>

        <h2>Preview:</h2>
        <InviteLetter
          link='#'
          title={title || defaultTitle}
          description={description || defaultDescription}
        />
      </div>

      <Footer />
      <ToastContainer closeOnClick autoClose={2000} limit={1} pauseOnHover={false} />
    </div>
  );
};

export default InvitePeople;
