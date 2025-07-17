import { createRoot } from "react-dom/client";
import Options from "./Options";
import "../../index.css";

// Create root element and render the options page
const container =
  document.getElementById("root") || document.createElement("div");
if (!document.getElementById("root")) {
  container.id = "root";
  document.body.appendChild(container);
}

const root = createRoot(container);
root.render(<Options />);
