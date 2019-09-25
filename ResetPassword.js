var nodemailer = require('nodemailer');
var path = require('path');
var aws = require('aws-sdk');
const sgMail = require('@sendgrid/mail');

module.exports = function (Model, options) {
	aws.config.region = process.env.AWS_DEFAULT_REGION || 'us-west-2';
	var transporter = nodemailer.createTransport({
		SES: new aws.SES({
			apiVersion: '2010-12-01'
		})
    });    

    sgMail.setApiKey(process.env.SENDGRIND_ACCESS_KEY);

    Model.on('attached' , function () {

		/**
         *
		 */
		Model.app.get('/request-password-reset', function (request, response, next) {
            response.sendFile(path.join(__dirname + '/views/reset-password.html'));
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
    });

    Model.on('resetPasswordRequest', function (info) {
        var settings = Model.app.settings;
        var url = settings.protocol+'://'+settings.host+':'+settings.port+'/confirm-password-reset?access_token=' + info.accessToken.id;
        var html = 'Click on <a href="'+ url + '">this</a> url to reset your password, if you have issues with the above link please use the direct url: ' + url;
        
        console.log(info.user.email + " is requesting password reset!");
        console.log(html);

        if(process.env.USE_SENDGRID == "true"){
            //Sendgrid          
            const msg = {
                to: info.user.email,
                from: process.env.RESET_PASSWORD_EMAIL,
                subject: 'Reset your password',   
                text: html,
                html: html
            };
            
            sgMail.send(msg).catch((err) =>{
                if(err){
                    console.log('error from the mailer', err.message);
                    try{
                        console.log(err.response.body.errors);
                    }catch{

                    }
                    console.log(process.env.SENDGRIND_ACCESS_KEY);
                    console.log(info.user.email);
                }else
                    console.log('success from the mailer using sendgrid');                
                //log error
            });
        }else{
            //AWS
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
        }
        
    });

};
