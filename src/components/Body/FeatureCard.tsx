
/**
 * Large feature card placed in the middle of the site. Links out to another portion of the site,
 * can contain a background image.
 * 
 */
import Card from 'react-bootstrap/Card';
import Col from "react-bootstrap/Col"
function FeatureCard(props: any){
    return (
      <Col key={props.key}>
      <Card style={{height: '10rem' }} >
      <Card.Img variant="top" src={props.imageSource} />
      <Card.ImgOverlay>
        <Card.Title>{props.title}</Card.Title>
        <Card.Text>
          {props.body}
        </Card.Text>
        <Card.Link>
          Read More
        </Card.Link>
      </Card.ImgOverlay>
    </Card>
    </Col>);
}

export default FeatureCard;