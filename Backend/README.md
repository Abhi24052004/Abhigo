# Backend API Documentation

## User Registration Endpoint

### Description
The `/users/register` endpoint is used to create a new user account. It validates the input data, hashes the password, and stores the user in the database. Upon successful registration, a JWT token is returned.

---

### Endpoint
```
POST /users/register
```

---

### Request Body
The request body must be a JSON object with the following fields:

```json
{
  "FullName": {
    "FirstName": "string",
    "LastName": "string"
  },
  "Email": "string",
  "pasword": "string"
}
```

#### Validation Rules:
- `FullName.FirstName`: Required, must be at least 3 characters long.
- `FullName.LastName`: Required, must be at least 3 characters long.
- `Email`: Required, must be a valid email address.
- `pasword`: Required, must be at least 6 characters long.

---

### Example Request
```json
{
  "FullName": {
    "FirstName": "John",
    "LastName": "Doe"
  },
  "Email": "john.doe@example.com",
  "pasword": "securePassword123"
}
```

---

### Success Response
**Status Code**: `201 Created`

```json
{
  "user": {
    "FullName": {
      "FirstName": "John",
      "LastName": "Doe"
    },
    "Email": "john.doe@example.com"
  },
  "token": "jwt_token_string"
}
```

---

### Error Responses

#### Validation Error
**Status Code**: `400 Bad Request`

```json
{
  "errrors": [
    {
      "msg": "Invalid Email",
      "param": "Email"
    }
  ]
}
```

#### Missing Required Fields
**Status Code**: `400 Bad Request`

```json
{
  "error": "all fields are required.."
}
```

---

### Notes
- Passwords are hashed using `bcrypt` before being stored in the database.
- A JWT token is generated upon successful registration, valid for 24 hours.
- The `Email` field must be unique in the database.
- The `socketId` field is optional and can be used for real-time communication purposes.

---

## User Login Endpoint

### Description
The `/users/login` endpoint is used to authenticate an existing user. It validates the input data, checks the credentials, and returns a JWT token upon successful login.

---

### Endpoint
```
POST /users/login
```

---

### Request Body
The request body must be a JSON object with the following fields:

```json
{
  "Email": "string",
  "pasword": "string"
}
```

#### Validation Rules:
- `Email`: Required, must be a valid email address.
- `pasword`: Required, must be at least 6 characters long.

---

### Example Request
```json
{
  "Email": "john.doe@example.com",
  "pasword": "securePassword123"
}
```

---

### Success Response
**Status Code**: `200 OK`

```json
{
  "user": {
    "FullName": {
      "FirstName": "John",
      "LastName": "Doe"
    },
    "Email": "john.doe@example.com"
  },
  "token": "jwt_token_string"
}
```

---

### Error Responses

#### Invalid Credentials
**Status Code**: `401 Unauthorized`

```json
{
  "message": "Invalid email or password"
}
```

#### Validation Error
**Status Code**: `400 Bad Request`

```json
{
  "errrors": [
    {
      "msg": "Invalid Email",
      "param": "Email"
    }
  ]
}
```

---

### Notes
- Passwords are compared using `bcrypt` to ensure security.
- A JWT token is generated upon successful login, valid for 24 hours.
- The `Email` field must match an existing user in the database.

---

### Related Files
- **Model**: `user.model.js` - Defines the user schema and methods for password hashing and token generation.
- **Service**: `user.services.js` - Handles the creation of a new user in the database.
- **Controller**: `user.controller.js` - Handles the registration and login logic.
- **Route**: `user.routes.js` - Defines the `/users/register` and `/users/login` endpoints and their validation rules.