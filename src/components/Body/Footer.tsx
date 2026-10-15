/**
 * Footer for the body block. Currently used to display copyright info.
 */

import './Footer.scss'

function Footer() {
  return (
    <footer className="footer">
      <small className='text-muted'>© {new Date().getFullYear()} Jack Treadwell</small>
    </footer>
  );
}

export default Footer;
