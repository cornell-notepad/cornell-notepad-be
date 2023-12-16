import { app } from "./app";
import {PORT} from "./consts/FromEnvVars";

app.listen(PORT, () =>
    console.info(`App is running! Check swagger at http://localhost:${PORT}/docs`)
);