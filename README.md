# Loopback Reset Password Mixin
This module is written for [Strongloop Loopback](https://loopback.io/). 
This module automatically adds reset password functionality for your loopback project.
It implements a [loopback mixing](https://loopback.io/doc/en/lb2/Defining-mixins.html) object
to add reset password feature. 


### Plug And Play
Loopback Reset Password Mixin is a plug and play solution for setting up reset password with your loopback project.
This Module comes with an inbuilt UI and template for reset password, and confirm new password page,
so you don't have to write any HTML, CSS, JS code to use this mixin.


### Dependencies
This module uses [AWS-SES](https://aws.amazon.com/ses/) and [nodemailer](https://nodemailer.com/about/) 
for sending Emails. Right now only `AWS-SES` is supported in this module. If you want to use any other 
[transporter](https://nodemailer.com/transports/), you are welcome to submit a Pull Request for that.


### Installation

```
npm install loopback-reset-password-mixin --save
```

### Configuration

1. Install it ( If using with docker): 

    ```
    docker-compose run builder npm install https://github.com/aquid/loopback-reset-password-mixin
    docker-compose run builder npm shrinkwrap
    ````
1. The mixin should be added to any model class which prototypically inherits from loopback's `User` model
1. Let's say you decided to name the model `Employee`
1. Add `common/models/employee.js`

    ```
    module.exports = function(Employee) {
    };
    ```
1. Add `common/models/employee.json`

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
1. Add the following mixin configuration into the `common/models/employee.json` file

    ```
    "mixins": {
      "ResetPassword": {}
    }
    ```
1. After the changes it will end up looking like:

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
1. Add the employee model at the bottom of `server/model-config.json` file

    ```
      , "Employee": {
        "dataSource": "mongodb",
        "public": true
      }
    ```
1. Add the following to `server/model-config.json` file

    ```
    'mixins': [
      '../node_modules/loopback-reset-password-mixin'
    ]
    ```
    1. Before the changes, `server/model-config.json` file will look like:
    
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
    1. After the changes `server/model-config.json` will look like:
    
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
1. Add `body-parser` middleware and env vars for AWS into `server/middleware.json`
    1. Before the changes, file is like:
    
        ```
        "parse": {},
        ```
    1. After the changes:
    
         ```
         "parse": {
            "body-parser#json": {},
            "body-parser#urlencoded": {"params": { "extended": true }}
         },
         ```
1. Add `"protocol": "http || https",` to the `server/config.json` file
1. Check if your `config.json` file have `host` and `port` defined. If not, please add them like
    
    ```
        "host": "0.0.0.0",
        "port": "3000",
    ```
1. You will need to setup your SES on AWS for yourself.
1. Then setup the following SES environment variables in your environment
    * `AWS_ACCESS_KEY_ID=value`
    * `AWS_SECRET_ACCESS_KEY=value`
    * `AWS_DEFAULT_REGION=value`
    * `RESET_PASSWORD_EMAIL=value (eg: no-reply@xyz.com)`
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


#### NOTE
To send emails using `AWS-SES` you need to verify the domain or email that you want to act as a
source for your reset password emails. You can see [verify email and domains](http://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-addresses-and-domains.html) process in the link provided.
