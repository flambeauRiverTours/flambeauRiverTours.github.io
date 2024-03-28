
import HeaderBar from './components/Header/HeaderBar'
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
  const sidebarButtonSelectionCallback = (index: number) =>{
    if (index !== activeBodyBlockIndex) {
      setActiveBodyBlock(index);
    }
  }
  pageData.getSectionDataArray().forEach((value: ISectionData) =>{
    if(value){}
  })
  return (
    <>
      <HeaderBar></HeaderBar>
      <div >
        <Row>
          <Col xs={2} className='bg-secondary'>
            <Sidebar buttonTitles={pageData.getButtonTitles()} buttonSelectionCallback={sidebarButtonSelectionCallback} ></Sidebar>
          </Col>
          <Col>
            {pageData.getSectionDataArray().map((sectionData: ISectionData, index: number) =>{
              return <BodyBlock sectionData={sectionData} visible={index === activeBodyBlockIndex}></BodyBlock>
            })}
            
          </Col>
        </Row>
      </div>
    </>
  )
}

export default App
