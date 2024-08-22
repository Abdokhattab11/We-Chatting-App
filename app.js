const path = require("path");
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const AppError = require("./utils/CustomError");

const app = express();

const authRouter = require("./controllers/authController");
const userRouter = require("./controllers/userController");

app.use(express.json());
app.use(require("./middlewares/tokenCheckInRedisMiddleware"));
app.use(cors());
app.options("*", cors()); // include before other routes
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}
app.use("/views", express.static(path.join(__dirname, "views")));

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/user", userRouter);

app.all("*", (req, res, next) => {
  next(new AppError(404, `cant find route in the server :${req.originalUrl}`));
});
app.use(require("./middlewares/globalErrorHandler"));

module.exports = app;
