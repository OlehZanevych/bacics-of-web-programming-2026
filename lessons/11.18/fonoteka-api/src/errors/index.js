// Власні класи помилок. Сервіси кидають їх, не знаючи нічого про HTTP-відповідь;
// централізований обробник (middlewares/errorHandler.js) перетворює їх на JSON.

export class AppError extends Error {
  constructor(message, status = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.details = details;
    this.isOperational = true; // очікувана помилка, а не баг у коді
  }
}

/** 400: errors — масив { field, message } */
export class ValidationError extends AppError {
  constructor(errors, message = 'Помилка валідації') {
    super(message, 400, errors);
  }
}

/** 401: немає токена, він недійсний або прострочений */
export class UnauthorizedError extends AppError {
  constructor(message = 'Потрібна автентифікація') {
    super(message, 401);
  }
}

/** 403: користувача впізнано, але прав недостатньо */
export class ForbiddenError extends AppError {
  constructor(message = 'Недостатньо прав для цієї дії') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Ресурс') {
    super(`${resource} не знайдено`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Конфлікт даних') {
    super(message, 409);
  }
}
