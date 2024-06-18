import { FC } from 'react';

interface Props {
  link: string;
  title: string;
  description: string;
}

export const InviteLetter: FC<Props> = ({ link, title, description }) => {
  return (
    <div style={{ margin: '0', padding: '0 !important', backgroundColor: '#DAE0E1' }}>
      <center
        role='article'
        aria-roledescription='email'
        lang='en'
        style={{ backgroundColor: '#DAE0E1' }}
      >
        {/* Email Body */}
        <table
          align='center'
          role='presentation'
          cellSpacing='0'
          cellPadding='0'
          border='0'
          width='100%'
          style={{ margin: 'auto', maxWidth: '640px' }}
          className='email-container'
        >
          {/* Unsubscribe */}
          {/* Logo */}
          <tr>
            <td
              className='logo'
              style={{ padding: '10px 0 32px', textAlign: 'center', backgroundColor: '#ffffff' }}
            >
              <img
                src='https://api.smtprelay.co/userfile/98d7bd03-3ba8-47b6-a9a0-cb2594bf32cd/headerLogo.png'
                title='headerLogo.png'
                alt='headerLogo.png'
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </td>
          </tr>
          {/* Header image */}
          <tr>
            <td>
              <img
                src='https://api.smtprelay.co/userfile/98d7bd03-3ba8-47b6-a9a0-cb2594bf32cd/LoginBackground.png'
                title='LoginBackground.png'
                alt='LoginBackground.png'
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </td>
          </tr>
          {/* Section: email title */}
          <tr>
            <td
              style={{ padding: '32px 16px 20px', textAlign: 'center', backgroundColor: '#ffffff' }}
            >
              <p
                className='header-text'
                style={{
                  height: 'auto',
                  margin: '15px 0',
                  background: '#ffffff',
                  fontFamily: 'Open Sans',
                  textAlign: 'center',
                  fontSize: '28px',
                  lineHeight: '32px',
                  color: '#000000',
                  backgroundColor: '#ffffff',
                  wordBreak: 'break-all',
                }}
              >
                {/* No More Travel Advice From Strangers! */}
                {title}
              </p>
              <p
                style={{
                  height: 'auto',
                  margin: '20px 0 15px',
                  background: '#ffffff',
                  textAlign: 'center',
                  fontFamily: 'Open Sans',
                  fontSize: '15px',
                  lineHeight: '24px',
                  color: '#5F5F5F',
                  backgroundColor: '#ffffff',
                  wordBreak: 'break-all',
                }}
              >
                {description}
              </p>
            </td>
          </tr>
          <td
            style={{ padding: '20px 16px 48px', textAlign: 'center', backgroundColor: '#ffffff' }}
          >
            {/* Button */}
            <table
              align='center'
              role='presentation'
              cellSpacing='0'
              cellPadding='0'
              border='0'
              style={{ margin: 'auto', padding: '20px' }}
            >
              <tr>
                <td
                  className='button-td button-td-primary'
                  style={{ borderRadius: '4px', background: '#2e66ff' }}
                >
                  <a
                    className='button-a button-a-primary'
                    href={link}
                    style={{
                      background: '#2e66ff',
                      border: '1px solid #2e66ff',
                      fontFamily: 'Open Sans',
                      fontSize: '16px',
                      lineHeight: 'inherit',
                      textDecoration: 'none',
                      padding: '16px',
                      color: '#ffffff',
                      display: 'block',
                      borderRadius: '4px',
                    }}
                  >
                    Go to TripAmi
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </table>
      </center>
    </div>
  );
};
