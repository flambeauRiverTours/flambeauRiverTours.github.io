
import HeaderBar from './components/Header/HeaderBar'
import PortraitBlock from './components/Body/PortraitBlock'
import './App.scss'
import Sidebar from './components/Sidebar/Sidebar'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
//import Container from 'react-bootstrap/Container'

function App() {
  return (
    <>
      <HeaderBar></HeaderBar>
      <div >
        <Row>
          <Col xs={2} className='bg-secondary'>
            <Sidebar></Sidebar>
          </Col>
          <Col>
            <PortraitBlock></PortraitBlock>
          </Col>
        </Row>
      </div>
    </>
  )
}

export default App
