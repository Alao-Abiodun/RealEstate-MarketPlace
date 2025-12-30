import express, { Request, Response, Application, NextFunction  } from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app: Application = express();

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors());
app.use(morgan("dev"))


app.get('/', (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({
        message: 'Real Estate MarketPlace'
    })
})

export default app;