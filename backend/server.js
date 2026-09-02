const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});