1. Install it:

    ```
    docker-compose run builder npm install https://github.com/aquid/loopback-reset-password-mixin
    docker-compose run builder npm shrinkwrap
    ````
1. The mixin should be added to any model class which prototypically inherits from loopback's `User` model
1. Let's say you decided to name the model `Employee`
1. Added `common/models/employee.js`

    ```
    'use strict';
    module.exports = function(Employee) {
    };
    ```
1. Added `common/models/employee.json`

    ```
    {
      "name": "Employee",
      "base": "User",
      "idInjection": true,
      "options": {
        "validateUpsert": true
      },
      "properties": {
        "name": {
          "type": "string",
          "required": true,
          "default": "NA"
        }
      },
      "validations": [],
      "relations": {},
      "acls": [],
      "methods": {}
    }
    ```
1. Added the followin mixin configuration into the ``common/models/employee.json` file

    ```
    "mixins": {
      "ResetPassword": {}
    }
    ```
1. After the changes it ended up looking like:

    ```
    {
      "name": "Employee",
      "base": "User",
      "idInjection": true,
      "options": {
        "validateUpsert": true
      },
      "properties": {
        "name": {
          "type": "string",
          "required": true,
          "default": "NA"
        }
      },
      "validations": [],
      "relations": {},
      "acls": [],
      "methods": {},
      "mixins": {
        "ResetPassword": {}
      }
    }
    ```
1. Added the employee model at the bottom of `server/model-config.json` file

    ```
      , "Employee": {
        "dataSource": "mongodb",
        "public": true
      }
    ```
1. Added the following to `server/model-config.json` file

    ```
    'mixins': [
      '../node_modules/loopback-reset-password-mixin'
    ]
    ```
1. Before the changes, my file looked like:

    ```
    {
      "_meta": {
        "sources": [
          "loopback/common/models",
          "loopback/server/models",
          "../common/models",
          "./models"
        ],
        "mixins": [
          "loopback/common/mixins",
          "loopback/server/mixins",
          "../common/mixins",
          "./mixins"
        ]
      },
      ...
    ```
1. After the changes it looked like:

    ```
    {
      "_meta": {
        "sources": [
          "loopback/common/models",
          "loopback/server/models",
          "../common/models",
          "./models"
        ],
        "mixins": [
          "loopback/common/mixins",
          "loopback/server/mixins",
          "../common/mixins",
          "../node_modules/loopback-reset-password-mixin",
          "./mixins"
        ]
      },
      ...
    ```
1. Please do not copy/paste the `...` above like a silly person.
1. Added `body-parser` middleware and env vars for AWS into `server/middleware.json`
1. Before the changes, my file looked like:

    ```
    "parse": {},
    ```
1. After the changes it looked like:

  ```
  "parse": {
    "body-parser#json": {},
    "body-parser#urlencoded": {"params": { "extended": true }}
  },
  ```
1. Added `"protocol": "http",` to the `server/config.json` file
1. You will need to setup your SES on AWS for yourself.
1. Then setup the following SES varibles in your environment
    * `AWS_ACCESS_KEY_ID=value`
    * `AWS_SECRET_ACCESS_KEY=value`
    * `AWS_DEFAULT_REGION=value`
        ```
1. Start your API server
1. In a separate terminal, make an API request to create an employee:

    ```
    curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{
      "name": "User One",
      "username": "user1",
      "email": "user1@gmail.com",
      "password": "user1"
    }' 'http://localhost:3000/api/1.0/Employees'
    ```
    It should be successful.
1. Attempt a login:

    ```
    curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{
      "username":"user1",
      "password":"user1"
    }' 'http://localhost:3000/api/1.0/Employees/login'
    ```
    It should be successful.
1. Browse to `http://localhost:3000/request-password-reset`
1. Provide the email for password change
1. Wait and watch to make sure you receive the email
1. Use the link in the email to reset the password
1. The previous login should fail:

    ```
    curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/json' -d '{
      "username":"user1",
      "password":"user1"
    }' 'http://localhost:3000/api/1.0/Employees/login'
    ```
1. But logging in with new password should work
1. Done!
