import { Request, Response, Router } from 'express';
import { Bot } from '../bot/bot';
import { rateLimiter } from '../middleware/rateLimiter';

export const router = Router();

const endpoints = {
    create: '/create',
    start: '/start',
    stop: '/stop',
};

export let myBot: Bot | undefined = undefined;

router.post(
    endpoints.create,
    rateLimiter,
    async (req: Request, res: Response) => {
        try {
            myBot = new Bot(
                req.body.exchange,
                req.body.coins,
                req.body.config,
                req.body.rsi
            );

            res.status(201).json('Create');
        } catch (error) {
            res.status(400).json(error);
        }
    }
);

router.post(
    endpoints.start,
    rateLimiter,
    async (_req: Request, res: Response) => {
        try {
            if (myBot) {
                await myBot.start();
                res.status(200).json('Start');
            } else {
                res.status(400).json('Bot not created');
            }
        } catch (error) {
            res.status(400).json(error);
        }
    }
);

router.post(
    endpoints.stop,
    rateLimiter,
    async (_req: Request, res: Response) => {
        try {
            if (myBot) {
                myBot.stop();
                res.status(200).json('Stop');
            } else {
                res.status(400).json('Bot not created');
            }
        } catch (error) {
            res.status(400).json(error);
        }
    }
);
