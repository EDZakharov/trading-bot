import bodyParser from 'body-parser';

import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';

import { router } from './router/routes';

const app: Express = express();
const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 1000,
    message: 'Too many requests from this IP, please try again later',
});

app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(limiter);
app.use('/api', router);
const PORT = process.env['APP_PORT'] || '';
const startApp = async () => {
    try {
        app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
    } catch (error) {
        startApp();
    }
};

startApp();
