"use strict";

class BaseRestfullError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        this.code = this.constructor.name;
        this.message = message;
        Error.captureStackTrace(this, this.constructor.name);
    }
}

class InvalidArgumentError extends BaseRestfullError {
}

module.exports = {
    BaseRestfullError,
    InvalidArgumentError
};
