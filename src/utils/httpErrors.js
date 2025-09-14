export function badRequest(message = "Bad Request") {
  const err = new Error(message);
  err.status = 400;
  err.publicMessage = message;
  return err;
}

export function serviceUnavailable(message = "Service Unavailable") {
  const err = new Error(message);
  err.status = 503;
  err.publicMessage = message;
  return err;
}

export function unauthorized(message = "Unauthorized") {
  const err = new Error(message);
  err.status = 401;
  err.publicMessage = message;
  return err;
}