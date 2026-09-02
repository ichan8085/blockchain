const express = require('express');
const app = express();
app.use((req, res) => {
    console.log("req.url:", req.url);
    console.log("req.path:", req.path);
    console.log("req.originalUrl:", req.originalUrl);
    res.send("OK");
});
app.listen(3002, () => console.log('Listening on 3002'));
