"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePassword = void 0;
const validatePassword = (password) => {
    const errors = [];
    if (!password || password.length < 8) {
        errors.push("Password must be at least 8 characters long");
    }
    if (password && !/[a-zA-Z]/.test(password)) {
        errors.push("Password must contain at least one letter");
    }
    if (password && !/[0-9]/.test(password)) {
        errors.push("Password must contain at least one number");
    }
    return { valid: errors.length === 0, errors };
};
exports.validatePassword = validatePassword;
