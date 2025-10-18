import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ProjectProvider } from "./store/ProjectContext";
import { PermissionProvider } from "./store/PermissionContext";
import "mdb-react-ui-kit/dist/css/mdb.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";  // nếu muốn dùng icon FontAwesome


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectProvider>
      <PermissionProvider>
        <App />
      </PermissionProvider>
    </ProjectProvider>
  </React.StrictMode>
);