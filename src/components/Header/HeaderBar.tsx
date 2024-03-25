function HeaderBar(){
    return <>
    <div className="container">
    <header className="d-flex flex-wrap justify-content-center py-3 mb-4 border-bottom">
      <a href="/" className="d-flex align-items-center mb-3 mb-md-0 me-md-auto link-body-emphasis text-decoration-none">
        <span className="fs-4">Jack Treadwell</span>
      </a>

      <ul className="nav nav-pills">
        <li className="nav-item"><a href="https://www.linkedin.com/in/john-treadwell/" className="nav-link">LinkedIn</a></li>
        <li className="nav-item"><a href="https://github.com/flambeauRiverTours" className="nav-link">GitHub</a></li>
      </ul>
    </header>
  </div>
    </>;

}

export default HeaderBar;