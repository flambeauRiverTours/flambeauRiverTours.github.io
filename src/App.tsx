
import BodyBlock from './components/Body/BodyBlock'
import './App.scss'
import Sidebar from './components/Sidebar/Sidebar'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { FullPageData } from './datamodel/FullPageData'
import { useEffect, useState } from "react";
import { ISectionData, SectionGroup } from './datamodel/SectionData'
import HeaderBar from './components/Header/HeaderBar'
import Hero from './components/Body/Hero'
import Footer from './components/Body/Footer'
import { useActiveSection } from './hooks/useActiveSection'

const collapseWidth = 1000; //width in px at which the sidebar collapses
const pageData = new FullPageData();
const sections = pageData.getSectionDataArray();
const sectionIds = sections.map((section) => section.id);

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < collapseWidth); //true if the sidebar is collapsed, false otherwise
  const activeId = useActiveSection(sectionIds);

  //collapse the sidebar when the window is too narrow to show it alongside the body
  useEffect(() => {
    const onResize = () => setSidebarCollapsed(window.innerWidth < collapseWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  //the sections only exist once React has rendered, so honour a #link from the initial page load here
  useEffect(() => {
    if (window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: "instant" });
    }
  }, []);

  return (
    <>
      { sidebarCollapsed ? <HeaderBar sections={sections} activeId={activeId}></HeaderBar> : null}
        <Row className={"g-0" + (sidebarCollapsed ? " withHeaderBar" : "")}>
          {sidebarCollapsed ?  null :
          <Col xs={2} className='sidebarColumn'>
            <Sidebar sections={sections} activeId={activeId}></Sidebar>
          </Col>
          }

          <Col>
            <main className="content">
              <Hero highlights={pageData.getHighlights()} />
              {sections.map((sectionData: ISectionData, index: number) =>
                <div key={sectionData.id}>
                  {sectionData.group === SectionGroup.personal && sections[index - 1]?.group !== SectionGroup.personal ?
                    <p className="groupDivider">Beyond work</p> : null}
                  <BodyBlock sectionData={sectionData}></BodyBlock>
                </div>
              )}
            </main>
            <Footer/>
          </Col>
        </Row>
    </>
  )
}

export default App
