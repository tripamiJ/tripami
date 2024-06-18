import React, {FC, useCallback, useContext, useEffect, useMemo, useState} from 'react';
import GoogleIcon from "@assets/icons/GoogleIcon.svg";
import styles from './signUpModal.module.css';
import {AuthContext} from "~/providers/authContext";
import {useNavigate} from "react-router-dom";
import {LoadingScreen} from "~/components/LoadingScreen";

interface Props {
  onClose: () => void;
  isOpen: boolean;
  isLogin?: boolean;
}

const inputStyles = {backgroundColor: '#F6F6F6', padding: '0 10px', color: '#000000', border: 'none'};

export const SignUpModal: FC<Props> = ({onClose, isOpen, isLogin = false}) => {
  const [isRegisterForm, setIsRegisterForm] = useState(false);
  const [isLoginForm, setIsLoginForm] = useState(isLogin);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const {signUp, currentUser, signIn, signInViaGoogle, loading} = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "scroll"
    }

    return () => {
      document.body.style.overflow = "scroll"
    }
  }, [isOpen]);

  const handelRegister = useCallback(async () => {
    const result = await signUp(email, password, userName);

    if (result) {
      navigate('/profile');
    }
  }, [email, password, userName]);

  const handelLogin = useCallback(async () => {
    const result = await signIn(email, password);

    if (result) {
      navigate('/profile');
    }
  }, [email, password]);

  const handleLoginWithGoogle = useCallback(async () => {
    const result = await signInViaGoogle();

    if (result) {
      navigate('/profile');
    }
  }, []);

  const registerFormOrOAuth = useMemo(() => {
    if (isRegisterForm) {
      return (
        <>
          <div className={styles.facebook} style={{border: 'none'}}>
            <p className={styles.label}>Email</p>
            <input
              type="email"
              className={styles.facebook}
              style={inputStyles}
              autoFocus
              onChange={e => setEmail(e.target.value)}
              value={email}
            />
          </div>
          <div className={styles.apple} style={{border: 'none'}}>
            <p className={styles.label}>Password</p>
            <input
              type="password"
              className={styles.facebook}
              style={inputStyles}
              onChange={e => setPassword(e.target.value)}
              value={password}
            />
          </div>
          <div className={styles.apple} style={{border: 'none'}}>
            <p className={styles.label}>Username</p>
            <input
              type="text"
              className={styles.facebook}
              style={inputStyles}
              onChange={e => setUserName(e.target.value)}
              value={userName}
            />
          </div>
        </>
      );
    } else if (isLoginForm) {
      return (
        <>
          <div className={styles.facebook} style={{border: 'none'}}>
            <p className={styles.label}>Email</p>
            <input
              type="email"
              className={styles.facebook}
              style={inputStyles}
              autoFocus
              onChange={e => setEmail(e.target.value)}
              value={email}
            />
          </div>
          <div className={styles.apple} style={{border: 'none'}}>
            <p className={styles.label}>Password</p>
            <input
              type="password"
              className={styles.facebook}
              style={inputStyles}
              onChange={e => setPassword(e.target.value)}
              value={password}
            />
          </div>
          <div className={`${styles.facebook} ${styles.google}`}onClick={handleLoginWithGoogle}>
            <img className={styles.icon} src={GoogleIcon} alt="google icon" />
            <span className={styles.name}>Continue with Google</span>
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className={styles.facebook} onClick={handleLoginWithGoogle}>
            <img className={styles.icon} src={GoogleIcon} alt="google icon" />
            <span className={styles.name}>Continue with Google</span>
          </div>
        </>
      )
    }
  }, [password, isRegisterForm, email, isLoginForm, userName]);

  const handleOpenRegisterForm = useCallback(() => {
    setPassword('');
    setEmail('');
    setIsRegisterForm(prevState => !prevState);
  }, []);

  const handleOpenSignInForm = useCallback(() => {
    setPassword('');
    setEmail('');
    setIsRegisterForm(false);
    setIsLoginForm(prevState => !prevState);
  }, []);

  return isOpen ? (
    <>
      <div className={styles.background} onClick={onClose} />
      <div className={styles.box} onClick={onClose}>
        <div className={styles.container} onClick={(e) => e.stopPropagation()}>
          <h3 className={styles.title}>{isLoginForm ? 'Login in the account' : 'Sign up for an account'}</h3>
          {registerFormOrOAuth}
          {!isLoginForm && (
            <div className={styles.devideContainer}>
              <div className={styles.divider}></div>
              <span className={styles.or}>OR</span>
              <div className={styles.divider}></div>
            </div>
          )}
          <div className={styles.buttonsContainer}>
            {!isLoginForm && (
              <button className={isRegisterForm ? styles.back : styles.email} onClick={handleOpenRegisterForm}>
                {isRegisterForm ? 'Back' : 'Sign up with email'}
              </button>
            )}
            {
              isRegisterForm ?
                <button type="submit" className={styles.email} onClick={handelRegister}>Register!</button>
                : null
            }
            {isLoginForm && (
              <button
                className={styles.email}
                style={{ marginTop: 24 }}
                onClick={handelLogin}
              >
                {'Login'}
              </button>
            )}
          </div>
          {!isLoginForm && (
            <span className={styles.text}>
              By creating an account, you agree to the Goodreads{" "}
              <a href="#service">Terms of Service</a> and{" "}
              <a href="#privacy">Privacy Policy</a>.
            </span>
          )}
          <div className={styles.divider}></div>
          <div className={styles.footer}>
            <span className={styles.accquestion}>{isLoginForm ? 'Have not an account?' : 'Have an account?'}</span>
            <span className={styles.loginBtn} onClick={handleOpenSignInForm}>
              {isLoginForm ? 'Register' : 'Log in'}
            </span>
          </div>
        </div>
      </div>
      {loading && <LoadingScreen />}
    </>
  ) : null;
};
