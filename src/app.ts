import express, { Request, Response, Application, NextFunction  } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';

const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    limit: 10,
    statusCode: 429,
    message: "Too many request from this IP. Please try again"
})

const app: Application = express();

import routes from './routes/index.route';

app.use(cors());
app.use(morgan("dev"))
app.use(helmet());
app.use(compression());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(rateLimiter)


app.use('/marketplace/api/v1', routes)

app.get('/marketplace', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: 'Welcome to Real Estate MarketPlace service 🚀'
    })
})

export default app;