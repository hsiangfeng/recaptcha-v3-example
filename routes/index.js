require('dotenv').config();
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/recaptcha', async (req, res) => {
  const recaptchaToken = req.body.recaptchaToken;
  const recaptchaAction = req.body.action;

  const projectId = process.env.PROJECT_ID;
  const recaptchaKey = process.env.RECAPTCHA_KEY;

  const client = new RecaptchaEnterpriseServiceClient({
    credentials: {
      client_email: process.env.CLIENT_EMAIL,
      private_key: process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    }
  });
  const projectPath = client.projectPath(projectId);

  const request = ({
    assessment: {
      event: {
        token: recaptchaToken,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  });

  const [ response ] = await client.createAssessment(request);

  if (!response.tokenProperties.valid) {
    res.send({
      messages:`The CreateAssessment call failed because the token was: ${response.tokenProperties.invalidReason}`
    });
  }

  if (response.tokenProperties.action === recaptchaAction) {
    console.log(`The reCAPTCHA score is: ${response.riskAnalysis.score}`);

    response.riskAnalysis.reasons.forEach((reason) => {
      console.log(reason);
    });

    res.send({
      messages: `The reCAPTCHA score is: ${response.riskAnalysis.score}`,
      score: response.riskAnalysis.score
    });
  } else {
    res.send({
      messages: "The action attribute in your reCAPTCHA tag does not match the action you are expecting to score"
    });
  }
});

module.exports = router;
