/**
 * Container holding feature cards that link out to subpages
 */
import FeatureCard from "./FeatureCard";
import Container from "react-bootstrap/Container"
import Row from "react-bootstrap/Row"

function CardContainer(){
  const cardDataArray = __getCardData();
    return (
    <Container fluid>
      <Row xs={1} md={2} className="g-4">
      {cardDataArray.map((cardData, idx) => (
        <FeatureCard key={idx} title={cardData.title}  body={cardData.body} />
      ))}
      </Row>
    </Container>)
}

/**
 * Populates card data array for use when creating the cards. New cards need a new
 * cardDataAry.push
 */
function __getCardData(): Array<ICardData>{
  const cardDataAry: ICardData[] = [];
  cardDataAry.push({
    title: "A",
    body: "b"
  });
  cardDataAry.push({
    title: "A",
    body: "b",
  });
  cardDataAry.push({
    title: "A",
    body: "b",
  });
  cardDataAry.push({
    title: "A",
    body: "b",
  });
  cardDataAry.push({
    title: "A",
    body: "b",
  });
  return cardDataAry;
}

interface ICardData{
  title: string;
  body: string;
}



export default CardContainer;