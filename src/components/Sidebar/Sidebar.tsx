import  Container from "react-bootstrap/Container";
import Stack from "react-bootstrap/Stack";
import SiderbarButton from "./SidebarButton";
function Sidebar(){
    return (
        <Container fluid className="sticky top-0 bg-secondary h-lvh">
    <Stack gap={3} className="sticky top-0 flex flex-col " >
        <br/>
        <SiderbarButton active={true} caption="Home" tooltip="Home"/>
        <SiderbarButton active={false} caption="Home" tooltip="Home"/>
        <SiderbarButton active={false} caption="Home" tooltip="Home"/>
        <SiderbarButton active={false} caption="Home" tooltip="Home"/>
    </Stack>
    </Container>);
}

export default Sidebar;