import { createRoot } from "react-dom/client";
import Popup from "./Popup";
import "../../index.css";

// Create root element and render the popup
const container =
  document.getElementById("root") || document.createElement("div");
if (!document.getElementById("root")) {
  container.id = "root";
  document.body.appendChild(container);
}

const root = createRoot(container);
root.render(<Popup />);
