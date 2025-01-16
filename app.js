const express = require('express');
const morgan = require('morgan');
const cors = require('cors');

const AppError = require('./utils/appError');
const globalAppError = require('./controllers/error');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/user');
const dishRouter = require('./routes/dish');
const mealRouter = require('./routes/meal');
const orderRouter = require('./routes/order');
const addressRouter = require('./routes/address');
const transactionRouter = require('./routes/transaction');

const app = express();

// Middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.static(`${__dirname}/public`));
app.use(cors());
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Route handlers
app.use('/api/v1/auth', authRouter); // Route mounting
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/dish', dishRouter);
app.use('/api/v1/meal', mealRouter);
app.use('/api/v1/address', addressRouter);
app.use('/api/v1/transaction', transactionRouter);
app.use('/api/v1/order', orderRouter);

// Undefined api access
app.all('*', (req, res, next) => {
  next(new AppError(`Caan't find ${req.originalUrl} on this server!`, 404));
});

// Middleware call for global error handler
app.use(globalAppError);

module.exports = app;
