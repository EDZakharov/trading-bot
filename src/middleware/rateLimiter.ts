import { NextFunction, Request, Response } from 'express';

export function rateLimiter(
    err: any,
    _req: Request,
    res: Response,
    next: NextFunction
) {
    if (err.statusCode === 429) {
        return res.status(429).json({
            message: 'Too many requests from this IP, please try again later',
            status: false,
        });
    } else {
        return next();
    }
}
