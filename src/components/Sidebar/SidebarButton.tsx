import Button from "react-bootstrap/Button";

function SiderbarButton(props: SidebarButtonProps) {
  return (
    <Button active={props.active} variant="secondary" className="sidebar-button">{props.caption}</Button>
  );
}

interface SidebarButtonProps {
    active: boolean;
    caption: string;
    tooltip?: string;
}

export default SiderbarButton;