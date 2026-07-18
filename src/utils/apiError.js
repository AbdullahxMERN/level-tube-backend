class apiError extends Error {
  constructor(
    statusCode,
    message = "something went worng",
    stack = "",
    Errors = [],
  ) {
    (super(message),
      (this.statusCode = statusCode),
      (this.success = false),
      (this.Errors = Errors));

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export { apiError };
