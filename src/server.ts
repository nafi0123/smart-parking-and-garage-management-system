import dotenv from 'dotenv';
import app from './app';
import config from './app/config';

dotenv.config();

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`🚗 Server is running on port ${port}`);
});
