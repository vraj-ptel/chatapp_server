export const errorMiddleware = (err, req, res, next) => {
  console.log("Error __", err);
  err.message = err.message || "Internal Server Error";
  err.statusCode = err.statusCode || 500;
  if(err.code===11000){
   const e=Object.keys(err.keyPattern).join(",");
   err.message=`duplicate keys ${e}`;
    err.statusCode=400;
  }
  if(err.name==="CastError"){
    const errorPaht=err.path;
    err.message=`invalid format of ${errorPaht}`
    err.statusCode=400;

  }
  res.status(err.statusCode).json({
    success: false,
    message: process.env.NODE_ENV.trim() === "development" ? err : err.message,
  });
};
export const errorHandler = (passedFunc) => async (req, res, next) => {
  try {
    await passedFunc(req, res, next);
  } catch (error) {
    next(error);
  }
};