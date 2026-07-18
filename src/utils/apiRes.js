class apiRes {
  constructor(statusCode, data, message = "success", success = true) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.success = statusCode < 400;
  }
}

export { apiRes };
