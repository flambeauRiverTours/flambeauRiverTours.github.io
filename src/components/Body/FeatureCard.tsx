
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
        <Card.Title>{props.title}</Card.Title>
        <Card.Text>
          {props.body}
        </Card.Text>
        <Card.Footer>
          <Card.Link onClick={ () =>{__featureCardClicked(true)}}>
          Read More
          </Card.Link>
        </Card.Footer>
    </Card>
    </Col>);
}

function __featureCardClicked(event: any){
  if(event){
    //event.preventDefault();
  }
  console.log("Feature Card Clicked");
}

export default FeatureCard;