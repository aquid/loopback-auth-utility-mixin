var nodemailer = require('nodemailer');
var path = require('path');
var aws = require('aws-sdk');

const SendOtp = require('sendotp');
const sendOtp = new SendOtp(process.env.MSG91_AUTH_KEY)

module.exports = function (Model, options) {
	aws.config.region = process.env.AWS_DEFAULT_REGION || 'us-west-2';
	var transporter = nodemailer.createTransport({
		SES: new aws.SES({
			apiVersion: '2010-12-01'
		})
	});

    Model.on('attached' , function () {

		/**
     *
		 */
		Model.app.get('/request-password-reset', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/reset-password.html'));
        });
		/**
     * Server HTML for requesting OTP
     */
		Model.app.get('/request-password-reset-phone', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/reset-password-phone.html'));
        });
		/**
     * Server HTML for veryfing OTP
		 */
		Model.app.get('/verify-otp', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/verify-otp.html'));
        });
		/**
		 *
		 */
        Model.app.get('/confirm-password-reset', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/confirm-password.html'));
        });

		/**
     *
		 */
        Model.app.post('/request-password-reset', function(request, response, next) {
            Model.resetPassword({
                email: request.body.email
            }, function(err) {
                if (err) return response.status(401).send(err);
                else return response.status(200).send({
                    statusCode:200,
                    message:'We have sent you a email. Please check your email to reset your password'
                });
            });
        });
    /**
      *  The following route is meant to generate OTP for valid users.
      */
        Model.app.post('/request-password-reset-phone', function(request, response, next) {
            /*
             * Check whether a user with the provided phone number exits.
             * Phone numbers which don't correspond to any user are cons-
             * dered unauthorized.
             */
            Model.findOne({ where: {
                phone: request.body.phone
            }}, (err, user) => {
                if(!user)
                    response.status(401).send({
                        statusCode:401,
                        message:'Invalid Phone Number'
                    });
                else {
                    /*
                     * Generate OTP by accessing the thrid party library.
                     */ 
                    sendOtp.send(request.body.phone, "PRIIND", function (error, data, result) {
                        if(data.type === 'success') {
                            response.send(true);
                        }
                        if(data.type == 'error') {
                            response.status(504).send({
                                "message":'OTP generation failed'
                            });
                        }
                    });
                }
            });
        });
    /**
      * The following route is meant for OTP verification.
      */
         Model.app.post('/verify-otp', function(request, response, next) {
             let phone = request.body.phone;
             let otp = request.body.otp;
             sendOtp.verify(phone, otp, function (error, data, result) {
                 if(data.type == 'success') {
                     /*
                      * Find user corresponding to the verfied phone number
                      */ 
                     Model.findOne({ where: {
                         phone: request.body.phone
                     }}, (err, user) => {
                          if(err) {
                              return response.status(504).send({
                                         "message":'OTP verification failed'
                                     });   
                          }
                          /* 
                          * Generate Access Token for users with successful 
                          * OTP verification. Access Token will be valid 
                          * for 24 hours.
                          */
                         user.createAccessToken(86400, (err, accessToken) => {
                             response.status(200).send({
                                 "accessToken": accessToken.id
                             });
                         });
                     });
                 }
                 if(data.type == 'error') {
                     response.status(504).send({
                         "message":'OTP verification failed'
                     });
                 }
             });
         });

		/**
		 *
		 */
        Model.app.post('/confirm-password-reset', function(request, response, next) {
            if(!request.accessToken)
                return response.status(404).send({
                    error: 'Incorrect Token',
                    statusCode:404,
                    message:'Valid token not found'});
            Model.findById(request.accessToken.userId, function(err, user) {
                if(err)
                    return response.status(404).send(err);
                else {
                    user.updateAttribute('password',request.body.password, function(err, res){
                        if (err) return response.status(404).send(err);
                        return response.status(200).send({
                            statusCode:200,
                            message:'password reset processed successfully'
                        });
                    });
                }
            });
        });
		/**
		 * The following route handles password reset for phone.
		 */
        Model.app.post('/confirm-password-reset-phone', function(request, response, next) {
            /*
             * Find the token data corresponding to the given 
             * token.
             */
            Model.relations.accessTokens.modelTo.findById(request.query.access_token, (err, token) => {
                /*
                 * Handle scenarios these scenarios:
                 * 1. Server fails to retreive token data
                 * 2. Request with invalid token 
                 */
                if(err) {
                    return response.status(503).send({
                               "statusCode" : 503,
                               "message":'Service Unavailable'
                    });   
                }

                if(!token) {
                    return response.status(401).send({
                               "statusCode" : 401,
                               "message":'Invalid token'
                    });   
                }

                /*
                 * Fetch user information corresponding to the 
                 * token.
                 */
                Model.findById(token.userId, (err, user) => {
                    /*
                     * Finally update the password for the user
                     */
                    if(err) {
                        return response.status(504).send({
                                   "statusCode" : 504,
                                   "message":'Error fetching in User'
                        });   
                    }
                    user.updateAttribute('password',request.body.password, function(err, res){
                        if (err) return response.status(404).send(err);
                        return response.status(200).send({
                            statusCode:200,
                            message:'password reset processed successfully'
                        });
                    });
                })
            })
        });
    });

    Model.on('resetPasswordRequest', function (info) {
        var settings = Model.app.settings;
        var html = 'Click on <a href="'+settings.protocol+'://'+settings.host+':'+settings.port+'/confirm-password-reset?access_token=' + info.accessToken.id + '">this</a> url to reset your password';
        transporter.sendMail({
            from: process.env.RESET_PASSWORD_EMAIL,
            to: info.user.email,
            subject: 'Reset your password',
            html: html
        }, function (err, success) {
        	if(err)
				console.log('error from the mailer', err);
        	else
        		console.log('success from the mailer', success);
        });
    });

};
