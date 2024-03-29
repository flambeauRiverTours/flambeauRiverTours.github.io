
import BodyBlock from './components/Body/BodyBlock'
import './App.scss'
import Sidebar from './components/Sidebar/Sidebar'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { FullPageData } from './datamodel/FullPageData'
import { useState } from "react";
import { ISectionData } from './datamodel/SectionData'


function App() {
  const pageData = new FullPageData();
  const [activeBodyBlockIndex, setActiveBodyBlock] = useState(0);
  const [nextBodyBlock, setNextBodyBlock] = useState(-1);

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
  return (
    <>
      <div >
        <Row>
          <Col xs={2} className='bg-secondary border-secondary sidebarColumn' style={{paddingRight: "0px"}}>
            <Sidebar buttonTitles={pageData.getButtonTitles()} buttonSelectionCallback={sidebarButtonSelectionCallback} ></Sidebar>
          </Col>
          <Col>
            {pageData.getSectionDataArray().map((sectionData: ISectionData, index: number) =>{
              return <BodyBlock sectionData={sectionData} visible={index === activeBodyBlockIndex} afterFadeOut={bodyBlockFadeOutCallback}></BodyBlock>
            })}
            
          </Col>
        </Row>
      </div>
    </>
  )
}

export default App
