import express, { Request, Response, Application, NextFunction  } from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app: Application = express();

import routes from './routes/index.route';

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors());
app.use(morgan("dev"))


app.use('/marketplace/api/v1', routes)

app.get('/marketplace', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: 'Welcome to Real Estate MarketPlace service 🚀'
    })
})

export default app;