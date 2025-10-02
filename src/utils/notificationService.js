// src/utils/notificationService.js (CONVERTED TO ESM)

const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');

// !!! IMPORTANT: REPLACE WITH YOUR ACTUAL AWS REGION !!!
const REGION = 'ap-south-1'; 

// !!! IMPORTANT: REPLACE WITH YOUR LAMBDA FUNCTION NAME !!!
const AuctionNotification = 'auction-notification-service'; 

const lambdaClient = new LambdaClient({ region: REGION });

/**
 * Triggers the Lambda function asynchronously to send a notification.
 * @param {object} payload - The data needed by the Lambda to form the notification.
 */
async function sendNotificationEvent(payload) {
    const command = new InvokeCommand({
        FunctionName: LAMBDA_FUNCTION_NAME,
        Payload: JSON.stringify(payload),
        InvocationType: 'Event', // 'Event' is asynchronous (fire-and-forget)
    });

    try {
        await lambdaClient.send(command);
        console.log(`Notification Lambda triggered for payload: ${JSON.stringify(payload)}`);
    } catch (error) {
        console.error('Lambda Invocation Error:', error);
        // EC2 continues running even if the notification fails asynchronously
    }
}

// Export the function using ESM syntax
module.exports = { sendNotificationEvent }; // <-- This CJS line is removed/replaced
