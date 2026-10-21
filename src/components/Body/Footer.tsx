/**
 * Footer for the body block: copyright, and the assistant's privacy note once it launches.
 */

import './Footer.scss'

function Footer(props: IFooterProps) {
  return (
    <footer className="footer">
      <small className='text-muted'>© {new Date().getFullYear()} Jack Treadwell</small>
      {props.showPrivacy ? <small className='text-muted'> · <a href="/privacy.html">Privacy</a></small> : null}
    </footer>
  );
}

interface IFooterProps {
  showPrivacy: boolean; //the privacy note covers the assistant, so it's linked only once the assistant launches
}

export default Footer;
