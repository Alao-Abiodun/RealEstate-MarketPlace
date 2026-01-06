import express, { Request, Response, Application, NextFunction  } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';

const app: Application = express();

import routes from './routes/index.route';

app.use(cors());
app.use(morgan("dev"))
app.use(helmet());
app.use(compression());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use('/marketplace/api/v1', routes)

app.get('/marketplace', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: 'Welcome to Real Estate MarketPlace service 🚀'
    })
})

export default app;