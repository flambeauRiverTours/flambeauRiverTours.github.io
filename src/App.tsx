
import BodyBlock from './components/Body/BodyBlock'
import './App.scss'
import Sidebar from './components/Sidebar/Sidebar'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { FullPageData } from './datamodel/FullPageData'
import { useState } from "react";
import { ISectionData } from './datamodel/SectionData'
import HeaderBar from './components/Header/HeaderBar'


function App() {
  const collapseWidth = 1000; //width in px at which the sidebar collapses
  const pageData = new FullPageData();
  const [activeBodyBlockIndex, setActiveBodyBlock] = useState(0);
  const [nextBodyBlock, setNextBodyBlock] = useState(-1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(window.innerWidth < collapseWidth); //true if the sidebar is collapsed, false otherwise

  //handler for when a button is clicked in the sidebar. Changes the active body block
  const sidebarButtonSelectionCallback = (index: number) =>{
    if (index !== activeBodyBlockIndex) {
      //when a button is pressed, first tell the current body block to fade out
      setActiveBodyBlock(-1);
      //then set the next body block to be the one that was clicked
      setNextBodyBlock(index); 
    }
  }

  //handler for when the body block finishes fading out. Changes the active body block to the next body block
  const bodyBlockFadeOutCallback = () =>{
    setActiveBodyBlock(nextBodyBlock);
  }

  //handler for when the window is resized. Collapses the sidebar if the window is too small
  window.onresize = () => {
    if (window.innerWidth < collapseWidth) {
      //if the window is less than the collapse width, collapse the sidebar
      setSidebarCollapsed(true);
    }
    else{
      setSidebarCollapsed(false);
    }
  }

  return (
    <>
      { sidebarCollapsed ? <HeaderBar activeIndex={activeBodyBlockIndex} buttonTitles={pageData.getButtonTitles()} buttonSelectionCallback={sidebarButtonSelectionCallback}></HeaderBar> : null}
        <Row>
          {sidebarCollapsed ?  null :
          <Col xs={2} className='bg-secondary border-secondary sidebarColumn' style={{paddingRight: "0px"}}>
            <Sidebar activeIndex={activeBodyBlockIndex} buttonTitles={pageData.getButtonTitles()} buttonSelectionCallback={sidebarButtonSelectionCallback} ></Sidebar>
          </Col> 
          }
          
          <Col>
            {pageData.getSectionDataArray().map((sectionData: ISectionData, index: number) =>{
              return <BodyBlock sectionData={sectionData} visible={index === activeBodyBlockIndex} afterFadeOut={bodyBlockFadeOutCallback}></BodyBlock>
            })}
          </Col>
        </Row>
    </>
  )
}

export default App
