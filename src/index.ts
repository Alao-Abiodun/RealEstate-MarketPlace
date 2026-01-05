import "dotenv/config"
import app from './app'
import mongoose from 'mongoose';

const { PORT, MONGODB_URI } = process.env;

try {
    const db = await mongoose.connect(String(MONGODB_URI))

    if (db) console.log("Database connected successfully");

    mongoose.connection.on("error", (err) => {
        console.log('mongoose on connection error', err);
    })

    mongoose.connection.on("disconnected", (err) => {
        console.log('mongoose on connection disconnected', err);
    })

    app.listen(PORT, () => {
        console.log(`Server is running on PORT ${PORT}`);
    })
} catch (error) {
    process.exit();
}

process.on('SIGINT', () => {
    mongoose.connection.close();
    process.exit(0);
})

process.on('unhandledRejection', (error) => {
    console.log('unhandledRejection', error);
    mongoose.connection.close();
    process.exit(1); // Server needs to crash and program manager will restart it
})

process.on('uncaughtException', (error) => {
    console.log('uncaughtException', error);
    mongoose.connection.close();
    process.exit(1) // Server needs to crash and program manager will restart it
})

