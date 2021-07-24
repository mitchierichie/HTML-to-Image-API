// require modules
require('dotenv').config();
const express = require('express');
var cors = require('cors')
const puppeteer = require('puppeteer');
const { response } = require('express');

// initialize app
const app = express();

// setup boilerplate
app.use(express.urlencoded({ extended: false, limit: '50mb' }));
app.use(cors())
app.use(express.json({ limit: '50mb' }));

// initialize puppeteer function
(async () => {
	// launch headless browser
	const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

	// post request is made to render
	app.post('/render', (req, res) => {
		// make sure authorization is present
		if (req.headers.authorization === process.env.AUTH_KEY) {
			// make sure both html and css are included
			if (req.body.html) {
				// generate image function
				(async () => {
					// open new browser page
					const screenshotOptions = { type: 'png' };
					const page = await browser.newPage();
					const content = req.body.css ? `<style>${req.body.css}</style>` : req.body.html
					// fill content with user submitted html and css
					await page.setContent(
						content,
						{ waitUntil: 'networkidle0' }
					);

					if (req.body.clip) {
						screenshotOptions.clip = req.body.clip
					}

					const selector = req.body.selector || 'div'
					// define content area to take screenshot
					const element = await page.$(selector);
					// take screenshot in content area, save buffer
					const buffer = await element.screenshot();
					// close browser page
					// await page.close();
					// send back base64 string of image

					res.writeHead(200, {
						'Content-Type': 'image/png',
						'Content-Length': buffer.length
					});
					res.end(buffer);
					// res.status(200).json({dataURL: });
				})();
			} else {
				// if fields missing
				res.status(400).send('Some fields are missing with request.');
			}
		} else {
			// if no authorization present
			res.status(403).send('Auth key missing with request.');
		}
	});
})();

// listen to port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server started and running on port ' + PORT));
